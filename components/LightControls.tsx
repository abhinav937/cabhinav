import React from 'react';

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

interface LightControlsProps {
  settings: LightSettings;
  onChange: (settings: LightSettings) => void;
}

export const LightControls: React.FC<LightControlsProps> = ({ settings, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const updateSetting = (key: keyof LightSettings, value: number | string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-white text-sm font-medium hover:bg-white/20 transition-colors mb-2"
      >
        {isOpen ? '▼ Hide Controls' : '⚡ Light Controls'}
      </button>
      
      {isOpen && (
        <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-2xl max-w-sm max-h-[80vh] overflow-y-auto">
          <h3 className="text-white text-lg font-bold mb-4">Light Controls</h3>
          
          <div className="space-y-4">
            {/* Ambient Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Ambient: {settings.ambientIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={settings.ambientIntensity}
                onChange={(e) => updateSetting('ambientIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Key Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Key Light: {settings.keyIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.keyIntensity}
                onChange={(e) => updateSetting('keyIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <input
                type="color"
                value={settings.keyColor}
                onChange={(e) => updateSetting('keyColor', e.target.value)}
                className="w-full h-8 mt-1 rounded"
              />
            </div>

            {/* Fill Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Fill Light: {settings.fillIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={settings.fillIntensity}
                onChange={(e) => updateSetting('fillIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <input
                type="color"
                value={settings.fillColor}
                onChange={(e) => updateSetting('fillColor', e.target.value)}
                className="w-full h-8 mt-1 rounded"
              />
            </div>

            {/* Rim Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Rim Light: {settings.rimIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.rimIntensity}
                onChange={(e) => updateSetting('rimIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <input
                type="color"
                value={settings.rimColor}
                onChange={(e) => updateSetting('rimColor', e.target.value)}
                className="w-full h-8 mt-1 rounded"
              />
            </div>

            {/* Accent Light 1 */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Accent 1 (Left): {settings.accent1Intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={settings.accent1Intensity}
                onChange={(e) => updateSetting('accent1Intensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <input
                type="color"
                value={settings.accent1Color}
                onChange={(e) => updateSetting('accent1Color', e.target.value)}
                className="w-full h-8 mt-1 rounded"
              />
            </div>

            {/* Accent Light 2 */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Accent 2 (Right): {settings.accent2Intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={settings.accent2Intensity}
                onChange={(e) => updateSetting('accent2Intensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <input
                type="color"
                value={settings.accent2Color}
                onChange={(e) => updateSetting('accent2Color', e.target.value)}
                className="w-full h-8 mt-1 rounded"
              />
            </div>

            {/* Top Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Top Light: {settings.topIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.topIntensity}
                onChange={(e) => updateSetting('topIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Mouse Light */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Mouse Light: {settings.mouseIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.1"
                value={settings.mouseIntensity}
                onChange={(e) => updateSetting('mouseIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Material Reflectivity */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Material Reflectivity: {settings.envMapIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.envMapIntensity}
                onChange={(e) => updateSetting('envMapIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Platform Reflectivity */}
            <div>
              <label className="text-white/80 text-xs uppercase tracking-wider mb-1 block">
                Platform Reflectivity: {settings.platformReflectivity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={settings.platformReflectivity}
                onChange={(e) => updateSetting('platformReflectivity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

