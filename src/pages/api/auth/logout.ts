import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 400 }
      );
    }

    // Wylogowanie pomyślne
    return new Response(
      JSON.stringify({
        success: true,
        message: "Pomyślnie wylogowano",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd wylogowania:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas wylogowania",
      }),
      { status: 500 }
    );
  }
};
