import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Publiczne ścieżki - endpoints API Auth i strony autentykacji renderowane przez serwer
const PUBLIC_PATHS = [
  // Strony renderowane przez serwer
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/confirm",
  // Endpointy API Auth
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/confirm-reset",
  "/api/auth/logout",
  "/api/auth/status",
  // Test endpoints
  "/api/test-taste",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Pomijamy sprawdzanie autentykacji dla ścieżek publicznych
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // WAŻNE: Zawsze najpierw pobieramy sesję użytkownika przed innymi operacjami
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email || null,
        id: user.id,
      };
      locals.supabase = supabase;
    } else if (!PUBLIC_PATHS.includes(url.pathname)) {
      // Przekierowanie do logowania dla chronionych ścieżek
      return redirect("/auth/login");
    }

    return next();
  }
);
