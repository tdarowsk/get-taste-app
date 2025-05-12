import React from "react";
import { AnimationSettingsProvider } from "./AnimationSettingsContext";
import type { ReactNode } from "react";

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * Animation provider that adds animation settings context to the application.
 * Import this component and wrap your app or specific sections that need
 * animation settings.
 */
export function AnimationProvider({ children }: AnimationProviderProps) {
  return <AnimationSettingsProvider>{children}</AnimationSettingsProvider>;
}
