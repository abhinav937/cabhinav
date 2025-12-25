import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows, Text3D } from '@react-three/drei';
import * as THREE from 'three';

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

interface ExperienceProps {
  lightSettings: LightSettings;
  isMobile: boolean;
  isTablet: boolean;
}

const FONT_URL = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

/**
 * Interactive light that follows mouse position for dynamic highlights
 */
const MouseLight: React.FC<{ intensity: number }> = ({ intensity }) => {
  const lightRef = useRef<THREE.PointLight>(null!);
  const { viewport } = useThree();

  useFrame((state) => {
    if (lightRef.current) {
      const x = (state.mouse.x * viewport.width) / 2;
      const y = (state.mouse.y * viewport.height) / 2;
      lightRef.current.position.lerp(new THREE.Vector3(x, y, 5), 0.1);
    }
  });

  return (
    <pointLight 
      ref={lightRef} 
      intensity={intensity} 
      distance={20} 
      color="#ffffff" 
      decay={2}
    />
  );
};

/**
 * Mouse rig that tilts the 3D model based on mouse position
 */
const MouseRig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      const targetRotationX = -state.mouse.y * 0.2;
      const targetRotationY = state.mouse.x * 0.4;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, 
        targetRotationX, 
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 
        targetRotationY, 
        0.1
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

/**
 * Responsive centering component that ensures proper centering on all devices
 */
const ResponsiveCenter: React.FC<{ 
  children: React.ReactNode; 
  isMobile: boolean;
  onCentered?: () => void;
}> = ({ children, isMobile, onCentered }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { viewport } = useThree();
  const [centered, setCentered] = useState(false);

  useEffect(() => {
    if (groupRef.current && !centered) {
      // Small delay to ensure children are rendered
      const timer = setTimeout(() => {
        try {
          const box = new THREE.Box3();
          box.setFromObject(groupRef.current);
          
          if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3());
            groupRef.current.position.set(-center.x, -center.y, -center.z);
            setCentered(true);
            onCentered?.();
          }
        } catch (error) {
          console.warn('Error centering 3D model:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [viewport, isMobile, centered, onCentered]);

  // Re-center on viewport changes
  useEffect(() => {
    setCentered(false);
  }, [viewport, isMobile]);

  return <group ref={groupRef}>{children}</group>;
};

export const Experience: React.FC<ExperienceProps> = ({ 
  lightSettings, 
  isMobile, 
  isTablet 
}) => {
  const { camera, gl, size } = useThree();
  const controlsRef = useRef<any>(null);

  // Responsive text sizing
  const textSize = isMobile ? 0.7 : isTablet ? 1.2 : 1.5;
  const lineSpacing = isMobile ? 0.5 : isTablet ? 0.8 : 1.0;
  const textHeight = isMobile ? 0.2 : isTablet ? 0.3 : 0.4;
  const bevelSize = isMobile ? 0.02 : isTablet ? 0.04 : 0.06;
  const bevelThickness = isMobile ? 0.02 : isTablet ? 0.04 : 0.06;
  const curveSegments = isMobile ? 16 : isTablet ? 24 : 32;
  const bevelSegments = isMobile ? 5 : isTablet ? 7 : 10;

  // Camera and viewport management
  useEffect(() => {
    if (!camera || !gl) return;

    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileDevice = width < 768;

      // Update renderer
      gl.setSize(width, height);
      gl.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.5 : 2));

      // Update camera
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Reset camera position
      camera.position.set(0, 0, isMobileDevice ? 12 : 15);
      camera.lookAt(0, 0, 0);

      // Reset controls target
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };

    updateViewport();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateViewport, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [camera, gl, isMobile]);

  return (
    <>
      {/* Scene Background */}
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 25]} />

      {/* Environment Map */}
      <Environment preset="city" />

      {/* Lighting Setup */}
      {/* Ambient Light - Base illumination */}
      <ambientLight intensity={lightSettings.ambientIntensity} color="#ffffff" />

      {/* Key Light - Main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={lightSettings.keyIntensity}
        color={lightSettings.keyColor}
        castShadow
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill Light - Soft fill from opposite side */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={lightSettings.fillIntensity}
        color={lightSettings.fillColor}
      />

      {/* Rim Light - Edge highlight */}
      <pointLight
        position={[0, 2, -8]}
        intensity={lightSettings.rimIntensity}
        color={lightSettings.rimColor}
        distance={15}
        decay={2}
      />

      {/* Accent Lights */}
      <pointLight
        position={[-8, 3, 4]}
        intensity={lightSettings.accent1Intensity}
        color={lightSettings.accent1Color}
        distance={12}
        decay={2}
      />
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

      {/* Dynamic Mouse-Following Light */}
      <MouseLight intensity={lightSettings.mouseIntensity} />

      {/* 3D Text with Interactive Rig */}
      <MouseRig>
        <Float
          speed={2}
          rotationIntensity={0.1}
          floatIntensity={0.2}
          floatingRange={[-0.1, 0.1]}
        >
          <ResponsiveCenter isMobile={isMobile}>
            <group rotation={[0, 0.1, 0]} position={[0, isMobile ? 0.2 : 0, 0]}>
              {/* First Line: Abhinav */}
              <Text3D
                font={FONT_URL}
                size={textSize}
                height={textHeight}
                curveSegments={curveSegments}
                bevelEnabled
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelOffset={0}
                bevelSegments={bevelSegments}
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

              {/* Second Line: Chinnusamy */}
              <Text3D
                font={FONT_URL}
                size={textSize}
                height={textHeight}
                curveSegments={curveSegments}
                bevelEnabled
                bevelThickness={bevelThickness}
                bevelSize={bevelSize}
                bevelOffset={0}
                bevelSegments={bevelSegments}
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
          </ResponsiveCenter>
        </Float>
      </MouseRig>

      {/* Reflective Platform */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2.5, 0]} 
        receiveShadow
      >
        <planeGeometry args={[40, 40, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={lightSettings.envMapIntensity * lightSettings.platformReflectivity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle Platform Layer for Depth */}
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

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, -2.45, 0]}
        opacity={0.4}
        scale={40}
        blur={isMobile ? 2 : 3}
        far={10}
        resolution={isMobile ? 512 : 1024}
        color="#000000"
      />

      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={false}
        minDistance={isMobile ? 6 : 8}
        maxDistance={isMobile ? 18 : 22}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        dampingFactor={0.05}
        enableDamping={true}
        target={[0, 0, 0]}
        touches={{
          ONE: 0,
          TWO: 0
        }}
      />
    </>
  );
};
