
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

interface ExperienceProps {
  name: string;
}

const FONT_URL = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

/**
 * Interactive light that follows the mouse to create dynamic highlights on the metal surface.
 */
const MouseLight = () => {
  const lightRef = useRef<THREE.PointLight>(null!);
  const { viewport } = useThree();

  useFrame((state) => {
    const x = (state.mouse.x * viewport.width) / 2;
    const y = (state.mouse.y * viewport.height) / 2;
    // Smoothly interpolate the light position
    lightRef.current.position.lerp(new THREE.Vector3(x, y, 5), 0.1);
  });

  return (
    <pointLight 
      ref={lightRef} 
      intensity={5} 
      distance={20} 
      color="#ffffff" 
      decay={2}
    />
  );
};

/**
 * Rig component that tilts the model based on mouse position.
 */
const MouseRig = ({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    // Calculate target rotation based on mouse position
    const targetRotationX = -state.mouse.y * 0.2;
    const targetRotationY = state.mouse.x * 0.4;
    
    // Smoothly interpolate the rotation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.1);
  });

  return <group ref={groupRef}>{children}</group>;
};

export const Experience: React.FC<ExperienceProps> = ({ name }) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      
      <fog attach="fog" args={['#050505', 5, 25]} />

      <Environment preset="city" />

      {/* Basic Scene Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.12} 
        penumbra={1} 
        intensity={2} 
        castShadow 
      />
      
      {/* Dynamic Mouse Interaction Lighting */}
      <MouseLight />

      {/* Interactive Rig for the 3D Model */}
      <MouseRig>
        <Float
          speed={2} 
          rotationIntensity={0.1} 
          floatIntensity={0.2} 
          floatingRange={[-0.1, 0.1]}
        >
          <Center top>
            <Text3D
              font={FONT_URL}
              size={1.5}
              height={0.5}
              curveSegments={32}
              bevelEnabled
              bevelThickness={0.1}
              bevelSize={0.06}
              bevelOffset={0}
              bevelSegments={10}
            >
              {name || "GUEST"}
              <meshStandardMaterial 
                color="#ffffff"
                metalness={1} 
                roughness={0.05} 
                envMapIntensity={2}
              />
            </Text3D>
          </Center>
        </Float>
      </MouseRig>

      {/* Dynamic Floor Shadows */}
      <ContactShadows 
        position={[0, -1.5, 0]}
        opacity={0.7} 
        scale={40} 
        blur={2.5} 
        far={10} 
        resolution={1024} 
        color="#000000" 
      />

      <OrbitControls 
        makeDefault 
        enablePan={false} 
        enableZoom={true}
        minDistance={8} 
        maxDistance={22}
      />
    </>
  );
};
