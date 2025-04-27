import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nowe hasło jest wymagane",
        }),
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // W przypadku resetowania hasła, token jest automatycznie zarządzany przez Supabase
    // w ciasteczkach, więc nie musimy go jawnie przekazywać
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd zmiany hasła:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas zmiany hasła",
      }),
      { status: 500 }
    );
  }
};
