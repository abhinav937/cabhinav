// Modular Space Background
// Usage: initSpaceBackground(targetElementOrSelector)
(function(global) {
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function initSpaceBackground(target) {
        let container;
        if (typeof target === 'string') {
            container = document.querySelector(target);
        } else {
            container = target;
        }
        if (!container) return;

        // Create and style canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'space-bg-canvas';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Star layers
        const STAR_LAYERS = [
            { count: 1000, speed: 0.03, size: [0.3, 0.8], color: 'white' },
            { count: 500, speed: 0.01, size: [0.8, 1.3], color: 'rgba(180,200,255,0.7)' },
            { count: 200, speed: 0.005, size: [1.3, 2], color: 'rgba(255,220,200,0.6)' }
        ];
        let stars = [];
        function createStars() {
            stars = [];
            STAR_LAYERS.forEach((layer, i) => {
                for (let j = 0; j < layer.count; j++) {
                    const angle = rand(0, Math.PI * 2);
                    const radius = rand(0, Math.max(canvas.width, canvas.height) * 1.5);
                    stars.push({
                        baseSize: rand(layer.size[0], layer.size[1]),
                        color: layer.color,
                        twinkleSpeed: rand(0.001, 0.003),
                        twinklePhase: rand(0, Math.PI * 2),
                        layer: i,
                        angle: angle,
                        radius: radius
                    });
                }
            });
        }
        
        function resize() {
            // For fixed containers, use window dimensions directly
            const isFixed = window.getComputedStyle(container).position === 'fixed';
            if (isFixed) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            } else {
                canvas.width = container.clientWidth || window.innerWidth;
                canvas.height = container.clientHeight || window.innerHeight;
            }
            // Immediately draw dark background to prevent white flash
            ctx.fillStyle = '#161618';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            createStars();
        }
        // Throttle resize handler to prevent excessive redraws
        let resizeTimeout;
        function throttledResize() {
            // Immediately draw dark background to prevent flash
            if (canvas) {
                ctx.fillStyle = '#161618';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            // Clear any pending resize
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            // Throttle the actual resize operation
            resizeTimeout = setTimeout(() => {
                resize();
            }, 16); // ~60fps throttle
        }
        window.addEventListener('resize', throttledResize);

        function drawBackground() {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#161618'; // Match space site background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        function drawStars(globalAngle) {
            const now = Date.now();
            const cx = canvas.width * 1.5;
            const cy = canvas.height * 1.5;
            stars.forEach(star => {
                const angle = star.angle + globalAngle;
                const x = cx + Math.cos(angle) * star.radius;
                const y = cy + Math.sin(angle) * star.radius;
                const twinkle = 0.7 + 0.3 * Math.sin(now * star.twinkleSpeed + star.twinklePhase);
                const size = star.baseSize * twinkle;
                if (star.baseSize > 1.5) {
                    ctx.save();
                    ctx.globalAlpha = 0.3 * twinkle;
                    ctx.shadowBlur = 16;
                    ctx.shadowColor = star.color;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 1.7, 0, Math.PI * 2);
                    ctx.fillStyle = star.color;
                    ctx.fill();
                    ctx.restore();
                }
                const fadeAlpha = 0.85 * twinkle;
                const fadeBlur = (star.baseSize > 2 ? 8 : 2) * fadeAlpha; // scale blur with alpha
                ctx.save();
                ctx.globalAlpha = fadeAlpha;
                ctx.shadowBlur = fadeBlur;
                ctx.shadowColor = star.color;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.fill();
                ctx.restore();
            });
        }

        // Shooting stars
        const SHOOTING_STAR_FREQ = 0.002;
        const SHOOTING_STAR_LIFETIME = 1200;
        let shootingStars = [];
        function spawnShootingStar() {
            const margin = 40;
            const x = rand(margin, canvas.width - margin);
            const y = margin;
            const angleBase = rand(Math.PI / 12, Math.PI / 4);
            const angle = Math.PI - angleBase;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            shootingStars.push({
                x, y, dx, dy, start: Date.now(),
                len: rand(320, 480),
                size: rand(1.1, 1.7),
                color: 'rgba(255,255,255,0.98)'
            });
        }
        function drawShootingStars() {
            const now = Date.now();
            shootingStars = shootingStars.filter(star => now - star.start < SHOOTING_STAR_LIFETIME);
            shootingStars.forEach(star => {
                const age = now - star.start;
                const fade = 1 - age / SHOOTING_STAR_LIFETIME;
                star.x += star.dx * star.len / SHOOTING_STAR_LIFETIME * 16;
                star.y += star.dy * star.len / SHOOTING_STAR_LIFETIME * 16;
                let tailLen = star.len * fade;
                const tailX = star.x - star.dx * tailLen;
                const tailY = star.y - star.dy * tailLen;
                const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255,255,255,${0.8 * fade})`);
                grad.addColorStop(0.2, `rgba(255,255,255,${0.25 * fade})`);
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(tailX, tailY);
                ctx.lineWidth = star.size * (0.8 + 0.7 * fade);
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'white';
                ctx.stroke();
                ctx.restore();
                ctx.save();
                ctx.globalAlpha = 0.85 * fade;
                ctx.shadowBlur = 18;
                ctx.shadowColor = 'white';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.restore();
            });
        }

        let globalAngle = 0;
        function animate() {
            drawBackground();
            drawStars(globalAngle);
            drawShootingStars();
            globalAngle += 0.00024;
            if (Math.random() < SHOOTING_STAR_FREQ) {
                spawnShootingStar();
            }
            requestAnimationFrame(animate);
        }
        resize();
        animate();
    }
    global.initSpaceBackground = initSpaceBackground;
})(window); 