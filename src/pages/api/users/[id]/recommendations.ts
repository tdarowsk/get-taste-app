import type { APIRoute } from "astro";
import { supabaseClient } from "../../../../db/supabase.client";
import { RecommendationService } from "../../../../lib/services/recommendation.service";
import { createRecommendationsSchema, userIdParamSchema } from "../../../../lib/utils/validationSchemas";

export const prerender = false;

/**
 * POST /api/users/{id}/recommendations
 *
 * Endpoint do generowania nowych rekomendacji dla użytkownika
 * na podstawie bieżących preferencji. Wykorzystuje usługę Openrouter.ai do
 * generowania rekomendacji. Zwraca wygenerowane rekomendacje jako obiekt JSON.
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // 1. Walidacja parametru ID użytkownika
    const parsedParams = userIdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe ID użytkownika",
          details: parsedParams.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = parsedParams.data.id;

    // 2. Uwierzytelnienie i autoryzacja
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Weryfikacja czy użytkownik ma uprawnienia do zasobu
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData.user || authData.user.id !== userId) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do tego zasobu" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Walidacja danych wejściowych
    const requestData = await request.json();
    const validatedData = createRecommendationsSchema.safeParse(requestData);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: validatedData.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Sprawdzenie czy użytkownik istnieje
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: "Użytkownik nie istnieje" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Generowanie rekomendacji za pomocą serwisu
    const recommendation = await RecommendationService.generateRecommendations(userId, validatedData.data);

    // 6. Zwrot wygenerowanych rekomendacji
    return new Response(JSON.stringify(recommendation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas generowania rekomendacji:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas generowania rekomendacji",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
