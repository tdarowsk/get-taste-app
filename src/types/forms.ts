import type { MetadataWeight } from "./recommendations";

/**
 * Type for form values in the recommendation form
 */
export interface RecommendationFormValues {
  /**
   * Selected category (music or film)
   */
  category: "music" | "film";

  /**
   * Metadata weights for recommendation filtering
   */
  weights: MetadataWeight[];

  /**
   * Feedback for a recommendation item
   */
  feedback?: {
    /**
     * ID of the recommendation item
     */
    itemId: string;

    /**
     * Type of feedback (like or dislike)
     */
    type: "like" | "dislike";
  };
}
