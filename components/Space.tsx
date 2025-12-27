import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

const Space: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [showControls, setShowControls] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    const initStars = () => {
      const starArray: Star[] = [];
      for (let i = 0; i < 200; i++) {
        starArray.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random(),
          twinkleSpeed: Math.random() * 0.02 + 0.005
        });
      }
      setStars(starArray);
    };

    initStars();

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1) star.opacity = 0;

        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw shooting stars
      setShootingStars(prev => prev.map(star => ({
        ...star,
        x: star.x + Math.cos(star.angle) * star.speed,
        y: star.y + Math.sin(star.angle) * star.speed,
        opacity: star.opacity - 0.005
      })).filter(star => star.opacity > 0));

      shootingStars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        );
        ctx.stroke();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Add shooting star occasionally
    const addShootingStar = () => {
      if (Math.random() < 0.02) { // 2% chance per interval
        const newStar: ShootingStar = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3, // Start in top third
          length: Math.random() * 80 + 20,
          speed: Math.random() * 8 + 4,
          opacity: 1,
          angle: Math.PI / 4 + Math.random() * Math.PI / 2 // 45-135 degrees
        };
        setShootingStars(prev => [...prev, newStar]);
      }
    };

    const shootingStarInterval = setInterval(addShootingStar, 100);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(shootingStarInterval);
    };
  }, [stars, shootingStars]);

  return (
    <Layout>
      <Helmet>
        <title>Space - Interactive Starfield | Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive space background with animated starfield and shooting stars. A visual experience by Abhinav Chinnusamy." />
        <link rel="canonical" href="https://cabhinav.com/space/" />
      </Helmet>

      <div className="fixed inset-0 bg-black">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />

        {/* Controls Toggle Button */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="fixed top-5 right-5 z-50 bg-gray-800/90 hover:bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 hover:text-blue-400 transition-all duration-200"
        >
          <span className="material-symbols-outlined">
            {showControls ? 'close' : 'settings'}
          </span>
        </button>

        {/* Control Panel */}
        {showControls && (
          <div className="fixed top-20 right-5 z-40 bg-bg-surface/95 backdrop-blur-lg border border-border-primary rounded-lg p-6 max-w-xs animate-fade-in-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">stars</span>
              Space Controls
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Star Density
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  defaultValue="200"
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Animation Speed
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Shooting Stars</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <p className="text-xs text-text-muted mt-4">
              Interactive starfield animation with twinkling stars and occasional shooting stars.
            </p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Space;
