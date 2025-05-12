import React from "react";
import { useAnimationSettings } from "./AnimationSettingsContext";

export function AnimationSettingsPanel() {
  const { settings, updateSettings } = useAnimationSettings();

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <h3 className="font-medium text-lg mb-4">Animation Settings</h3>

      <div className="space-y-4">
        {/* Toggle animations */}
        <div className="flex items-center justify-between">
          <label htmlFor="animations-toggle" className="text-sm font-medium">
            Enable animations
          </label>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="animations-toggle"
              className="sr-only peer"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
        </div>

        {/* Reduce motion */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduce-motion-toggle" className="text-sm font-medium">
            Reduce motion
          </label>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="reduce-motion-toggle"
              className="sr-only peer"
              checked={settings.reduceMotion}
              onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
        </div>

        {/* Animation speed */}
        <div className="space-y-2">
          <label htmlFor="animation-speed" className="text-sm font-medium block">
            Animation speed
          </label>
          <select
            id="animation-speed"
            className="bg-background border border-input rounded-md w-full p-2 text-sm"
            value={settings.animationSpeed}
            onChange={(e) =>
              updateSettings({
                animationSpeed: e.target.value as "slow" | "normal" | "fast",
              })
            }
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>
    </div>
  );
}
