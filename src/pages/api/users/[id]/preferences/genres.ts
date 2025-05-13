import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../../lib/services/userPreferences.service";

export const GET: APIRoute = async ({ params, url }) => {
  // Dodajmy bezpośrednie logowanie na początku funkcji
  const userId = params.id;
  const type = url.searchParams.get("type") || "film";

  // Dodaj timestamp, żeby wymusić odświeżenie cache
  const timestamp = new Date().getTime();
  console.info(
    `[API/genres] Fetching ${type} preferences for user ${userId} (timestamp: ${timestamp})`
  );

  if (!userId) {
    return new Response(JSON.stringify({ error: "Brakujący identyfikator użytkownika" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Pobieramy metadane gatunków z nowej usługi - bez żadnych zahardcodowanych danych
    const metadataItems = await UserPreferencesService.getFilmGenresMetadata(userId);

    console.info(`[API/genres] Returning ${metadataItems.length} metadata items`);

    // Zawsze zwracaj dane z nagłówkami no-cache, aby uniknąć problemów z cache
    return new Response(JSON.stringify(metadataItems), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[API/genres] Error processing genres:", error);

    // W przypadku błędu zwróć pustą tablicę, ale z kodem 200
    // - nie chcemy zatrzymywać aplikacji w przypadku problemów z preferencjami
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
};
