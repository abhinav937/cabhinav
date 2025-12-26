import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  Float,
  Text3D,
  Center
} from '@react-three/drei';
import * as THREE from 'three';
import { SteelFinish } from './types';
import { FINISH_CONFIGS } from './constants';

// A high-quality typeface JSON URL for 3D text
const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/fonts/helvetiker_bold.typeface.json';

interface MetalObjectProps {
  finish: SteelFinish;
}

const MetalObject: React.FC<MetalObjectProps> = ({ finish }) => {
  const groupRef = useRef<THREE.Group>(null);
  const config = useMemo(() => FINISH_CONFIGS[finish], [finish]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        <Center top>
          <Text3D
            font={FONT_URL}
            size={0.8}
            height={0.2}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.05}
            bevelSize={0.03}
            bevelOffset={0}
            bevelSegments={5}
          >
            STEEL
            <meshPhysicalMaterial
              color={config.color}
              metalness={config.metalness}
              roughness={config.roughness}
              clearcoat={config.clearcoat}
              clearcoatRoughness={config.clearcoatRoughness}
              envMapIntensity={1.8}
            />
          </Text3D>
        </Center>
      </group>
    </Float>
  );
};

interface MetalSceneProps {
  finish: SteelFinish;
}

export const MetalScene: React.FC<MetalSceneProps> = ({ finish }) => {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#0a0a0a']} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />

        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />

        <MetalObject finish={finish} />

        <Environment preset="city" />

        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
        />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          autoRotate={false}
          makeDefault
        />
      </Canvas>
    </div>
  );
};
