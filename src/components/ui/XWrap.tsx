import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

const XWrap: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);

  // Placeholder images - in a real implementation, these would be actual image URLs
  const images = [
    { id: 1, title: 'Image 1', description: 'Placeholder image gallery' },
    { id: 2, title: 'Image 2', description: 'Interactive media collection' },
    { id: 3, title: 'Image 3', description: 'Photo gallery interface' },
    { id: 4, title: 'Image 4', description: 'Visual content showcase' },
    { id: 5, title: 'Image 5', description: 'Image carousel demo' },
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Layout>
      <Helmet>
        <title>Gallery - Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive image gallery and media collection." />
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Image Gallery</h1>
            <p className="text-gray-300 text-lg">Interactive media collection and showcase</p>
          </div>

          {/* Main Gallery Container */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            {/* Image Display */}
            <div className="relative h-96 bg-gray-700 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🖼️</div>
                <h2 className="text-2xl font-bold mb-2">{images[currentImage].title}</h2>
                <p className="text-gray-300">{images[currentImage].description}</p>
                <div className="mt-4 text-sm text-gray-400">
                  Image {currentImage + 1} of {images.length}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">‹</span>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">›</span>
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-4 bg-gray-700 border-t border-gray-600">
              <div className="flex justify-center gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-colors ${
                      index === currentImage
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    <div className="w-full h-full rounded-md bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Panel */}
            <div className="p-6 bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Features (Coming Soon)</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>✅ Image carousel navigation</li>
                    <li>✅ Thumbnail preview strip</li>
                    <li>⏳ Full-screen image viewer</li>
                    <li>⏳ Image metadata display</li>
                    <li>⏳ Zoom and pan controls</li>
                    <li>⏳ Gallery organization</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Gallery Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{images.length}</div>
                      <div className="text-sm text-gray-400">Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{currentImage + 1}</div>
                      <div className="text-sm text-gray-400">Current</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <p className="text-gray-300 text-sm">
                  This is a placeholder gallery interface. The full X-Wrap gallery will feature
                  advanced image viewing, organization, and interactive features for showcasing
                  visual content and media collections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default XWrap;
