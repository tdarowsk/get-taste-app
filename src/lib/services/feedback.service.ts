import { supabaseClient } from "../../db/supabase.client";
import type { RecommendationFeedback, RecommendationFeedbackType } from "../../types";
import { OpenRouterService } from "./openrouter.service";

interface FeedbackMetadata {
  recommendation_id: number;
  recommendation_type: "music" | "film";
  item_name: string;
  item_metadata: Record<string, unknown>;
  feedback_type: RecommendationFeedbackType;
}

/**
 * Service for handling user feedback on recommendations and feeding the algorithm.
 */
export const FeedbackService = {
  /**
   * Saves user feedback on a recommendation and uses it to update the recommendation algorithm.
   *
   * @param userId - User ID
   * @param recommendationId - Recommendation ID that was swiped on
   * @param feedbackType - Type of feedback ("like" or "dislike")
   * @param itemMetadata - Metadata about the recommendation item for algorithm training
   * @returns The created feedback record
   */
  async saveSwipeFeedback(
    userId: string,
    recommendationId: number,
    feedbackType: RecommendationFeedbackType,
    itemMetadata?: Record<string, unknown>
  ): Promise<RecommendationFeedback> {
    try {
      // Get recommendation details for algorithm context
      const { data: recommendation, error: recError } = await supabaseClient
        .from("recommendations")
        .select("*")
        .eq("id", recommendationId)
        .single();

      if (recError) {
        throw new Error(`Failed to fetch recommendation: ${recError.message}`);
      }

      // Save feedback in database
      const { data, error } = await supabaseClient
        .from("recommendation_feedback")
        .insert({
          user_id: userId,
          recommendation_id: recommendationId,
          feedback_type: feedbackType,
          metadata: itemMetadata || {},
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save feedback: ${error.message}`);
      }

      // Construct feedback metadata for algorithm training
      const feedbackMetadata: FeedbackMetadata = {
        recommendation_id: recommendationId,
        recommendation_type: recommendation.type,
        item_name: (itemMetadata?.name as string) || "",
        item_metadata: itemMetadata || {},
        feedback_type: feedbackType,
      };

      // Update algorithm asynchronously (don't wait for completion)
      void this.updateAlgorithmWithFeedback(userId, feedbackMetadata);

      return {
        id: data.id,
        recommendation_id: data.recommendation_id,
        user_id: Number(data.user_id),
        feedback_type: data.feedback_type,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error(`Error saving swipe feedback: ${error}`);
      throw error;
    }
  },

  /**
   * Updates the recommendation algorithm with user feedback.
   * Uses OpenRouter AI to analyze patterns in user feedback.
   *
   * @param userId - User ID
   * @param feedbackMetadata - Metadata about the feedback
   */
  async updateAlgorithmWithFeedback(userId: string, feedbackMetadata: FeedbackMetadata): Promise<void> {
    try {
      // Get user's last 10 feedback entries to establish patterns
      const { data: recentFeedback, error: feedbackError } = await supabaseClient
        .from("recommendation_feedback")
        .select("*, recommendations(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (feedbackError) {
        throw new Error(`Failed to fetch recent feedback: ${feedbackError.message}`);
      }

      // Get user preferences
      const preferenceTable =
        feedbackMetadata.recommendation_type === "music" ? "music_preferences" : "film_preferences";
      const { data: preferences, error: prefError } = await supabaseClient
        .from(preferenceTable)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (prefError && prefError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - this is fine for new users
        throw new Error(`Failed to fetch user preferences: ${prefError.message}`);
      }

      // Skip algorithm update if OpenRouter is not configured
      // This would be replaced with proper configuration in production
      if (!process.env.OPENROUTER_API_KEY) {
        console.log("OpenRouter not configured, skipping algorithm update");
        return;
      }

      // Create a prompt for the AI to analyze the user's preferences and feedback
      const prompt = `
        I'm analyzing a user's taste in ${feedbackMetadata.recommendation_type}. 
        
        User preferences: ${JSON.stringify(preferences || {})}
        
        Recent feedback:
        ${JSON.stringify(recentFeedback)}
        
        Latest action: The user ${feedbackMetadata.feedback_type === "like" ? "liked" : "disliked"} 
        ${feedbackMetadata.item_name} with properties: ${JSON.stringify(feedbackMetadata.item_metadata)}
        
        Analyze the patterns in this user's taste and feedback. Then update their preference profile.
        Focus on identifying:
        1. Genres they consistently like or dislike
        2. Specific attributes they prefer (e.g., artists, directors, eras)
        3. How their taste has evolved over time
        
        Return a JSON object with updated preference suggestions.
      `;

      // Call OpenRouter to analyze patterns
      const response = await OpenRouterService.jsonCompletion<{
        updatedPreferences: Record<string, unknown>;
        analysisNotes: string;
      }>(
        prompt,
        {
          type: "object",
          properties: {
            updatedPreferences: {
              type: "object",
              description: "Suggested updates to user preferences based on feedback analysis",
            },
            analysisNotes: {
              type: "string",
              description: "Notes about observed patterns in user behavior",
            },
          },
          required: ["updatedPreferences"],
        },
        {
          systemPrompt:
            "You are a taste analysis algorithm that identifies patterns in user preferences. Be precise and focus on factual analysis of data provided.",
          temperature: 0.2,
          model: "anthropic/claude-3-haiku-20240307",
        }
      );

      // Use the analysis to update user preferences if significant changes are suggested
      if (response.updatedPreferences && Object.keys(response.updatedPreferences).length > 0) {
        await this.updateUserPreferences(userId, feedbackMetadata.recommendation_type, response.updatedPreferences);
      }

      console.log(`Algorithm successfully updated with feedback for user ${userId}`);
    } catch (error) {
      console.error(`Error updating algorithm with feedback: ${error}`);
      // Don't rethrow - this is a background process that shouldn't affect user experience
    }
  },

  /**
   * Updates user preferences based on algorithm analysis.
   *
   * @param userId - User ID
   * @param contentType - Type of content ("music" or "film")
   * @param updatedPreferences - New preference data
   */
  async updateUserPreferences(
    userId: string,
    contentType: "music" | "film",
    updatedPreferences: Record<string, unknown>
  ): Promise<void> {
    try {
      const table = contentType === "music" ? "music_preferences" : "film_preferences";

      // Check if preferences exist
      const { data: existing, error: checkError } = await supabaseClient
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing preferences: ${checkError.message}`);
      }

      if (existing) {
        // Update existing preferences
        const { error: updateError } = await supabaseClient
          .from(table)
          .update({
            ...updatedPreferences,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          throw new Error(`Failed to update preferences: ${updateError.message}`);
        }
      } else {
        // Create new preferences
        const { error: insertError } = await supabaseClient.from(table).insert({
          user_id: userId,
          ...updatedPreferences,
        });

        if (insertError) {
          throw new Error(`Failed to insert preferences: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error updating user preferences: ${error}`);
      // Don't rethrow - this is a background process that shouldn't affect user experience
    }
  },
};
