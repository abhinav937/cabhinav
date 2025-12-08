// Enhanced Space Background - Consolidated and Improved Implementation
// Features:
// - Performance optimizations (frame limiting, visibility checks, offscreen rendering)
// - Enhanced visuals (parallax, nebulae, varied star types, improved shooting stars)
// - Configurable options and user controls
// - Modern ES6+ code with proper cleanup

(function(global) {
    'use strict';

    // Configuration options
    const DEFAULT_CONFIG = {
        // Star layers - increased counts for denser starfield
        starLayers: [
            { count: 2000, speed: 0.008, size: [0.2, 0.6], color: 'white', parallax: 0.1 }, // Increased from 800
            { count: 1200, speed: 0.008, size: [0.6, 1.1], color: 'rgba(180,200,255,0.7)', parallax: 0.3 }, // Increased from 400
            { count: 600, speed: 0.003, size: [1.1, 1.8], color: 'rgba(255,220,200,0.6)', parallax: 0.5 }, // Increased from 150
            { count: 200, speed: 0.001, size: [1.8, 3.0], color: 'rgba(255,240,180,0.5)', parallax: 0.8 } // Increased from 50
        ],

        // Shooting stars
        shootingStarFreq: 0.0015,
        shootingStarLifetime: 1400,

        // Starlink trains
        enableStarlinkTrains: true,
        starlinkTrainFreq: 0.00067, // ~1 per 25 seconds
        starlinkTrainLifetime: 8000, // Longer lifetime for trains
        starlinkSatellitesPerTrain: 8, // Number of satellites in a train

        // Nebula
        enableNebula: true,
        nebulaCount: 4, // Increased for better coverage

        // Performance
        targetFps: 60,
        enableVisibilityCheck: true,
        enableOffscreenRendering: true,

        // Controls
        enableControls: false,
        animationSpeed: 1.0,
        starDensity: 1.0,

        // Colors
        backgroundColor: '#161618',

        // Mobile optimizations
        mobileOptimizations: true
    };

    class EnhancedSpaceBackground {
        constructor(target, config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.container = this.getContainer(target);
            if (!this.container) return;

            this.isMobile = window.innerWidth <= 768;
            if (this.isMobile && this.config.mobileOptimizations) {
                this.optimizeForMobile();
            }

            this.init();
            this.bindEvents();
        }

        getContainer(target) {
            if (typeof target === 'string') {
                return document.querySelector(target);
            }
            return target;
        }

        optimizeForMobile() {
            // Reduce star counts and effects on mobile, but keep 60fps
            this.config.starLayers = this.config.starLayers.map(layer => ({
                ...layer,
                count: Math.floor(layer.count * 0.3) // Reduced from 0.4 to 0.3 for denser mobile stars
            }));
            this.config.nebulaCount = 2; // Reduced but still visible on mobile
            // Always target 60fps or higher
            this.config.targetFps = 60;
        }

        init() {
            this.createCanvas();
            this.setupOffscreenRendering();
            this.createStars();
            this.createNebula();
            this.createControls();
            this.resize();

            // Start animation
            this.lastFrameTime = 0;
            this.globalAngle = 0;
            this.shootingStars = [];
            this.starlinkTrains = [];
            this.animationId = null;
            this.isVisible = true;

            this.startAnimation();
        }

        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'enhanced-space-bg-canvas';
            this.ctx = this.canvas.getContext('2d');

            // Style canvas
            Object.assign(this.canvas.style, {
                display: 'block',
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: '0'
            });

            this.container.appendChild(this.canvas);
        }

        setupOffscreenRendering() {
            if (!this.config.enableOffscreenRendering) return;

            // Create offscreen canvas for static elements (nebula)
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        }

        createStars() {
            this.stars = [];
            this.config.starLayers.forEach((layer, layerIndex) => {
                const adjustedCount = Math.floor(layer.count * this.config.starDensity);
                for (let i = 0; i < adjustedCount; i++) {
                    this.stars.push(this.createStar(layer, layerIndex));
                }
            });
        }

        createStar(layer, layerIndex) {
            const angle = this.rand(0, Math.PI * 2);
            const radius = this.rand(0, Math.max(this.canvas.width || 1920, this.canvas.height || 1080) * 1.5);

            return {
                baseSize: this.rand(layer.size[0], layer.size[1]),
                color: layer.color,
                twinkleSpeed: this.rand(0.0008, 0.002),
                twinklePhase: this.rand(0, Math.PI * 2),
                layer: layerIndex,
                parallax: layer.parallax,
                angle: angle,
                radius: radius,
                // Add random drift for more natural movement
                driftX: this.rand(-0.001, 0.001),
                driftY: this.rand(-0.001, 0.001),
                driftAngle: angle,
                // Star type variation
                type: this.rand(0, 1) > 0.7 ? 'cross' : 'circle'
            };
        }

        createNebula() {
            if (!this.config.enableNebula) return;

            this.nebula = [];
            for (let i = 0; i < this.config.nebulaCount; i++) {
                // Create more complex nebula with multiple color layers
                const nebulaColors = this.getRandomNebulaColors();
                this.nebula.push({
                    x: this.rand(0, this.canvas.width || 1920),
                    y: this.rand(0, this.canvas.height || 1080),
                    radius: this.rand(300, 600), // Larger for better visibility
                    colors: nebulaColors,
                    baseOpacity: this.rand(0.08, 0.15), // More visible
                    pulsateSpeed: this.rand(0.0005, 0.001), // Slower, smoother pulsation
                    pulsatePhase: this.rand(0, Math.PI * 2),
                    secondaryRadius: this.rand(150, 300), // Secondary cloud layer
                    secondaryOffset: {
                        x: this.rand(-100, 100),
                        y: this.rand(-100, 100)
                    }
                });
            }
        }

        getRandomNebulaColors() {
            // Return multiple colors for layered, more realistic nebula
            const colorSchemes = [
                // Blue nebula with purple accents
                {
                    primary: 'rgba(100, 150, 255, 0.08)',
                    secondary: 'rgba(150, 100, 255, 0.05)',
                    tertiary: 'rgba(80, 120, 200, 0.03)'
                },
                // Pink/Purple nebula
                {
                    primary: 'rgba(255, 120, 200, 0.08)',
                    secondary: 'rgba(200, 100, 255, 0.05)',
                    tertiary: 'rgba(255, 150, 180, 0.03)'
                },
                // Green nebula
                {
                    primary: 'rgba(120, 255, 150, 0.08)',
                    secondary: 'rgba(100, 200, 120, 0.05)',
                    tertiary: 'rgba(150, 255, 180, 0.03)'
                },
                // Orange nebula
                {
                    primary: 'rgba(255, 180, 100, 0.08)',
                    secondary: 'rgba(255, 150, 80, 0.05)',
                    tertiary: 'rgba(200, 120, 60, 0.03)'
                },
                // Mixed nebula (blue-pink)
                {
                    primary: 'rgba(150, 180, 255, 0.08)',
                    secondary: 'rgba(255, 150, 220, 0.05)',
                    tertiary: 'rgba(180, 200, 255, 0.03)'
                }
            ];
            return colorSchemes[Math.floor(this.rand(0, colorSchemes.length))];
        }

        createControls() {
            if (!this.config.enableControls) return;

            // Create control panel (could be enhanced with a proper UI)
            this.controls = {
                speed: this.config.animationSpeed,
                density: this.config.starDensity
            };
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width || window.innerWidth;
            this.canvas.height = rect.height || window.innerHeight;

            if (this.config.enableOffscreenRendering) {
                this.offscreenCanvas.width = this.canvas.width;
                this.offscreenCanvas.height = this.canvas.height;
                this.renderNebulaToOffscreen();
            }

            this.createStars();
            this.createNebula();
        }

        renderNebulaToOffscreen() {
            if (!this.offscreenCtx || !this.nebula) return;

            this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

            this.nebula.forEach(nebula => {
                const time = Date.now();
                const pulsate = 0.7 + 0.3 * Math.sin(time * nebula.pulsateSpeed + nebula.pulsatePhase);
                const slowPulsate = 0.8 + 0.2 * Math.sin(time * nebula.pulsateSpeed * 0.3 + nebula.pulsatePhase);

                // Main nebula cloud
                const mainRadius = nebula.radius * pulsate;
                const mainGradient = this.offscreenCtx.createRadialGradient(
                    nebula.x, nebula.y, 0,
                    nebula.x, nebula.y, mainRadius
                );
                const mainOpacity = nebula.baseOpacity * pulsate;
                mainGradient.addColorStop(0, nebula.colors.primary.replace('0.08', mainOpacity.toString()));
                mainGradient.addColorStop(0.4, nebula.colors.secondary.replace('0.05', (mainOpacity * 0.6).toString()));
                mainGradient.addColorStop(0.8, nebula.colors.tertiary.replace('0.03', (mainOpacity * 0.3).toString()));
                mainGradient.addColorStop(1, 'transparent');

                this.offscreenCtx.fillStyle = mainGradient;
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(nebula.x, nebula.y, mainRadius, 0, Math.PI * 2);
                this.offscreenCtx.fill();

                // Secondary cloud layer for more depth
                const secondaryRadius = nebula.secondaryRadius * slowPulsate;
                const secondaryX = nebula.x + nebula.secondaryOffset.x * slowPulsate;
                const secondaryY = nebula.y + nebula.secondaryOffset.y * slowPulsate;

                const secondaryGradient = this.offscreenCtx.createRadialGradient(
                    secondaryX, secondaryY, 0,
                    secondaryX, secondaryY, secondaryRadius
                );
                const secondaryOpacity = nebula.baseOpacity * 0.4 * slowPulsate;
                secondaryGradient.addColorStop(0, nebula.colors.secondary.replace('0.05', secondaryOpacity.toString()));
                secondaryGradient.addColorStop(0.6, nebula.colors.tertiary.replace('0.03', (secondaryOpacity * 0.5).toString()));
                secondaryGradient.addColorStop(1, 'transparent');

                this.offscreenCtx.fillStyle = secondaryGradient;
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(secondaryX, secondaryY, secondaryRadius, 0, Math.PI * 2);
                this.offscreenCtx.fill();

                // Add subtle noise/sparkle effect
                this.addNebulaSparkles(nebula, time);
            });
        }

        addNebulaSparkles(nebula, time) {
            // Add subtle sparkling effects within nebula regions
            const sparkleCount = 3;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (time * 0.001 + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
                const distance = nebula.radius * 0.3 * (0.8 + 0.4 * Math.sin(time * 0.002 + nebula.pulsatePhase + i));
                const sparkleX = nebula.x + Math.cos(angle) * distance;
                const sparkleY = nebula.y + Math.sin(angle) * distance;

                const sparkleOpacity = nebula.baseOpacity * 0.3 * (0.5 + 0.5 * Math.sin(time * 0.003 + i));

                this.offscreenCtx.fillStyle = `rgba(255, 255, 255, ${sparkleOpacity})`;
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(sparkleX, sparkleY, 1 + Math.sin(time * 0.004 + i) * 0.5, 0, Math.PI * 2);
                this.offscreenCtx.fill();
            }
        }

        drawBackground() {
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw nebula from offscreen canvas if available
            if (this.offscreenCanvas) {
                this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            }
        }

        drawStars(globalAngle) {
            const now = Date.now();
            const cx = this.canvas.width * 1.5;
            const cy = this.canvas.height * 1.5;

            this.stars.forEach(star => {
                // Apply parallax and drift
                const parallaxAngle = globalAngle * (1 + star.parallax);
                const driftAngle = star.driftAngle + now * star.driftX;
                const angle = star.angle + parallaxAngle + driftAngle * 0.1;

                const x = cx + Math.cos(angle) * star.radius;
                const y = cy + Math.sin(angle) * star.radius;

                // Only draw if star is visible on screen
                if (x < -50 || x > this.canvas.width + 50 ||
                    y < -50 || y > this.canvas.height + 50) return;

                const twinkle = 0.6 + 0.4 * Math.sin(now * star.twinkleSpeed + star.twinklePhase);
                const size = star.baseSize * twinkle;

                this.drawStar(star, x, y, size, twinkle);
            });
        }

        drawStar(star, x, y, size, twinkle) {
            // Glow effect for larger stars
            if (star.baseSize > 1.5) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.2 * twinkle;
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = star.color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = star.color;
                this.ctx.fill();
                this.ctx.restore();
            }

            // Main star
            this.ctx.save();
            this.ctx.globalAlpha = 0.9 * twinkle;
            this.ctx.shadowBlur = star.baseSize > 2 ? 10 : 3;
            this.ctx.shadowColor = star.color;

            if (star.type === 'cross' && size > 1) {
                // Draw cross-shaped star
                const lineWidth = size * 0.3;
                this.ctx.lineWidth = lineWidth;
                this.ctx.lineCap = 'round';
                this.ctx.strokeStyle = star.color;
                this.ctx.beginPath();
                this.ctx.moveTo(x - size, y);
                this.ctx.lineTo(x + size, y);
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x, y + size);
                this.ctx.stroke();
            } else {
                // Draw circular star
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = star.color;
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        spawnShootingStar(groupOffset = 0, sharedAngle = null) {
            const margin = 60;

            // Always spawn in 1st quadrant (top-right) - from center-right to top-right
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            let x = this.rand(centerX, this.canvas.width - margin) + groupOffset * 60; // Wider spacing for parallel meteors
            let y = this.rand(margin, centerY) + groupOffset * 30; // Consistent vertical offset for parallel meteors

            // Always travel diagonally to 3rd quadrant (bottom-left)
            // For parallel groups, ALL meteors use the SAME angle
            let angle;
            if (sharedAngle !== null) {
                // Use the shared angle for parallel meteors
                angle = sharedAngle;
            } else {
                // Generate new angle for single meteors
                const baseAngle = Math.PI * 3/4; // 135 degrees - diagonal to bottom-left
                const angleVariation = Math.PI / 6; // ±30 degrees variation for single meteors
                angle = baseAngle + this.rand(-angleVariation, angleVariation);
            }

            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            this.shootingStars.push({
                x, y, dx, dy,
                start: Date.now(),
                len: this.rand(300, 600),
                size: this.rand(1.0, 2.0),
                color: this.getRandomShootingStarColor(),
                trailParticles: []
            });
        }

        spawnStarlinkTrain() {
            // Starlink trains appear as a line of satellites moving across the sky
            const margin = 100;

            // Choose spawn side - can come from any edge
            const spawnSide = Math.floor(this.rand(0, 4)); // 0: top, 1: right, 2: bottom, 3: left
            let startX, startY, endX, endY;

            switch (spawnSide) {
                case 0: // From top
                    startX = this.rand(-margin, this.canvas.width + margin);
                    startY = -margin;
                    endX = startX + this.rand(-200, 200);
                    endY = this.canvas.height + margin;
                    break;
                case 1: // From right
                    startX = this.canvas.width + margin;
                    startY = this.rand(-margin, this.canvas.height + margin);
                    endX = -margin;
                    endY = startY + this.rand(-200, 200);
                    break;
                case 2: // From bottom
                    startX = this.rand(-margin, this.canvas.width + margin);
                    startY = this.canvas.height + margin;
                    endX = startX + this.rand(-200, 200);
                    endY = -margin;
                    break;
                case 3: // From left
                    startX = -margin;
                    startY = this.rand(-margin, this.canvas.height + margin);
                    endX = this.canvas.width + margin;
                    endY = startY + this.rand(-200, 200);
                    break;
            }

            // Calculate direction and distance
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = this.rand(0.8, 1.5); // Slower than shooting stars

            // Create satellite train - satellites close enough to be distinctly visible
            const satellites = [];
            // Space satellites so they're visibly separate but in formation (about 25-35px apart)
            const satelliteSpacing = 25 + this.rand(0, 10); // 25-35px between satellites

            // Position satellites along the travel path with proper spacing
            const totalTrainLength = satelliteSpacing * (this.config.starlinkSatellitesPerTrain - 1);
            const trainStartProgress = this.rand(0.1, 0.9 - (totalTrainLength / distance)); // Ensure train fits in view

            for (let i = 0; i < this.config.starlinkSatellitesPerTrain; i++) {
                // Position each satellite along the path with consistent spacing
                const satelliteProgress = trainStartProgress + (i * satelliteSpacing / distance);
                const satelliteX = startX + dx * satelliteProgress;
                const satelliteY = startY + dy * satelliteProgress;

                satellites.push({
                    x: satelliteX,
                    y: satelliteY,
                    baseSize: this.rand(1.5, 2.5),
                    brightness: this.rand(0.7, 1.0),
                    twinkleSpeed: this.rand(0.002, 0.005),
                    twinklePhase: this.rand(0, Math.PI * 2)
                });
            }

            this.starlinkTrains.push({
                satellites,
                start: Date.now(),
                dx: (dx / distance) * speed,
                dy: (dy / distance) * speed,
                speed: speed,
                distance: distance
            });
        }

        getRandomShootingStarColor() {
            const colors = [
                'rgba(255,255,255,0.95)',  // White
                'rgba(180,200,255,0.9)',   // Blue-white
                'rgba(255,220,200,0.9)'    // Yellow-white
            ];
            return colors[Math.floor(this.rand(0, colors.length))];
        }

        drawShootingStars() {
            const now = Date.now();
            this.shootingStars = this.shootingStars.filter(star => now - star.start < this.config.shootingStarLifetime);

            this.shootingStars.forEach(star => {
                const age = now - star.start;
                const progress = age / this.config.shootingStarLifetime;
                const fade = 1 - progress;

                // Move shooting star
                const speed = star.len / this.config.shootingStarLifetime * 20;
                star.x += star.dx * speed;
                star.y += star.dy * speed;

                // Draw trail
                const tailLen = star.len * fade;
                const tailX = star.x - star.dx * tailLen;
                const tailY = star.y - star.dy * tailLen;

                // Gradient trail
                const grad = this.ctx.createLinearGradient(star.x, star.y, tailX, tailY);
                const color = star.color;
                grad.addColorStop(0, color.replace('0.9', (0.9 * fade).toString()));
                grad.addColorStop(0.3, color.replace('0.9', (0.4 * fade).toString()));
                grad.addColorStop(1, 'transparent');

                this.ctx.save();
                this.ctx.globalAlpha = 1;
                this.ctx.strokeStyle = grad;
                this.ctx.lineWidth = star.size * (0.6 + 0.8 * fade);
                this.ctx.lineCap = 'round';
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = 'white';
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(tailX, tailY);
                this.ctx.stroke();
                this.ctx.restore();

                // Bright head
                this.ctx.save();
                this.ctx.globalAlpha = 0.9 * fade;
                this.ctx.shadowBlur = 25;
                this.ctx.shadowColor = 'white';
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
                this.ctx.fillStyle = star.color;
                this.ctx.fill();
                this.ctx.restore();
            });
        }

        drawStarlinkTrains() {
            const now = Date.now();

            // Filter out expired trains
            this.starlinkTrains = this.starlinkTrains.filter(train =>
                now - train.start < this.config.starlinkTrainLifetime
            );

            this.starlinkTrains.forEach(train => {
                const age = now - train.start;
                const progress = age / this.config.starlinkTrainLifetime;
                const fade = 1 - progress;

                // Move entire train
                train.satellites.forEach((satellite, index) => {
                    satellite.x += train.dx;
                    satellite.y += train.dy;

                    // Only draw satellites that are visible on screen
                    if (satellite.x < -50 || satellite.x > this.canvas.width + 50 ||
                        satellite.y < -50 || satellite.y > this.canvas.height + 50) {
                        return;
                    }

                    // Twinkle effect for each satellite
                    const twinkle = satellite.brightness * (0.7 + 0.3 * Math.sin(now * satellite.twinkleSpeed + satellite.twinklePhase));

                    // Draw satellite glow
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.3 * fade * twinkle;
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = 'white';
                    this.ctx.beginPath();
                    this.ctx.arc(satellite.x, satellite.y, satellite.baseSize * 2, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'white';
                    this.ctx.fill();
                    this.ctx.restore();

                    // Draw main satellite
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.9 * fade * twinkle;
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = 'white';
                    this.ctx.beginPath();
                    this.ctx.arc(satellite.x, satellite.y, satellite.baseSize, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'white';
                    this.ctx.fill();
                    this.ctx.restore();
                });
            });
        }

        animate = (currentTime) => {
            // Frame rate limiting
            if (currentTime - this.lastFrameTime < (1000 / this.config.targetFps)) {
                this.animationId = requestAnimationFrame(this.animate);
                return;
            }
            this.lastFrameTime = currentTime;

            // Visibility check
            if (this.config.enableVisibilityCheck && document.hidden) {
                this.animationId = requestAnimationFrame(this.animate);
                return;
            }

            this.drawBackground();
            this.drawStars(this.globalAngle);
            this.drawShootingStars();
            this.drawStarlinkTrains();

            this.globalAngle += 0.0002 * this.config.animationSpeed;

            // Spawn shooting stars
            if (Math.random() < this.config.shootingStarFreq) {
                // Moderately spawn multiple meteors in parallel
                const meteorCount = this.rand(0, 1) < 0.15 ? (this.rand(0, 1) < 0.7 ? 2 : 3) : 1;

                // Generate ONE shared angle for ALL meteors (always use shared angle for consistency)
                const sharedAngle = (() => {
                    const baseAngle = Math.PI * 3/4; // 135 degrees - diagonal to bottom-left
                    const angleVariation = Math.PI / 6; // ±30 degrees variation
                    return baseAngle + this.rand(-angleVariation, angleVariation);
                })();

                for (let i = 0; i < meteorCount; i++) {
                    setTimeout(() => {
                        // Pass offset and shared angle to create truly parallel meteor groups
                        const offset = meteorCount > 1 ? (i - (meteorCount - 1) / 2) : 0;
                        this.spawnShootingStar(offset, sharedAngle);
                    }, i * 200); // Moderate stagger
                }
            }

            // Spawn Starlink trains
            if (this.config.enableStarlinkTrains && Math.random() < this.config.starlinkTrainFreq) {
                this.spawnStarlinkTrain();
            }

            this.animationId = requestAnimationFrame(this.animate);
        }

        startAnimation() {
            if (this.animationId) return;
            this.animationId = requestAnimationFrame(this.animate);
        }

        stopAnimation() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }

        bindEvents() {
            this.resizeHandler = () => this.resize();
            this.visibilityHandler = () => {
                this.isVisible = !document.hidden;
                if (this.isVisible) {
                    this.startAnimation();
                }
            };

            window.addEventListener('resize', this.resizeHandler);
            if (this.config.enableVisibilityCheck) {
                document.addEventListener('visibilitychange', this.visibilityHandler);
            }
        }

        destroy() {
            this.stopAnimation();
            window.removeEventListener('resize', this.resizeHandler);
            if (this.config.enableVisibilityCheck) {
                document.removeEventListener('visibilitychange', this.visibilityHandler);
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }

        // Utility methods
        rand(min, max) {
            return Math.random() * (max - min) + min;
        }

        // Public API methods
        setAnimationSpeed(speed) {
            this.config.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
        }

        setStarDensity(density) {
            this.config.starDensity = Math.max(0.1, Math.min(3.0, density));
            this.createStars();
        }

        toggleNebula() {
            this.config.enableNebula = !this.config.enableNebula;
            if (this.config.enableNebula) {
                this.createNebula();
            } else {
                this.nebula = [];
            }
        }

        toggleStarlinkTrains() {
            this.config.enableStarlinkTrains = !this.config.enableStarlinkTrains;
            if (!this.config.enableStarlinkTrains) {
                this.starlinkTrains = []; // Clear any active trains
            }
        }

        spawnStarlinkTrainManual() {
            if (this.config.enableStarlinkTrains) {
                this.spawnStarlinkTrain();
            }
        }

        spawnShootingStarManual() {
            // Increased chance of multiple meteors in parallel
            const meteorCount = this.rand(0, 1) < 0.4 ? (this.rand(0, 1) < 0.6 ? 2 : 3) : 1;

            // Generate ONE shared angle for ALL meteors in the group (truly parallel)
            const sharedAngle = (() => {
                const baseAngle = Math.PI * 3/4; // 135 degrees - diagonal to bottom-left
                const angleVariation = Math.PI / 6; // ±30 degrees variation
                return baseAngle + this.rand(-angleVariation, angleVariation);
            })();

            for (let i = 0; i < meteorCount; i++) {
                setTimeout(() => {
                    // Pass offset and shared angle to create truly parallel meteor groups
                    const offset = meteorCount > 1 ? (i - (meteorCount - 1) / 2) : 0;
                    this.spawnShootingStar(offset, sharedAngle);
                }, i * 300); // Longer stagger for dramatic effect
            }
        }
    }

    // Global initialization function
    global.initEnhancedSpaceBackground = function(target, config) {
        return new EnhancedSpaceBackground(target, config);
    };

    // Auto-initialize if container exists (disabled when manual init is used)
    // document.addEventListener('DOMContentLoaded', function() {
    //     const spaceContainer = document.getElementById('space-container') || document.body;
    //     if (spaceContainer && !spaceContainer.querySelector('.enhanced-space-bg-canvas')) {
    //         global.initEnhancedSpaceBackground(spaceContainer, {
    //             enableControls: false,
    //             mobileOptimizations: true
    //         });
    //     }
    // });

})(window);
