import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { TasteService } from "../../../../lib/services/taste.service";
import { userIdParamSchema } from "../../../../lib/utils/validationSchemas";

export const prerender = false;

/**
 * GET /api/users/{id}/taste
 *
 * Endpoint do analizy gustu użytkownika na podstawie jego preferencji i historii.
 * Zwraca szczegółową analizę gustu muzycznego i filmowego jako obiekt JSON.
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
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
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    if (authError || !session || session.user.id !== userId) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do tego zasobu" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Sprawdzenie czy użytkownik istnieje
    const { data: userData, error: userError } = await supabase.from("users").select("id").eq("id", userId).single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: "Użytkownik nie istnieje" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Pobranie i analiza gustu użytkownika
    const tasteProfile = await TasteService.getUserTaste(userId);

    // 5. Zwrot analizy gustu
    return new Response(JSON.stringify(tasteProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas analizy gustu użytkownika:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas analizy gustu użytkownika",
        message: error instanceof Error ? error.message : "Nieznany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
