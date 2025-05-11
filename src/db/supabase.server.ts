import { createServerClient } from "@supabase/ssr";
import type { CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Konfiguracja opcji ciasteczek dla klienta Supabase
 */
export const cookieOptions: CookieOptionsWithName = {
  name: "sb-auth",
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Tworzy klienta Supabase skonfigurowanego do użycia po stronie serwera (SSR).
 *
 * @param request - Obiekt żądania HTTP
 * @returns Klient Supabase do użycia po stronie serwera
 */
export const supabaseServerClient = (request: Request) => {
  const cookies = parseCookiesFromRequest(request);

  return createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_PUBLIC_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return Array.from(cookies.entries()).map(([name, value]) => ({
            name,
            value,
            options: cookieOptions,
          }));
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setAll(newCookies) {
          // Na ten moment nie potrzebujemy implementować setAll dla odpowiedzi serwera
          // Byłoby to potrzebne przy modyfikacji sesji, ale tutaj tylko czytamy dane
        },
      },
    }
  );
};

/**
 * Parsuje ciasteczka z obiektu żądania.
 *
 * @param request - Obiekt żądania HTTP
 * @returns Mapa ciasteczek
 */
function parseCookiesFromRequest(request: Request): Map<string, string> {
  const cookies = new Map<string, string>();
  const cookieHeader = request.headers.get("cookie");

  if (cookieHeader) {
    for (const pair of cookieHeader.split(";")) {
      const [name, ...rest] = pair.trim().split("=");
      const value = rest.join("=");
      if (name && value) {
        cookies.set(name, decodeURIComponent(value));
      }
    }
  }

  return cookies;
}
