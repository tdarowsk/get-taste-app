import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();

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
