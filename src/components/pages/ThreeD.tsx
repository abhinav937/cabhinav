import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import Layout from '../ui/Layout';

const ThreeD: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>3D Demo - Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive 3D graphics and animations demo." />
        <link rel="stylesheet" href="/assets/css/3d-material.css" />
        <script src="/assets/js/3d-material.js"></script>
        <script src="/assets/js/haptics.js"></script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">3D Graphics Demo</h1>
            <p className="text-gray-300 text-lg">Interactive 3D scene with React Three Fiber</p>
          </div>

          {/* 3D Canvas Container */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="relative h-96 lg:h-[600px]">
              <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{ antialias: true }}
              >
                <Suspense fallback={
                  <Html center>
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      Loading 3D Scene...
                    </div>
                  </Html>
                }>
                  {/* Ambient Light */}
                  <ambientLight intensity={0.1} />

                  {/* Directional Light */}
                  <directionalLight position={[10, 10, 5]} intensity={0.4} />

                  {/* Simple Cube */}
                  <mesh position={[-2, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#3b82f6" />
                  </mesh>

                  {/* Simple Sphere */}
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.7, 32, 32]} />
                    <meshStandardMaterial color="#10b981" />
                  </mesh>

                  {/* Simple Torus */}
                  <mesh position={[2, 0, 0]}>
                    <torusGeometry args={[0.6, 0.2, 16, 100]} />
                    <meshStandardMaterial color="#f59e0b" />
                  </mesh>

                  {/* Controls */}
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    maxDistance={10}
                    minDistance={2}
                  />
                </Suspense>
              </Canvas>
            </div>

            {/* Controls Info */}
            <div className="p-6 bg-gray-700 border-t border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="text-white">
                  <div className="text-lg font-semibold mb-1">🖱️ Rotate</div>
                  <div className="text-sm text-gray-300">Click and drag</div>
                </div>
                <div className="text-white">
                  <div className="text-lg font-semibold mb-1">🔍 Zoom</div>
                  <div className="text-sm text-gray-300">Scroll wheel</div>
                </div>
                <div className="text-white">
                  <div className="text-lg font-semibold mb-1">📱 Pan</div>
                  <div className="text-sm text-gray-300">Right click and drag</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-300 text-sm">
                  This is a placeholder 3D scene. The full 3D demo will include advanced lighting,
                  materials, animations, and interactive elements using React Three Fiber.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThreeD;
