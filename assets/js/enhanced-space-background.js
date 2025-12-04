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
        // Star layers
        starLayers: [
            { count: 800, speed: 0.02, size: [0.2, 0.6], color: 'white', parallax: 0.1 },
            { count: 400, speed: 0.008, size: [0.6, 1.1], color: 'rgba(180,200,255,0.7)', parallax: 0.3 },
            { count: 150, speed: 0.003, size: [1.1, 1.8], color: 'rgba(255,220,200,0.6)', parallax: 0.5 },
            { count: 50, speed: 0.001, size: [1.8, 3.0], color: 'rgba(255,240,180,0.5)', parallax: 0.8 }
        ],

        // Shooting stars
        shootingStarFreq: 0.0015,
        shootingStarLifetime: 1400,

        // Nebula
        enableNebula: true,
        nebulaCount: 3,

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
                count: Math.floor(layer.count * 0.4)
            }));
            this.config.nebulaCount = 1;
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
                this.nebula.push({
                    x: this.rand(0, this.canvas.width || 1920),
                    y: this.rand(0, this.canvas.height || 1080),
                    radius: this.rand(200, 400),
                    color: this.getRandomNebulaColor(),
                    opacity: this.rand(0.03, 0.08),
                    pulsateSpeed: this.rand(0.001, 0.003),
                    pulsatePhase: this.rand(0, Math.PI * 2)
                });
            }
        }

        getRandomNebulaColor() {
            const colors = [
                'rgba(100, 150, 255, 0.1)',  // Blue
                'rgba(255, 100, 150, 0.1)',  // Pink
                'rgba(150, 255, 100, 0.1)',  // Green
                'rgba(255, 150, 100, 0.1)'   // Orange
            ];
            return colors[Math.floor(this.rand(0, colors.length))];
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
                const pulsate = 0.8 + 0.4 * Math.sin(Date.now() * nebula.pulsateSpeed + nebula.pulsatePhase);
                const radius = nebula.radius * pulsate;

                const gradient = this.offscreenCtx.createRadialGradient(
                    nebula.x, nebula.y, 0,
                    nebula.x, nebula.y, radius
                );
                gradient.addColorStop(0, nebula.color.replace('0.1', (nebula.opacity * pulsate).toString()));
                gradient.addColorStop(1, 'transparent');

                this.offscreenCtx.fillStyle = gradient;
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(nebula.x, nebula.y, radius, 0, Math.PI * 2);
                this.offscreenCtx.fill();
            });
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

        spawnShootingStar() {
            const margin = 60;
            const spawnFromTop = this.rand(0, 1) > 0.3; // 70% from top

            let x, y, angle;
            if (spawnFromTop) {
                x = this.rand(margin, this.canvas.width - margin);
                y = margin;
                // Various angles from top
                const angleOptions = [
                    this.rand(Math.PI / 6, Math.PI / 3),    // Right-down
                    this.rand(Math.PI * 4/6, Math.PI * 5/6), // Left-down
                    this.rand(Math.PI * 2/3, Math.PI * 5/6)  // More left-down
                ];
                angle = angleOptions[Math.floor(this.rand(0, angleOptions.length))];
            } else {
                // Spawn from sides occasionally
                const fromLeft = this.rand(0, 1) > 0.5;
                x = fromLeft ? margin : this.canvas.width - margin;
                y = this.rand(margin, this.canvas.height - margin);
                angle = fromLeft ?
                    this.rand(Math.PI / 4, Math.PI * 3/4) :  // Right-down from left
                    this.rand(Math.PI * 5/4, Math.PI * 7/4); // Left-down from right
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

            this.globalAngle += 0.0002 * this.config.animationSpeed;

            // Spawn shooting stars
            if (Math.random() < this.config.shootingStarFreq) {
                this.spawnShootingStar();
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
            this.config.starDensity = Math.max(0.1, Math.min(2.0, density));
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
    }

    // Global initialization function
    global.initEnhancedSpaceBackground = function(target, config) {
        return new EnhancedSpaceBackground(target, config);
    };

    // Auto-initialize if container exists
    document.addEventListener('DOMContentLoaded', function() {
        const spaceContainer = document.getElementById('space-container') || document.body;
        if (spaceContainer && !spaceContainer.querySelector('.enhanced-space-bg-canvas')) {
            global.initEnhancedSpaceBackground(spaceContainer, {
                enableControls: false,
                mobileOptimizations: true
            });
        }
    });

})(window);
