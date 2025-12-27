import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

const Sydney: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (imageLoaded) {
        drawImage();
      }
    };

    const drawImage = () => {
      if (!window.sydneyImage) return;

      const img = window.sydneyImage;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Scale to fill full width, crop height if needed
      const scale = canvasWidth / img.width;
      const scaledWidth = canvasWidth;
      const scaledHeight = img.height * scale;

      // Center vertically if image is taller than canvas
      let y = 0;
      if (scaledHeight > canvasHeight) {
        y = (canvasHeight - scaledHeight) / 2;
      }

      // Clear canvas
      ctx.fillStyle = '#161618';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw image filling full width
      ctx.drawImage(img, 0, y, scaledWidth, scaledHeight);
    };

    // Load random image
    const loadImage = async () => {
      try {
        const response = await fetch(
          "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "query",
            prop: "images",
            titles: "Sydney Sweeney",
            format: "json",
            origin: "*"
          })
        );

        const data = await response.json();
        const pages = data.query?.pages;
        const pageId = Object.keys(pages)[0];
        const images = pages[pageId]?.images || [];

        // Filter for image files
        const imageFiles = images.filter((img: any) =>
          /\.(jpg|jpeg|png|gif|webp)$/i.test(img.title)
        );

        if (imageFiles.length > 0) {
          // Pick a random image
          const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
          const imageUrl = `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(randomImage.title.replace('File:', ''))}?width=1200`;

          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            (window as any).sydneyImage = img;
            setImageLoaded(true);
            setLoading(false);
            drawImage();
          };

          img.onerror = () => {
            setError('Failed to load image');
            setLoading(false);
          };

          img.src = imageUrl;
        } else {
          setError('No images found');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch images');
        setLoading(false);
      }
    };

    // Initialize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    loadImage();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [imageLoaded]);

  return (
    <Layout>
      <Helmet>
        <title>Sydney Sweeney</title>
        <meta name="description" content="Sydney Sweeney canvas display" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="fixed inset-0 bg-bg-secondary">
        <canvas
          ref={canvasRef}
          className="block w-full h-full object-cover"
          style={{ background: '#161618' }}
        />

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-text-primary text-lg">Loading random image...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-bg-surface border border-red-500/50 rounded-lg p-6 max-w-md text-center">
              <span className="material-symbols-outlined text-red-400 text-3xl mb-4 block">error</span>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Sydney;
