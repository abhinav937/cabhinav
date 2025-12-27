import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows, Text3D } from '@react-three/drei';
import * as THREE from 'three';
import { SteelFinish } from '../shared/types';
import { FINISH_CONFIGS } from '../shared/constants';

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

  // Polished steel material configuration
  const polishedSteelConfig = useMemo(() => FINISH_CONFIGS[SteelFinish.POLISHED], []);

  // Consistent high-quality text sizing
  const textSize = 1.5;
  const lineSpacing = 1.0;
  const textHeight = 0.4;
  const bevelSize = 0.06;
  const bevelThickness = 0.06;
  const curveSegments = 32;
  const bevelSegments = 10;

  // Camera and viewport management
  useEffect(() => {
    if (!camera || !gl) return;

    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileDevice = width < 768;

      // Update renderer
      gl.setSize(width, height);
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Update camera
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Reset camera position
      camera.position.set(0, 0, 15);
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
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 8, 30]} />

      {/* Environment Map */}
      <Environment preset="city" backgroundIntensity={2} />

      {/* Lighting Setup */}
      {/* Ambient Light - Base illumination */}
      <ambientLight intensity={lightSettings.ambientIntensity} color="#ffffff" />

      {/* Key Light - Main directional light */}
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
          <ResponsiveCenter isMobile={false}>
            <group rotation={[0, 0.1, 0]} position={[0, 0, 0]}>
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
                <meshPhysicalMaterial
                  color={polishedSteelConfig.color}
                  metalness={polishedSteelConfig.metalness}
                  roughness={polishedSteelConfig.roughness}
                  clearcoat={polishedSteelConfig.clearcoat}
                  clearcoatRoughness={polishedSteelConfig.clearcoatRoughness}
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
                <meshPhysicalMaterial
                  color={polishedSteelConfig.color}
                  metalness={polishedSteelConfig.metalness}
                  roughness={polishedSteelConfig.roughness}
                  clearcoat={polishedSteelConfig.clearcoat}
                  clearcoatRoughness={polishedSteelConfig.clearcoatRoughness}
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
        <planeGeometry args={[40, 40, 32, 32]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={1.0}
          roughness={0.02}
          clearcoat={0.8}
          clearcoatRoughness={0.01}
          envMapIntensity={lightSettings.envMapIntensity * lightSettings.platformReflectivity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle Platform Layer for Depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.48, 0]}>
        <planeGeometry args={[42, 42]} />
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.4}
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
