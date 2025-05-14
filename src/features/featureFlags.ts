import type { FeatureFlagConfig, UserContext } from "./types";

/**
 * Feature flags configuration
 *
 * This object defines all feature flags in the application.
 * Structure:
 * - Each top-level key represents a feature category (e.g., 'auth', 'collections')
 * - Each feature can have nested sub-features in a hierarchical structure
 * - Leaf nodes must be FeatureFlag objects with at least a defaultValue
 *
 * Example usage:
 * featureFlags.auth.login = { defaultValue: true, environments: { prod: false } }
 */
export const featureFlags: FeatureFlagConfig = {
  // Authentication features
  auth: {
    // Main auth feature flag (affects all auth functionality)
    defaultValue: true,
    description: "Controls all authentication functionality",
    environments: {
      local: false,
      integration: true,
      prod: true,
    },

    // Sub-features for auth
    login: {
      defaultValue: true,
      description: "Controls user login functionality",
      environments: {
        local: false,
        integration: true,
        prod: true,
      },
    },

    register: {
      defaultValue: true,
      description: "Controls user registration functionality",
      environments: {
        local: true,
        integration: true,
        prod: true,
      },
    },

    // Example of using user context to enable/disable features
    premium: {
      defaultValue: false,
      description: "Controls premium authentication features",
      environments: {
        local: true,
        integration: false,
        prod: false,
      },
      isEnabledForUser: (context: UserContext) => {
        return context.role === "premium" || context.role === "admin";
      },
    },
  },

  // Collection features
  collections: {
    defaultValue: true,
    description: "Controls all collections functionality",
    environments: {
      local: true,
      integration: true,
      prod: true,
    },

    // Recommendations related features
    recommendations: {
      defaultValue: true,
      description: "Controls recommendations functionality",
      environments: {
        local: true,
        integration: true,
        prod: true,
      },

      // Specific recommendation types
      adaptive: {
        defaultValue: true,
        description: "Controls adaptive recommendations (swipe interface)",
        environments: {
          local: true,
          integration: true,
          prod: true,
        },
      },

      history: {
        defaultValue: true,
        description: "Controls recommendation history functionality",
        environments: {
          local: true,
          integration: true,
          prod: false,
        },
      },

      // Example of beta feature only for specific users
      aiGenerated: {
        defaultValue: false,
        description: "Controls AI-generated recommendations",
        environments: {
          local: true,
          integration: true,
          prod: false,
        },
        isEnabledForUser: (context: UserContext) => {
          // Enable for beta testers or admins
          return context.groups?.includes("beta-testers") || context.role === "admin";
        },
      },
    },
  },
};
