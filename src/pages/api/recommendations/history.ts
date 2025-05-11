import type { APIRoute } from "astro";
import { supabaseServerClient } from "../../../db/supabase.server";
import type { RecommendationItem } from "../../../types";

export const prerender = false;

/**
 * Endpoint API do pobierania historii rekomendacji użytkownika.
 *
 * GET /api/recommendations/history
 * Query params:
 * - type: "music" | "film"
 * - feedback: "liked" | "disliked" | "all"
 * - limit: number (domyślnie 20)
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Pobierz parametry z URL
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as "music" | "film" | null;
    const feedback = url.searchParams.get("feedback") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Walidacja parametrów
    if (!type || (type !== "music" && type !== "film")) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy typ zawartości (dozwolone: 'music', 'film')" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (feedback !== "liked" && feedback !== "disliked" && feedback !== "all") {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy typ feedbacku (dozwolone: 'liked', 'disliked', 'all')",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Inicjalizuj Supabase
    const supabase = supabaseServerClient(request);

    // Pobierz historię feedbacku
    const feedbackQuery = supabase
      .from("recommendation_feedback")
      .select(
        `
        id,
        metadata,
        feedback_type,
        recommendation_id,
        created_at,
        recommendations!inner(type)
      `
      )
      .eq("user_id", userId)
      .eq("recommendations.type", type)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Zastosuj filtr feedbacku
    if (feedback === "liked") {
      feedbackQuery.eq("feedback_type", "like");
    } else if (feedback === "disliked") {
      feedbackQuery.eq("feedback_type", "dislike");
    }

    const { data, error } = await feedbackQuery;

    if (error) {
      return new Response(
        JSON.stringify({ error: `Błąd podczas pobierania historii: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Przekształć dane do formatu RecommendationItem[]
    const historyItems: RecommendationItem[] = data
      .filter((item) => item.metadata && typeof item.metadata === "object")
      .map((item) => {
        const metadata = item.metadata as Record<string, unknown>;
        return {
          id: String(metadata.id || `history-${item.id}`),
          name: String(metadata.name || "Nieznana pozycja"),
          type: String(metadata.type || type),
          details: (metadata.details as Record<string, unknown>) || {},
          explanation: String(metadata.explanation || ""),
          confidence: Number(metadata.confidence || 0),
          history_feedback: item.feedback_type,
          recommendation_id: item.recommendation_id,
          created_at: item.created_at,
        };
      });

    return new Response(JSON.stringify(historyItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";

    return new Response(
      JSON.stringify({ error: `Błąd podczas pobierania historii rekomendacji: ${errorMessage}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
