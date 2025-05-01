import type { RecommendationDTO, RecommendationItem, RecommendationFeedbackType } from "../../types";
import { FeedbackType } from "../../types";

// Interface for storing recommendation history
interface RecommendationHistory {
  id: string;
  timestamp: number;
  feedbackType?: RecommendationFeedbackType;
}

// Default cooldown period: 24 hours for disliked items, never show again for liked items
const DEFAULT_DISLIKE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
    try {
      const key = `recommendation-history-${userId}`;
      const storedHistory = localStorage.getItem(key);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (err) {
      console.error("Error retrieving recommendation history:", err);
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
        (item: { item_id: string; created_at: string; feedback_type: RecommendationFeedbackType }) => ({
          id: item.item_id,
          timestamp: new Date(item.created_at).getTime(),
          feedbackType: item.feedback_type as RecommendationFeedbackType,
        })
      );
    } catch (err) {
      console.error("Error fetching server recommendation history:", err);
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
      console.error("Error merging recommendation histories:", err);
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
        console.log(`Updated existing entry in history for item ${itemId}`);
      } else {
        // Add new entry
        history.push({
          id: itemId,
          timestamp: Date.now(),
          feedbackType: feedbackType as RecommendationFeedbackType,
        });
        console.log(`Added new entry to history for item ${itemId}`);
      }

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(history));
      console.log(`Saved history with ${history.length} items to localStorage`);
    } catch (err) {
      console.error("Error adding to recommendation history:", err);
    }
  },

  /**
   * Clears the recommendation history for a user
   * @param userId The ID of the current user
   */
  clearHistory(userId: string): void {
    try {
      const key = `recommendation-history-${userId}`;
      localStorage.removeItem(key);
    } catch (err) {
      console.error("Error clearing recommendation history:", err);
    }
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
   * Filters recommendations to ensure only unique items that have not been liked or recently disliked are shown
   * @param userId The ID of the current user
   * @param recommendations The recommendations to filter
   * @param dislikeCooldown Optional custom cooldown period for disliked items
   * @returns Filtered recommendations
   */
  filterUniqueRecommendations<T extends RecommendationDTO | RecommendationItem>(
    userId: string,
    recommendations: T[],
    dislikeCooldown = DEFAULT_DISLIKE_COOLDOWN
  ): T[] {
    try {
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
      console.error("Error filtering unique recommendations:", err);
      return recommendations; // Return original list on error
    }
  },

  /**
   * Filters recommendations asynchronously, checking both server and local history
   * @param userId The ID of the current user
   * @param recommendations The recommendations to filter
   * @param dislikeCooldown Optional custom cooldown period for disliked items
   * @returns Promise with filtered recommendations
   */
  async filterUniqueRecommendationsAsync<T extends RecommendationDTO | RecommendationItem>(
    userId: string,
    recommendations: T[],
    dislikeCooldown = DEFAULT_DISLIKE_COOLDOWN
  ): Promise<T[]> {
    try {
      // Get merged history from both server and local storage
      const history = await this.getMergedRecommendationHistory(userId);
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
      console.error("Error filtering unique recommendations asynchronously:", err);
      // Fall back to synchronous version on error
      return this.filterUniqueRecommendations(userId, recommendations, dislikeCooldown);
    }
  },

  /**
   * Checks if there are enough recommendations after filtering
   * @param filtered The filtered recommendations array
   * @param minThreshold Minimum number of recommendations needed
   * @returns True if more recommendations are needed
   */
  needsMoreRecommendations<T extends RecommendationDTO | RecommendationItem>(filtered: T[], minThreshold = 3): boolean {
    return filtered.length < minThreshold;
  },
};
