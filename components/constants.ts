import { SteelFinish, MaterialConfig } from './types';

export const FINISH_CONFIGS: Record<SteelFinish, MaterialConfig> = {
  [SteelFinish.POLISHED]: {
    metalness: 1.0,
    roughness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    color: '#ffffff'
  },
  [SteelFinish.BRUSHED]: {
    metalness: 1.0,
    roughness: 0.45,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    color: '#d4d4d8'
  },
  [SteelFinish.MATTE]: {
    metalness: 0.8,
    roughness: 0.8,
    clearcoat: 0,
    clearcoatRoughness: 0,
    color: '#a1a1aa'
  },
  [SteelFinish.DAMASCUS]: {
    metalness: 1.0,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    color: '#52525b'
  }
};
