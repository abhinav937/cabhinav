export enum SteelFinish {
  POLISHED = 'polished',
  BRUSHED = 'brushed',
  MATTE = 'matte',
  DAMASCUS = 'damascus'
}

export interface MaterialConfig {
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  color: string;
}
