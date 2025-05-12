import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";

export interface AnimationSettings {
  animationsEnabled: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  reduceMotion: boolean;
}

const defaultSettings: AnimationSettings = {
  animationsEnabled: true,
  animationSpeed: "normal",
  reduceMotion: false,
};

interface AnimationSettingsContextType {
  settings: AnimationSettings;
  updateSettings: (settings: Partial<AnimationSettings>) => void;
}

const AnimationSettingsContext = createContext<AnimationSettingsContextType>({
  settings: defaultSettings,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateSettings: () => {},
});

interface AnimationSettingsProviderProps {
  children: ReactNode;
}

export const AnimationSettingsProvider = ({ children }: AnimationSettingsProviderProps) => {
  const [settings, setSettings] = useState<AnimationSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AnimationSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AnimationSettingsContext.Provider>
  );
};

export const useAnimationSettings = () => useContext(AnimationSettingsContext);
