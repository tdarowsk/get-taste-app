import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request }) => {
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

    const { data, error } = await supabaseClient.auth.signInWithPassword({
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
        session: data.session,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd logowania:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas logowania",
      }),
      { status: 500 }
    );
  }
};
