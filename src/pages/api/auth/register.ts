import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json();
    const { email, password, nick } = formData;

    if (!email || !password || !nick) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, hasło i nick są wymagane",
        }),
        { status: 400 }
      );
    }

    // Sprawdź minimalne wymagania dla hasła
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hasło musi mieć co najmniej 8 znaków",
        }),
        { status: 400 }
      );
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          nick,
        },
      },
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

    // Rejestracja pomyślna
    return new Response(
      JSON.stringify({
        success: true,
        session: data.session,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas rejestracji",
      }),
      { status: 500 }
    );
  }
};
