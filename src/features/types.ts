/**
 * Types for the feature flag system
 */

// Environment names
export type Environment = "local" | "integration" | "prod";

// User context for feature flag evaluation
export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  groups?: string[];
  [key: string]: unknown; // Allow for additional custom properties with unknown type
}

// Feature flag configuration for a single feature
export interface FeatureFlag {
  // Default value if no environment-specific value is defined
  defaultValue: boolean;

  // Environment-specific overrides
  environments?: Partial<Record<Environment, boolean>>;

  // Optional description of the feature
  description?: string;

  // Optional function to determine if the feature is enabled based on user context
  isEnabledForUser?: (context: UserContext) => boolean;
}

// Hierarchical feature flag configuration
export interface FeatureFlagConfig {
  [key: string]: FeatureFlag | FeatureFlagConfig;
}

// Feature flag provider interface for potentially different implementations
export interface FeatureFlagProvider {
  isFeatureEnabled(featurePath: string, context?: UserContext): boolean;
  getAllFeatures(): Record<string, boolean>;
  reloadConfiguration(): Promise<void>;
}
