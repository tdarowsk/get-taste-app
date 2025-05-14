declare module "./types" {
  export type Environment = "local" | "integration" | "prod";

  export interface UserContext {
    id?: string;
    email?: string;
    role?: string;
    groups?: string[];
    [key: string]: unknown;
  }

  export interface FeatureFlag {
    defaultValue: boolean;
    environments?: Partial<Record<Environment, boolean>>;
    description?: string;
    isEnabledForUser?: (context: UserContext) => boolean;
  }

  export interface FeatureFlagConfig {
    [key: string]: FeatureFlag | FeatureFlagConfig;
  }

  export interface FeatureFlagProvider {
    isFeatureEnabled(featurePath: string, context?: UserContext): boolean;
    getAllFeatures(): Record<string, boolean>;
    reloadConfiguration(): Promise<void>;
  }
}

declare module "./featureFlags" {
  import type { FeatureFlagConfig } from "./types";
  export const featureFlags: FeatureFlagConfig;
}

declare module "./featureFlagService" {
  import type { UserContext } from "./types";

  export class FeatureFlagService {
    isFeatureEnabled(featurePath: string, context?: UserContext): boolean;
    getAllFeatures(): Record<string, boolean>;
    reloadConfiguration(): Promise<void>;
    setEnvironment(env: string): void;
  }

  export const featureFlagService: FeatureFlagService;
  export function isFeatureEnabled(featurePath: string, context?: UserContext): boolean;
}
