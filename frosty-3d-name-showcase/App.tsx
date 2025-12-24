
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { Loader } from '@react-three/drei';

const App: React.FC = () => {
  const [name, setName] = useState<string>('VISITOR');

  return (
    <div className="relative w-full h-screen bg-[#050505]">
      {/* 3D Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 35 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: 3 // ACESFilmicToneMapping
        }}
      >
        <Suspense fallback={null}>
          <Experience name={name} />
        </Suspense>
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 z-10">
        <header className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <h1 className="text-white/20 text-xs tracking-[0.5em] font-light uppercase">
              Interactive Precision Series
            </h1>
          </div>
        </header>

        <main className="flex justify-center items-center flex-grow">
        </main>

        <footer className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="pointer-events-auto bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">
              Enter Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              maxLength={15}
              className="bg-transparent text-white border-b border-white/20 focus:border-white outline-none transition-colors duration-300 text-xl font-light tracking-widest uppercase w-full max-w-[250px]"
              placeholder="YOUR NAME"
            />
          </div>
          <div className="text-white/20 text-[10px] tracking-widest uppercase text-right">
            Dynamic Mouse Tracking • Stainless Steel<br />
            Interactive 3D Typography
          </div>
        </footer>
      </div>

      <Loader />
    </div>
  );
};

export default App;
