import type { APIRoute } from "astro";
import { FeedbackService } from "../../../lib/services/feedback.service";
import type { RecommendationFeedbackType } from "../../../types";

export const prerender = false;

/**
 * Endpoint API do zapisywania feedbacku użytkownika odnośnie rekomendacji.
 *
 * POST /api/recommendations/feedback
 * Body: {
 *   recommendation_id: number,
 *   feedback_type: "like" | "dislike",
 *   item_metadata?: Record<string, unknown>
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdź autentykację użytkownika
    const user = locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Nieautoryzowany dostęp - wymagane zalogowanie" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Pobierz parametry z żądania
    const body = await request.json();
    const { recommendation_id, feedback_type, item_metadata } = body;

    // Walidacja danych wejściowych
    if (!recommendation_id || typeof recommendation_id !== "number") {
      return new Response(JSON.stringify({ error: "Brak lub nieprawidłowe recommendation_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!feedback_type || (feedback_type !== "like" && feedback_type !== "dislike")) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy typ feedbacku (dozwolone: 'like', 'dislike')" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Zapisz feedback
    const feedback = await FeedbackService.saveSwipeFeedback(
      userId,
      recommendation_id,
      feedback_type as RecommendationFeedbackType,
      item_metadata
    );

    return new Response(JSON.stringify(feedback), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

    return new Response(
      JSON.stringify({ error: `Błąd podczas zapisywania feedbacku: ${errorMessage}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
