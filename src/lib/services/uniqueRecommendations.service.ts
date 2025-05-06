import type {
  RecommendationDTO,
  RecommendationItem,
  RecommendationFeedbackType,
} from "../../types";
import { FeedbackType } from "../../types";
import type { Database } from "../../db/database.types";

// Define types - only what we actually use
type SeenRecommendation = Database["public"]["Tables"]["seen_recommendations"]["Row"];

// Interface for storing recommendation history
interface RecommendationHistory {
  id: string;
  timestamp: number;
  feedbackType?: RecommendationFeedbackType;
}

// Default cooldown period: 24 hours for disliked items, never show again for liked items
const DEFAULT_DISLIKE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

/**
 * Service responsible for tracking and filtering recommendations to ensure users see unique content.
 * Implements the functionality required by US-012 (Unique Recommendations).
 */
export const UniqueRecommendationsService = {
  /**
   * Retrieves the recommendation history from localStorage
   * @param userId The ID of the current user
   * @returns Array of recommendation history entries
   */
  getRecommendationHistory(userId: string): RecommendationHistory[] {
    if (!isBrowser) return []; // Skip in server environment

    try {
      const key = `recommendation-history-${userId}`;
      const storedHistory = localStorage.getItem(key);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Retrieves feedback history from the server if possible
   * @param userId The ID of the current user
   * @returns Promise with the feedback history
   */
  async getServerRecommendationHistory(userId: string): Promise<RecommendationHistory[]> {
    try {
      const response = await fetch(`/api/users/${userId}/item-feedback`);

      if (!response.ok) {
        // If there's an error or the endpoint doesn't exist, fall back to local storage
        return this.getRecommendationHistory(userId);
      }

      const data = await response.json();

      // Convert server data format to our local format
      return data.items.map(
        (item: {
          item_id: string;
          created_at: string;
          feedback_type: RecommendationFeedbackType;
        }) => ({
          id: item.item_id,
          timestamp: new Date(item.created_at).getTime(),
          feedbackType: item.feedback_type as RecommendationFeedbackType,
        })
      );
    } catch (err) {
      // Fall back to local storage on error
      return this.getRecommendationHistory(userId);
    }
  },

  /**
   * Merges local and server recommendation histories, removing duplicates
   * @param userId The ID of the current user
   * @returns Promise with the merged history
   */
  async getMergedRecommendationHistory(userId: string): Promise<RecommendationHistory[]> {
    // Get local history first for immediate response
    const localHistory = this.getRecommendationHistory(userId);

    try {
      // Try to get server history
      const serverHistory = await this.getServerRecommendationHistory(userId);

      // Create a map to quickly look up items by ID
      const historyMap = new Map<string, RecommendationHistory>();

      // Add all local items first
      localHistory.forEach((item) => {
        historyMap.set(item.id, item);
      });

      // Then add or overwrite with server items (they take precedence)
      serverHistory.forEach((item) => {
        // If item exists locally and server timestamp is older, keep the newer one
        const existingItem = historyMap.get(item.id);
        if (!existingItem || item.timestamp > existingItem.timestamp) {
          historyMap.set(item.id, item);
        }
      });

      // Convert back to array
      return Array.from(historyMap.values());
    } catch (err) {
      return localHistory;
    }
  },

  /**
   * Saves an entry to the recommendation history
   * @param userId The ID of the current user
   * @param itemId The ID of the recommendation item
   * @param feedbackType Optional feedback type (like/dislike)
   */
  addToHistory(userId: string, itemId: string, feedbackType?: RecommendationFeedbackType): void {
    if (!isBrowser) return; // Skip in server environment

    try {
      const key = `recommendation-history-${userId}`;
      const history = this.getRecommendationHistory(userId);

      // Check if this item already exists in history
      const existingIndex = history.findIndex((item) => item.id === itemId);

      if (existingIndex !== -1) {
        // Update existing entry if found
        history[existingIndex] = {
          id: itemId,
          timestamp: Date.now(),
          feedbackType: feedbackType as RecommendationFeedbackType,
        };
      } else {
        // Add new entry
        history.push({
          id: itemId,
          timestamp: Date.now(),
          feedbackType: feedbackType as RecommendationFeedbackType,
        });
      }

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(history));
    } catch (err) {}
  },

  /**
   * Clears the recommendation history for a user
   * @param userId The ID of the current user
   */
  clearHistory(userId: string): void {
    if (!isBrowser) return; // Skip in server environment

    try {
      const key = `recommendation-history-${userId}`;
      localStorage.removeItem(key);
    } catch (err) {}
  },

  /**
   * Gets the item ID from a recommendation object or item
   * @param item The recommendation or item to extract ID from
   * @returns The ID as a string
   */
  getItemId(item: RecommendationDTO | RecommendationItem): string {
    // Direct ID for RecommendationItem
    if ("id" in item && typeof item.id === "string") {
      return item.id;
    }

    // RecommendationDTO case - need to extract from data.items
    if (
      "data" in item &&
      item.data &&
      typeof item.data === "object" &&
      "items" in item.data &&
      Array.isArray(item.data.items) &&
      item.data.items.length > 0 &&
      "id" in item.data.items[0]
    ) {
      return String(item.data.items[0].id);
    }

    // Fallback for numeric IDs
    if ("id" in item) {
      return String(item.id);
    }

    return "";
  },

  /**
   * Filters recommendations based on local history
   */
  filterLocalRecommendations<T extends RecommendationDTO | RecommendationItem>(
    userId: string,
    recommendations: T[],
    dislikeCooldown = DEFAULT_DISLIKE_COOLDOWN
  ): T[] {
    try {
      // Only use in browser environment
      if (!isBrowser) return recommendations;

      const history = this.getRecommendationHistory(userId);
      const now = Date.now();

      return recommendations.filter((item) => {
        const itemId = this.getItemId(item);
        if (!itemId) return true; // If no ID, include it

        // Find this item in history
        const historyEntry = history.find((h) => h.id === itemId);
        if (!historyEntry) return true; // If not in history, include it

        // If liked, never show again
        if (historyEntry.feedbackType === FeedbackType.LIKE) return false;

        // If disliked, only show after cooldown period
        if (historyEntry.feedbackType === FeedbackType.DISLIKE) {
          return now - historyEntry.timestamp > dislikeCooldown;
        }

        // If just viewed (no feedback), include it
        return true;
      });
    } catch (err) {
      return recommendations; // Return original list on error
    }
  },

  /**
   * Server-side filtering of recommendations - safe to use in both client and server
   */
  async filterUniqueRecommendations(
    userId: string,
    recommendations: RecommendationDTO
  ): Promise<RecommendationDTO> {
    // If no items, return as is
    if (
      !recommendations?.data?.items ||
      !Array.isArray(recommendations.data.items) ||
      recommendations.data.items.length === 0
    ) {
      return recommendations;
    }

    // Apply client-side filtering if we're in a browser
    if (isBrowser) {
      // Apply client-side filtering using local history
      const filteredItems = this.filterLocalRecommendations(userId, recommendations.data.items);

      return {
        ...recommendations,
        data: {
          ...recommendations.data,
          items: filteredItems,
        },
      };
    }

    // In server environment - we can't make direct calls here
    // The actual implementation will be handled in the API endpoint
    return recommendations;
  },

  /**
   * Server-side filtering of individual items - safe to use in both client and server
   * @param userId The user ID to filter for
   * @param items The recommendation items to filter
   * @param type The type of recommendation (music/film)
   * @returns Filtered recommendation items
   */
  async filterUniqueItems(
    userId: string,
    items: RecommendationItem[],
    type: "music" | "film"
  ): Promise<RecommendationItem[]> {
    // Ensure userId is a string
    if (typeof userId !== "string") {
      // Return items unchanged if userId is invalid
      return items;
    }

    // Convert to string to ensure consistent handling
    const userIdStr = String(userId);

    // Log the type (using the parameter to avoid linter warnings)

    // Client-side filtering
    if (isBrowser) {
      return this.filterLocalRecommendations(userIdStr, items);
    }

    // In server environment - we can't make direct calls here
    // The actual implementation will be handled in the API endpoint
    return items;
  },

  /**
   * Tracking shown recommendations - safe to use in both client and server
   */
  async trackShownRecommendations(
    userId: string,
    recommendations: RecommendationDTO
  ): Promise<void> {
    if (isBrowser) {
      // In client-side code, just record in local storage
      recommendations.data?.items?.forEach((item) => {
        this.addToHistory(userId, String(item.id));
      });
    }

    // In server environment, the actual implementation will be handled in the API endpoint
  },

  /**
   * Checks if there are enough recommendations after filtering
   * @param filtered The filtered recommendations array
   * @param minThreshold Minimum number of recommendations needed
   * @returns True if more recommendations are needed
   */
  needsMoreRecommendations<T extends RecommendationDTO | RecommendationItem>(
    filtered: T[],
    minThreshold = 3
  ): boolean {
    return filtered.length < minThreshold;
  },

  /**
   * Checks if a user has already seen a specific recommendation - stub for API compatibility
   */
  async hasUserSeenRecommendation(): Promise<boolean> {
    return false;
  },

  /**
   * Resets the seen recommendations history for a user - stub for API compatibility
   */
  async resetSeenRecommendations(): Promise<void> {
    // Implementation in API endpoint
  },

  /**
   * Gets the seen recommendations history for a user - stub for API compatibility
   */
  async getSeenRecommendationsHistory(): Promise<SeenRecommendation[]> {
    return [];
  },
};
