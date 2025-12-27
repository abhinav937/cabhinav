import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../ui/Layout';

const Space: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const [starDensity, setStarDensity] = useState(200);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [shootingStarsEnabled, setShootingStarsEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{
    stars: Array<any>;
    shootingStars: Array<any>;
    globalAngle: number;
    animationId: number;
    speedMultiplier: number;
    shootingStarFreq: number;
  } | null>(null);

  useEffect(() => {
    // Initialize space background JavaScript
    const initSpaceBackground = (target: HTMLElement, density: number, speed: number, shootingEnabled: boolean) => {
      function rand(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Create and style canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'space-bg-canvas';
      target.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return () => {}; // Return empty cleanup if no context
      }
      // TypeScript: ctx is guaranteed to be non-null after the check above
      const ctxNonNull = ctx;

      // Star layers - density affects total count
      const densityMultiplier = density / 200; // Normalize to default 200
      const STAR_LAYERS = [
        { count: Math.floor(1000 * densityMultiplier), speed: 0.03, size: [0.3, 0.8], color: 'white' },
        { count: Math.floor(500 * densityMultiplier), speed: 0.01, size: [0.8, 1.3], color: 'rgba(180,200,255,0.7)' },
        { count: Math.floor(200 * densityMultiplier), speed: 0.005, size: [1.3, 2], color: 'rgba(255,220,200,0.6)' }
      ];
      let stars: Array<{
        baseSize: number;
        color: string;
        twinkleSpeed: number;
        twinklePhase: number;
        layer: number;
        angle: number;
        radius: number;
      }> = [];

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
        const isFixed = window.getComputedStyle(target).position === 'fixed';
        if (isFixed) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        } else {
          canvas.width = target?.clientWidth || window.innerWidth;
          canvas.height = target?.clientHeight || window.innerHeight;
        }
        createStars();
      }
      window.addEventListener('resize', resize);

      function drawBackground() {
        ctxNonNull.globalAlpha = 1;
        ctxNonNull.fillStyle = '#161618';
        ctxNonNull.fillRect(0, 0, canvas.width, canvas.height);
      }

      function drawStars(globalAngle: number) {
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
            ctxNonNull.save();
            ctxNonNull.globalAlpha = 0.3 * twinkle;
            ctxNonNull.shadowBlur = 16;
            ctxNonNull.shadowColor = star.color;
            ctxNonNull.beginPath();
            ctxNonNull.arc(x, y, size * 1.7, 0, Math.PI * 2);
            ctxNonNull.fillStyle = star.color;
            ctxNonNull.fill();
            ctxNonNull.restore();
          }
          const fadeAlpha = 0.85 * twinkle;
          const fadeBlur = (star.baseSize > 2 ? 8 : 2) * fadeAlpha;
          ctxNonNull.save();
          ctxNonNull.globalAlpha = fadeAlpha;
          ctxNonNull.shadowBlur = fadeBlur;
          ctxNonNull.shadowColor = star.color;
          ctxNonNull.beginPath();
          ctxNonNull.arc(x, y, size, 0, Math.PI * 2);
          ctxNonNull.fillStyle = star.color;
          ctxNonNull.fill();
          ctxNonNull.restore();
        });
      }

      // Shooting stars
      const SHOOTING_STAR_FREQ = shootingEnabled ? 0.002 : 0;
      const SHOOTING_STAR_LIFETIME = 1200;
      let shootingStars: Array<{
        x: number;
        y: number;
        dx: number;
        dy: number;
        start: number;
        len: number;
        size: number;
        color: string;
      }> = [];

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
          const grad = ctxNonNull.createLinearGradient(star.x, star.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255,255,255,${0.8 * fade})`);
          grad.addColorStop(0.2, `rgba(255,255,255,${0.25 * fade})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctxNonNull.save();
          ctxNonNull.globalAlpha = 1;
          ctxNonNull.strokeStyle = grad;
          ctxNonNull.beginPath();
          ctxNonNull.moveTo(star.x, star.y);
          ctxNonNull.lineTo(tailX, tailY);
          ctxNonNull.lineWidth = star.size * (0.8 + 0.7 * fade);
          ctxNonNull.shadowBlur = 12;
          ctxNonNull.shadowColor = 'white';
          ctxNonNull.stroke();
          ctxNonNull.restore();
          ctxNonNull.save();
          ctxNonNull.globalAlpha = 0.85 * fade;
          ctxNonNull.shadowBlur = 18;
          ctxNonNull.shadowColor = 'white';
          ctxNonNull.beginPath();
          ctxNonNull.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
          ctxNonNull.fillStyle = 'white';
          ctxNonNull.fill();
          ctxNonNull.restore();
        });
      }

      let globalAngle = 0;
      let animationId: number;
      const speedMultiplier = speed;

      function animate() {
        drawBackground();
        drawStars(globalAngle);
        drawShootingStars();
        globalAngle += 0.00024 * speedMultiplier;
        if (Math.random() < SHOOTING_STAR_FREQ) {
          spawnShootingStar();
        }
        animationId = requestAnimationFrame(animate);
      }

      // Store animation state for updates
      animationRef.current = {
        stars,
        shootingStars,
        globalAngle,
        animationId: 0,
        speedMultiplier,
        shootingStarFreq: SHOOTING_STAR_FREQ
      };

      resize();
      animate();

      return () => {
        window.removeEventListener('resize', resize);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      };
    };

    // Make Layout background transparent
    const timer = setTimeout(() => {
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((div) => {
        const htmlDiv = div as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlDiv);
        if (
          computedStyle.minHeight === '100vh' &&
          computedStyle.backgroundColor === 'rgb(0, 0, 0)'
        ) {
          htmlDiv.style.backgroundColor = 'transparent';
        }
      });
    }, 100);

    // Initialize space background after a short delay to ensure container is mounted
    let cleanupFn: (() => void) | undefined;
    const initTimer = setTimeout(() => {
      if (containerRef.current) {
        cleanupFn = initSpaceBackground(containerRef.current, starDensity, animationSpeed, shootingStarsEnabled);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      clearTimeout(initTimer);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [starDensity, animationSpeed, shootingStarsEnabled]);

  return (
    <Layout>
      <Helmet>
        <title>Space - Interactive Starfield | Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive space background with animated starfield and shooting stars. A visual experience by Abhinav Chinnusamy." />
        <link rel="canonical" href="https://cabhinav.com/space/" />
        <style>{`
          html:has(#space-background-container),
          body:has(#space-background-container) {
            background: transparent !important;
          }

          #space-background-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 0 !important;
            pointer-events: none !important;
          }

          #space-background-container .space-bg-canvas {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 0 !important;
          }

          @media (max-width: 768px) {
            html:has(#space-background-container),
            body:has(#space-background-container) {
              background: transparent !important;
            }
            
            body:has(#space-background-container) {
              color: #ffffff !important;
            }
          }

          .space-bg-canvas {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
          }

          .space-bg-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-slide-in {
            animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .animate-fade-scale {
            animation: fadeInScale 0.2s ease-out;
          }

          /* Custom Range Slider */
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            cursor: pointer;
          }

          input[type="range"]::-webkit-slider-track {
            background: rgba(55, 65, 81, 0.5);
            height: 6px;
            border-radius: 3px;
          }

          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            height: 18px;
            width: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            transition: all 0.2s;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
          }

          input[type="range"]::-moz-range-track {
            background: rgba(55, 65, 81, 0.5);
            height: 6px;
            border-radius: 3px;
          }

          input[type="range"]::-moz-range-thumb {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            height: 18px;
            width: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            cursor: pointer;
            transition: all 0.2s;
          }

          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
          }
        `}</style>
      </Helmet>

      <div id="space-background-container" ref={containerRef} className="space-bg-container"></div>

      {/* Simple Toggle Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2.5 text-white hover:text-blue-300 transition-all duration-200 shadow-lg flex items-center gap-2 text-sm font-medium"
        aria-label="Toggle controls"
      >
        <span className="material-symbols-outlined text-lg">
          {showControls ? 'close' : 'settings'}
        </span>
        <span className="hidden sm:inline">{showControls ? 'Close' : 'Controls'}</span>
      </button>

      {/* Backdrop Overlay */}
      {showControls && (
        <div
          onClick={() => setShowControls(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-scale"
        />
      )}

      {/* Control Panel - Slide In Menu */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700 shadow-2xl transition-transform duration-300 ease-out ${
          showControls ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-800/90 backdrop-blur-xl border-b border-gray-700 px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">tune</span>
                Controls
              </h2>
              <button
                onClick={() => setShowControls(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 flex items-center justify-center"
                aria-label="Close controls"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
            {/* Star Density Control */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Star Density</label>
                <span className="text-sm font-bold text-blue-400">{starDensity}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={starDensity}
                onChange={(e) => setStarDensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Animation Speed Control */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Speed</label>
                <span className="text-sm font-bold text-purple-400">{animationSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Shooting Stars Toggle */}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-sm font-medium text-gray-300 block">Shooting Stars</label>
                  <p className="text-xs text-gray-500 mt-0.5">Random meteors</p>
                </div>
              </div>
              <button
                onClick={() => setShootingStarsEnabled(!shootingStarsEnabled)}
                className={`w-full py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
                  shootingStarsEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {shootingStarsEnabled ? 'local_fire_department' : 'local_fire_department'}
                </span>
                <span>{shootingStarsEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setStarDensity(200);
                setAnimationSpeed(1);
                setShootingStarsEnabled(true);
              }}
              className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium border border-gray-700"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Reset
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Space;
