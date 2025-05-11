import { supabaseClient } from "../../db/supabase.client";
import type { RecommendationFeedback, RecommendationFeedbackType } from "../../types";
import { OpenRouterService } from "./openrouter.service";
import { OPENROUTER_API_KEY } from "../../env.config";
import { getAiPrompts, getSystemPrompts } from "../utils/ai-prompts";

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
   * Zapisuje feedback użytkownika na temat rekomendacji (swipe).
   *
   * @param userId - ID użytkownika
   * @param recommendationId - ID rekomendacji, która została oceniona
   * @param feedbackType - Typ feedbacku ("like" lub "dislike")
   * @param itemMetadata - Metadane o ocenionej pozycji dla algorytmu uczącego
   * @returns Utworzony rekord feedbacku
   */
  async saveSwipeFeedback(
    userId: string,
    recommendationId: number,
    feedbackType: RecommendationFeedbackType,
    itemMetadata?: Record<string, unknown>
  ): Promise<RecommendationFeedback> {
    // Ensure userId is a valid string
    if (typeof userId !== "string") {
      throw new Error(`Nieprawidłowe ID użytkownika: ${userId}`);
    }

    // Convert to string to ensure consistent handling
    const userIdStr = String(userId);

    // Pobierz szczegóły rekomendacji dla kontekstu algorytmu
    const { data: recommendation, error: recError } = await supabaseClient
      .from("recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recError) {
      throw new Error(`Nie udało się pobrać rekomendacji: ${recError.message}`);
    }

    // Create metadata as JSON to ensure proper typing
    const metadataJson = itemMetadata ? JSON.stringify(itemMetadata) : "{}";

    // Use upsert instead of insert to handle duplicates
    const { data, error } = await supabaseClient
      .from("recommendation_feedback")
      .upsert(
        {
          user_id: userIdStr,
          recommendation_id: recommendationId,
          feedback_type: feedbackType,
          metadata: JSON.parse(metadataJson),
          content_id: (itemMetadata?.id as string) || null,
          content_type: recommendation.type || null,
        },
        { onConflict: "user_id,recommendation_id" }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Nie udało się zapisać feedbacku: ${error.message}`);
    }

    // Przygotuj metadane feedbacku dla algorytmu uczącego
    const feedbackMetadata: FeedbackMetadata = {
      recommendation_id: recommendationId,
      recommendation_type: recommendation.type as "music" | "film", // Add type assertion
      item_name: (itemMetadata?.name as string) || "",
      item_metadata: itemMetadata || {},
      feedback_type: feedbackType,
    };

    // Zaktualizuj algorytm asynchronicznie (nie czekaj na zakończenie)
    void this.updateAlgorithmWithFeedback(userIdStr, feedbackMetadata);

    // Zaktualizuj rekord "seen_recommendations" jeśli istnieje
    void this.updateSeenRecommendationFeedback(userIdStr, itemMetadata?.id as string, feedbackType);

    return {
      id: data.id,
      recommendation_id: data.recommendation_id,
      user_id: Number(data.user_id),
      feedback_type: data.feedback_type as RecommendationFeedbackType, // Add type assertion
      created_at: data.created_at,
    };
  },

  /**
   * Aktualizuje feedback dla wcześniej wyświetlonej rekomendacji.
   */
  async updateSeenRecommendationFeedback(
    userId: string,
    itemId: string,
    feedbackType: RecommendationFeedbackType
  ): Promise<void> {
    try {
      // Ensure userId is a valid string
      if (typeof userId !== "string") {
        return; // Exit early to avoid errors
      }

      // Convert to string to ensure consistent handling
      const userIdStr = String(userId);

      const { error } = await supabaseClient
        .from("seen_recommendations")
        .update({ feedback_type: feedbackType })
        .eq("user_id", userIdStr)
        .eq("item_id", itemId);

      if (error) {
        console.error(`Error updating seen recommendation feedback: ${error.message}`);
      }
    } catch (error) {
      console.error(
        `Exception in updateSeenRecommendationFeedback: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  /**
   * Aktualizuje algorytm rekomendacji na podstawie feedbacku użytkownika.
   * Wykorzystuje OpenRouter AI do analizy wzorców.
   *
   * @param userId - ID użytkownika
   * @param feedbackMetadata - Metadane o feedbacku
   */
  async updateAlgorithmWithFeedback(
    userId: string,
    feedbackMetadata: FeedbackMetadata
  ): Promise<void> {
    try {
      // Ensure userId is a valid string
      if (typeof userId !== "string") {
        return; // Exit early to avoid errors
      }

      // Convert to string to ensure consistent handling
      const userIdStr = String(userId);

      // Pobierz ostatnie 10 feedbacków użytkownika, aby ustalić wzorce
      const { data: recentFeedback, error: feedbackError } = await supabaseClient
        .from("recommendation_feedback")
        .select("*, recommendations(*)")
        .eq("user_id", userIdStr)
        .order("created_at", { ascending: false })
        .limit(10);

      if (feedbackError) {
        throw new Error(`Nie udało się pobrać ostatnich feedbacków: ${feedbackError.message}`);
      }

      // Pobierz preferencje użytkownika
      const preferenceTable =
        feedbackMetadata.recommendation_type === "music" ? "music_preferences" : "film_preferences";
      const { data: preferences, error: prefError } = await supabaseClient
        .from(preferenceTable)
        .select("*")
        .eq("user_id", userIdStr)
        .single();

      if (prefError && prefError.code !== "PGRST116") {
        // PGRST116 to "brak zwróconych wierszy" - to jest OK dla nowych użytkowników
        throw new Error(`Nie udało się pobrać preferencji użytkownika: ${prefError.message}`);
      }

      // Pomiń aktualizację algorytmu, jeśli OpenRouter nie jest skonfigurowany
      if (!OPENROUTER_API_KEY) {
        return;
      }

      // Skonfiguruj OpenRouter
      OpenRouterService.configure(OPENROUTER_API_KEY);

      // Utwórz prompt dla AI do analizy preferencji i feedbacku użytkownika
      const prompt = getAiPrompts().updatePreferencesFromFeedback(
        preferences || {},
        recentFeedback || [],
        feedbackMetadata.recommendation_type
      );

      // Wywołaj OpenRouter do analizy wzorców
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
              description:
                "Sugerowane aktualizacje preferencji użytkownika na podstawie analizy feedbacku",
            },
            analysisNotes: {
              type: "string",
              description: "Notatki o zaobserwowanych wzorcach w zachowaniu użytkownika",
            },
          },
          required: ["updatedPreferences"],
        },
        {
          systemPrompt: getSystemPrompts().preferenceUpdater(),
          temperature: 0.2,
          model: "anthropic/claude-3-haiku-20240307",
        }
      );

      console.log(
        "````````````````````````````````````````````````````HEREREHREHREH`````````````````````"
      );
      console.log(response);

      // Wykorzystaj analizę do aktualizacji preferencji użytkownika, jeśli są istotne zmiany
      if (response.updatedPreferences && Object.keys(response.updatedPreferences).length > 0) {
        await this.updateUserPreferences(
          userIdStr,
          feedbackMetadata.recommendation_type,
          response.updatedPreferences
        );
      }
    } catch (error) {
      // Nie rzucaj ponownie - to jest proces w tle, który nie powinien wpływać na doświadczenie użytkownika
    }
  },

  /**
   * Aktualizuje preferencje użytkownika na podstawie analizy algorytmu.
   *
   * @param userId - ID użytkownika
   * @param contentType - Typ zawartości ("music" lub "film")
   * @param updatedPreferences - Nowe dane preferencji
   */
  async updateUserPreferences(
    userId: string,
    contentType: "music" | "film",
    updatedPreferences: Record<string, unknown>
  ): Promise<void> {
    try {
      // Ensure userId is a valid string
      if (typeof userId !== "string") {
        return; // Exit early to avoid errors
      }

      // Convert to string to ensure consistent handling
      const userIdStr = String(userId);

      const table = contentType === "music" ? "music_preferences" : "film_preferences";

      // Sprawdź, czy preferencje istnieją
      const { data: existing, error: checkError } = await supabaseClient
        .from(table)
        .select("*")
        .eq("user_id", userIdStr)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Nie udało się sprawdzić istniejących preferencji: ${checkError.message}`);
      }

      // Add timestamp for updates
      const updatedData = {
        ...updatedPreferences,
        // Only add updated_at if it's supported by the table schema
        ...(table === "music_preferences" || table === "film_preferences"
          ? { updated_at: new Date().toISOString() }
          : {}),
      };

      if (existing) {
        // Aktualizuj istniejące preferencje
        const { error: updateError } = await supabaseClient
          .from(table)
          .update(updatedData)
          .eq("user_id", userIdStr);

        if (updateError) {
          throw new Error(`Nie udało się zaktualizować preferencji: ${updateError.message}`);
        }
      } else {
        // Utwórz nowe preferencje
        const { error: insertError } = await supabaseClient.from(table).insert({
          user_id: userIdStr,
          ...updatedPreferences,
        });

        if (insertError) {
          throw new Error(`Nie udało się wstawić preferencji: ${insertError.message}`);
        }
      }
    } catch (error) {
      // Nie rzucaj ponownie - to jest proces w tle, który nie powinien wpływać na doświadczenie użytkownika
    }
  },

  /**
   * Pobiera historię feedbacku użytkownika.
   *
   * @param userId - ID użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @param limit - Limit liczby rekordów
   * @returns Historia feedbacku użytkownika
   */
  async getUserFeedbackHistory(
    userId: string,
    type: "music" | "film",
    limit = 10
  ): Promise<Record<string, unknown>[]> {
    try {
      // Ensure userId is a valid string
      if (typeof userId !== "string") {
        return []; // Return empty array if userId is invalid
      }

      // Convert to string to ensure consistent handling
      const userIdStr = String(userId);

      const { data, error } = await supabaseClient
        .from("recommendation_feedback")
        .select("*, recommendations(*)")
        .eq("user_id", userIdStr)
        .eq("recommendations.type", type)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Analizuje metadane preferowanej i niepreferowanej zawartości.
   *
   * @param userId - ID użytkownika
   * @param contentType - Typ zawartości ("music" lub "film")
   * @returns Analiza metadanych
   */
  async analyzeContentMetadata(
    userId: string,
    contentType: "music" | "film"
  ): Promise<Record<string, unknown>> {
    try {
      // Ensure userId is a valid string
      if (typeof userId !== "string") {
        return {
          status: "error",
          reason: "INVALID_USER_ID",
        };
      }

      // Convert to string to ensure consistent handling
      const userIdStr = String(userId);

      // Pobierz pozytywny feedback dla analizy "lubianych" treści
      const { data: likedContent, error: likedError } = await supabaseClient
        .from("recommendation_feedback")
        .select("metadata, created_at")
        .eq("user_id", userIdStr)
        .eq("feedback_type", "like")
        .order("created_at", { ascending: false })
        .limit(20);

      if (likedError) {
        throw new Error(`Nie udało się pobrać lubianych treści: ${likedError.message}`);
      }

      // Pobierz negatywny feedback dla analizy "nielubianych" treści
      const { data: dislikedContent, error: dislikedError } = await supabaseClient
        .from("recommendation_feedback")
        .select("metadata, created_at")
        .eq("user_id", userIdStr)
        .eq("feedback_type", "dislike")
        .order("created_at", { ascending: false })
        .limit(20);

      if (dislikedError) {
        throw new Error(`Nie udało się pobrać nielubianych treści: ${dislikedError.message}`);
      }

      // Pomiń analizę, jeśli OpenRouter nie jest skonfigurowany
      if (!OPENROUTER_API_KEY) {
        return {
          status: "error",
          reason: "API_KEY_MISSING",
        };
      }

      // Skonfiguruj OpenRouter
      OpenRouterService.configure(OPENROUTER_API_KEY);

      // Analizuj wzorce przy użyciu OpenRouter
      const result = await OpenRouterService.analyzeUserPatterns(
        userIdStr,
        [
          ...likedContent.map((item) => ({ ...item, type: "liked" })),
          ...dislikedContent.map((item) => ({ ...item, type: "disliked" })),
        ],
        contentType
      );

      return result;
    } catch (error) {
      return {
        status: "error",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
