import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.json();
    const { email, password } = formData;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "Email i hasło są wymagane",
        }),
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    if (error) {
      // Specjalna obsługa dla błędu "user already registered"
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "Ten adres email jest już zarejestrowany. Przejdź do ekranu logowania.",
            redirectToLogin: true,
          }),
          { status: 400 }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        user: data.user,
      }),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji",
      }),
      { status: 500 }
    );
  }
};
