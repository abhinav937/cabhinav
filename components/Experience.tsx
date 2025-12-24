import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

const FONT_URL = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

interface LightSettings {
  ambientIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  accent1Intensity: number;
  accent2Intensity: number;
  topIntensity: number;
  mouseIntensity: number;
  envMapIntensity: number;
  platformReflectivity: number;
  keyColor: string;
  fillColor: string;
  rimColor: string;
  accent1Color: string;
  accent2Color: string;
}

/**
 * Interactive light that follows the mouse to create dynamic highlights on the metal surface.
 */
const MouseLight: React.FC<{ intensity: number }> = ({ intensity }) => {
  const lightRef = useRef<THREE.PointLight>(null!);
  const { viewport } = useThree();

  useFrame((state) => {
    const x = (state.mouse.x * viewport.width) / 2;
    const y = (state.mouse.y * viewport.height) / 2;
    // Smoothly interpolate the light position
    lightRef.current.position.lerp(new THREE.Vector3(x, y, 6), 0.1);
  });

  return (
    <pointLight 
      ref={lightRef} 
      intensity={intensity} 
      distance={18} 
      color="#ffffff" 
      decay={1.5}
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

interface ExperienceProps {
  lightSettings: LightSettings;
}

export const Experience: React.FC<ExperienceProps> = ({ lightSettings }) => {
  const { viewport, size } = useThree();
  
  // Calculate responsive text size based on viewport and screen size
  // Ensure text fits within viewport width with padding
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;
  
  // Scale text size to fit viewport width (accounting for longest word "Chinnusamy")
  // Use viewport width to ensure it fits, with some padding
  const maxTextWidth = viewport.width * 0.85; // Use 85% of viewport width
  const estimatedCharWidth = 0.6; // Approximate width per character
  const longestWordLength = 10; // "Chinnusamy" has 10 characters
  
  // Calculate size that fits the longest word
  let textSize = maxTextWidth / (longestWordLength * estimatedCharWidth);
  
  // Apply device-specific limits
  if (isMobile) {
    textSize = Math.min(textSize, 0.9);
  } else if (isTablet) {
    textSize = Math.min(textSize, 1.2);
  } else {
    textSize = Math.min(textSize, 1.5);
  }
  
  // Ensure minimum readable size
  textSize = Math.max(textSize, 0.6);
  
  // Responsive line spacing (proportional to text size)
  const lineSpacing = textSize * 0.6;
  
  // Responsive height (depth) of text
  const textHeight = isMobile ? textSize * 0.25 : textSize * 0.33;
  
  // Responsive bevel size (proportional to text size)
  const bevelSize = textSize * 0.04;
  const bevelThickness = textSize * 0.07;

  return (
    <>
      <color attach="background" args={['#050505']} />
      
      <fog attach="fog" args={['#050505', 5, 25]} />

      <Environment preset="city" />

      {/* Ambient Light - Base illumination */}
      <ambientLight intensity={lightSettings.ambientIntensity} color="#ffffff" />
      
      {/* Key Light - Main directional light from top-front */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={lightSettings.keyIntensity}
        color={lightSettings.keyColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill Light - Soft light from opposite side */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={lightSettings.fillIntensity}
        color={lightSettings.fillColor}
      />
      
      {/* Rim Light - Edge highlight from behind */}
      <pointLight
        position={[0, 2, -8]}
        intensity={lightSettings.rimIntensity}
        color={lightSettings.rimColor}
        distance={15}
        decay={2}
      />
      
      {/* Accent Light 1 - Warm light from left */}
      <pointLight
        position={[-8, 3, 4]}
        intensity={lightSettings.accent1Intensity}
        color={lightSettings.accent1Color}
        distance={12}
        decay={2}
      />
      
      {/* Accent Light 2 - Cool light from right */}
      <pointLight
        position={[8, 3, 4]}
        intensity={lightSettings.accent2Intensity}
        color={lightSettings.accent2Color}
        distance={12}
        decay={2}
      />
      
      {/* Top Light - Overhead illumination */}
      <spotLight
        position={[0, 12, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={lightSettings.topIntensity}
        color="#ffffff"
        castShadow
      />
      
      {/* Dynamic Mouse Interaction Lighting - Enhanced */}
      <MouseLight intensity={lightSettings.mouseIntensity} />

      {/* Interactive Rig for the 3D Model */}
      <MouseRig>
        <Float
          speed={2} 
          rotationIntensity={0.1} 
          floatIntensity={0.2} 
          floatingRange={[-0.1, 0.1]}
        >
          <Center>
            <group rotation={[0, 0.1, 0]}>
              {/* First line: Abhinav */}
              <Text3D
                font={FONT_URL}
                size={textSize}
                height={textHeight}
                curveSegments={isMobile ? 16 : 32}
                bevelEnabled
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelOffset={0}
                bevelSegments={isMobile ? 5 : 10}
                position={[0, lineSpacing, 0]}
              >
                Abhinav
                <meshStandardMaterial 
                  color="#ffffff"
                  metalness={1} 
                  roughness={0.05} 
                  envMapIntensity={lightSettings.envMapIntensity}
                />
              </Text3D>
              
              {/* Second line: Chinnusamy */}
              <Text3D
                font={FONT_URL}
                size={textSize}
                height={textHeight}
                curveSegments={isMobile ? 16 : 32}
                bevelEnabled
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelOffset={0}
                bevelSegments={isMobile ? 5 : 10}
                position={[0, -lineSpacing, 0]}
              >
                Chinnusamy
                <meshStandardMaterial 
                  color="#ffffff"
                  metalness={1} 
                  roughness={0.05} 
                  envMapIntensity={lightSettings.envMapIntensity}
                />
              </Text3D>
            </group>
          </Center>
        </Float>
      </MouseRig>

      {/* Reflective Platform - Positioned below the text */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[40, 40, 32, 32]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={lightSettings.envMapIntensity * lightSettings.platformReflectivity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Additional subtle platform for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.48, 0]}>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.3}
          roughness={0.8}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dynamic Floor Shadows */}
      <ContactShadows 
        position={[0, -2.45, 0]}
        opacity={0.4} 
        scale={40} 
        blur={3} 
        far={10} 
        resolution={isMobile ? 512 : 1024} 
        color="#000000" 
      />

      <OrbitControls 
        makeDefault 
        enablePan={false} 
        enableZoom={false}
        minDistance={isMobile ? 6 : 8} 
        maxDistance={isMobile ? 18 : 22}
        minPolarAngle={Math.PI / 6} // 30 degrees from top - prevent going too high
        maxPolarAngle={Math.PI / 2.2} // ~82 degrees from top - prevent flipping upside down
        minAzimuthAngle={-Math.PI / 3} // Limit horizontal rotation to -60 degrees
        maxAzimuthAngle={Math.PI / 3} // Limit horizontal rotation to +60 degrees
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
};

