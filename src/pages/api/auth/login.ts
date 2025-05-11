import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.json();
    const { email, password } = formData;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email i hasło są wymagane",
        }),
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 401 }
      );
    }

    // Logowanie pomyślne
    return new Response(
      JSON.stringify({
        success: true,
        user: data.user,
      }),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas logowania",
      }),
      { status: 500 }
    );
  }
};
