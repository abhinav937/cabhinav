
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

export const SparklesCore: React.FC = () => {
  return (
    <Sparkles
      count={100}
      scale={20}
      size={2}
      speed={0.4}
      opacity={0.2}
      color="#ffffff"
    />
  );
};
