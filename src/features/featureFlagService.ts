import type {
  Environment,
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagProvider,
  UserContext,
} from "./types";
import { featureFlags } from "./featureFlags";

/**
 * Feature Flag Service
 *
 * This service provides methods to check if features are enabled based on
 * the current environment and user context.
 */
export class FeatureFlagService implements FeatureFlagProvider {
  private config: FeatureFlagConfig;
  private environment: Environment;

  /**
   * Create a new instance of FeatureFlagService
   */
  constructor(
    initialConfig: FeatureFlagConfig = featureFlags,
    environment: Environment = this.getCurrentEnvironment()
  ) {
    this.config = initialConfig;
    this.environment = environment;

    console.log(`Feature Flag Service initialized in ${this.environment} environment`);
  }

  /**
   * Check if a feature is enabled
   * @param featurePath - Dot-notation path to the feature (e.g., 'auth.login')
   * @param context - Optional user context for conditional enablement
   * @returns Whether the feature is enabled
   */
  public isFeatureEnabled(featurePath: string, context?: UserContext): boolean {
    try {
      // Split the path into parts (e.g., 'auth.login' -> ['auth', 'login'])
      const pathParts = featurePath.split(".");

      // Traverse the configuration to find the feature
      let currentNode: FeatureFlag | FeatureFlagConfig = this.config;
      const parentNodes: (FeatureFlag | FeatureFlagConfig)[] = [];

      for (const part of pathParts) {
        if (!currentNode || typeof currentNode !== "object") {
          console.warn(`Feature path '${featurePath}' is invalid - '${part}' not found`);
          return false;
        }

        parentNodes.push(currentNode);
        currentNode = currentNode[part];
      }

      // Feature not found
      if (!currentNode) {
        console.warn(`Feature '${featurePath}' not found in configuration`);
        return false;
      }

      // If we have a parent node that is disabled, child features are also disabled
      for (let i = 0; i < parentNodes.length; i++) {
        const parentPath = pathParts.slice(0, i).join(".");
        const parentNode = parentNodes[i];

        // Skip non-leaf parent nodes without flag properties
        if (!("defaultValue" in parentNode)) continue;

        // If parent is disabled, the child is automatically disabled
        if (!this.checkFeatureNode(parentNode as FeatureFlag, context)) {
          console.debug(
            `Feature '${featurePath}' disabled because parent '${parentPath}' is disabled`
          );
          return false;
        }
      }

      // Check the feature itself (must be a leaf node)
      if ("defaultValue" in currentNode) {
        return this.checkFeatureNode(currentNode as FeatureFlag, context);
      }

      // If it's not a leaf node with defaultValue, check if it has a defaultValue property
      if (!("defaultValue" in currentNode)) {
        console.warn(`Feature '${featurePath}' is not a valid feature configuration`);
        return false;
      }

      // Konwersja do FeatureFlag za pomocą 'unknown' jako pośrednik
      const nodeAsFeatureFlag = currentNode as unknown as FeatureFlag;
      return this.checkFeatureNode(nodeAsFeatureFlag, context);
    } catch (error) {
      console.error(`Error checking feature '${featurePath}':`, error);
      return false;
    }
  }

  /**
   * Get all features and their enabled status
   * @returns Record of all features and their enabled status
   */
  public getAllFeatures(): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    // Recursive function to traverse the config
    const traverse = (node: FeatureFlag | FeatureFlagConfig, path: string[] = []) => {
      if (!node || typeof node !== "object") return;

      // If node has defaultValue, it's a leaf node
      if ("defaultValue" in node) {
        const featurePath = path.join(".");
        result[featurePath] = this.isFeatureEnabled(featurePath);
      }

      // Recursively traverse children
      Object.keys(node).forEach((key) => {
        // Skip non-object properties or special properties
        if (typeof node[key] !== "object" || node[key] === null) return;
        if (["defaultValue", "environments", "description", "isEnabledForUser"].includes(key))
          return;

        traverse(node[key], [...path, key]);
      });
    };

    traverse(this.config);
    return result;
  }

  /**
   * Reload configuration from external source (if available)
   * This could be extended to load from an API, local storage, or other sources
   */
  public async reloadConfiguration(): Promise<void> {
    try {
      // In a real implementation, this might call an API
      // For now, we'll just simulate loading external configuration

      // Check if we have a browser environment with localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const storedConfig = localStorage.getItem("featureFlags");
        if (storedConfig) {
          // Merge external config with default config
          const externalConfig = JSON.parse(storedConfig);
          this.mergeConfigurations(this.config, externalConfig);
          console.log("Feature flags loaded from localStorage");
        }
      }

      // Could also check for SSR environment and load from other sources
      // e.g., environment variables, config files, etc.
    } catch (error) {
      console.error("Error reloading feature flags configuration:", error);
    }
  }

  /**
   * Set the current environment
   * @param env - The environment to set
   */
  public setEnvironment(env: Environment): void {
    this.environment = env;
    console.log(`Feature Flag Service environment set to ${env}`);
  }

  /**
   * Get the current environment
   * @returns The current environment
   */
  private getCurrentEnvironment(): Environment {
    // Check environment variables
    const envName = typeof process !== "undefined" ? process.env.ENV_NAME : undefined;

    // Check browser environment
    if (typeof window !== "undefined") {
      // Check for URL parameters (useful for testing)
      const urlParams = new URLSearchParams(window.location.search);
      const envParam = urlParams.get("env");
      if (envParam && ["local", "integration", "prod"].includes(envParam)) {
        return envParam as Environment;
      }

      // Check for localStorage setting
      if (window.localStorage) {
        const storedEnv = localStorage.getItem("environment");
        if (storedEnv && ["local", "integration", "prod"].includes(storedEnv)) {
          return storedEnv as Environment;
        }
      }
    }

    // Default to the environment variable or 'local' if not set
    if (envName && ["local", "integration", "prod"].includes(envName)) {
      return envName as Environment;
    }

    return "local";
  }

  /**
   * Check if a feature node is enabled
   * @param node - The feature node to check
   * @param context - Optional user context
   * @returns Whether the feature is enabled
   */
  private checkFeatureNode(node: FeatureFlag, context?: UserContext): boolean {
    // Check environment-specific override
    if (node.environments && this.environment in node.environments) {
      const envSpecificValue = node.environments[this.environment];

      // If the environment-specific value is false, don't check user context
      if (envSpecificValue === false) {
        return false;
      }
    }

    // Check user context if provided and the feature has a user-specific check
    if (context && node.isEnabledForUser && typeof node.isEnabledForUser === "function") {
      return node.isEnabledForUser(context);
    }

    // Use environment-specific value if available, otherwise use default
    const environmentValue =
      node.environments && this.environment in node.environments
        ? node.environments[this.environment]
        : undefined;

    // Ensure we return a boolean value
    return environmentValue !== undefined ? environmentValue : node.defaultValue;
  }

  /**
   * Deep merge two configurations
   * @param target - Target configuration to merge into
   * @param source - Source configuration to merge from
   */
  private mergeConfigurations(target: FeatureFlagConfig, source: Record<string, unknown>): void {
    Object.keys(source).forEach((key) => {
      if (
        key in target &&
        typeof target[key] === "object" &&
        typeof source[key] === "object" &&
        source[key] !== null
      ) {
        this.mergeConfigurations(
          target[key] as FeatureFlagConfig,
          source[key] as Record<string, unknown>
        );
      } else {
        (target as Record<string, unknown>)[key] = source[key];
      }
    });
  }
}

// Create a singleton instance for easy import
export const featureFlagService = new FeatureFlagService();

// Export a convenient helper function
export function isFeatureEnabled(featurePath: string, context?: UserContext): boolean {
  return featureFlagService.isFeatureEnabled(featurePath, context);
}
