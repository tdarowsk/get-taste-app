import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";

// Correct string values for metadata types
const FILM_GENRE = "filmGenre";
const MUSIC_GENRE = "musicGenre";

/**
 * Endpoint for fetching user genre preferences from database
 * GET /api/user-preferences-genres?userId=XXX&type=film
 */
export const GET: APIRoute = async ({ request, url, cookies }) => {
  // console.info("==================== PREFERENCES API CALLED ====================");
  console.info("Request URL:", url.toString());
  console.info("Request query params:", Object.fromEntries(url.searchParams.entries()));

  // Get parameters from query string
  const userId = url.searchParams.get("userId");
  const type = url.searchParams.get("type") || "film";

  console.info(`Processing request for userId=${userId}, type=${type}`);

  if (!userId) {
    // console.error("[API/user-preferences-genres] Missing user ID");
    return new Response(JSON.stringify({ error: "Missing user ID" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    console.info(`[API/user-preferences-genres] Creating Supabase client for user: ${userId}`);
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Pobierz wszystkie elementy, które użytkownik polubił
    console.info("[API/user-preferences-genres] Querying database for feedback...");
    const { data: likedItems, error: likedItemsError } = await supabase
      .from("item_feedback")
      .select("item_id, genre, feedback_type")
      .eq("user_id", userId)
      .eq("feedback_type", "like");

    if (likedItemsError) {
      console.error(`[API/user-preferences-genres] Database error: ${likedItemsError.message}`);
      throw new Error(`Failed to fetch feedback data: ${likedItemsError.message}`);
    }

    console.info(
      `[API/user-preferences-genres] Found ${likedItems?.length || 0} liked items for user ${userId}`
    );

    // Zlicz gatunki
    const genreCounts: Record<string, number> = {};
    console.info("[API/user-preferences-genres] Processing genres for liked items...");

    // Dla każdego polubionego elementu
    likedItems.forEach((item, index) => {
      if (!item.genre) {
        console.info(
          `[API/user-preferences-genres] Item ${index} (${item.item_id}) has no genre data`
        );
        return;
      }

      let genres: string[] = [];

      // Obsługa różnych formatów danych
      if (typeof item.genre === "string") {
        console.info(
          `[API/user-preferences-genres] Processing item ${index} (${item.item_id}) genre: ${item.genre}`
        );

        // Mogą być oddzielone przecinkami, średnikami lub pionowymi kreskami
        if (item.genre.includes(",")) {
          genres = item.genre.split(",");
        } else if (item.genre.includes(";")) {
          genres = item.genre.split(";");
        } else if (item.genre.includes("|")) {
          genres = item.genre.split("|");
        } else {
          // Pojedynczy gatunek
          genres = [item.genre];
        }

        // Oczyszczenie danych
        genres = genres
          .map((g) => g.trim())
          .filter((g) => g.length > 0)
          .map((g) => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()); // Pierwsza litera wielka

        console.info(
          `[API/user-preferences-genres] Item ${index} (${item.item_id}) cleaned genres:`,
          genres
        );

        // Zliczanie wystąpień gatunku
        genres.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      } else {
        console.info(
          `[API/user-preferences-genres] Item ${index} (${item.item_id}) genre is not a string: ${typeof item.genre}`
        );
      }
    });

    console.info("[API/user-preferences-genres] Genre counts:", genreCounts);

    // Sortuj gatunki według liczby wystąpień (malejąco)
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Pobierz 5 najczęściej występujących gatunków

    console.info("[API/user-preferences-genres] Top 5 genres:", sortedGenres);

    // Określ typ metadanych na podstawie żądanego typu zawartości
    const metadataType = type === "film" ? FILM_GENRE : MUSIC_GENRE;
    console.info(
      `[API/user-preferences-genres] Using metadata type '${metadataType}' for content type '${type}'`
    );

    // Konwersja na format MetadataItem
    const metadataItems = sortedGenres.map(([name, count]) => {
      const maxCount = sortedGenres[0][1]; // Maksymalna liczba wystąpień
      const weight = count / maxCount;
      const id = name.toLowerCase().replace(/\s+/g, "-");

      return {
        id,
        type: metadataType,
        name,
        count,
        weight,
      };
    });

    console.info(
      `[API/user-preferences-genres] Returning ${metadataItems.length} items for user ${userId}:`
    );

    // Log każdego elementu metadata dla celów debugowania
    metadataItems.forEach((item, index) => {
      console.info(
        `Item ${index}: id=${item.id}, name=${item.name}, type=${item.type}, count=${item.count}, weight=${item.weight}`
      );
    });

    return new Response(JSON.stringify(metadataItems), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(
      "[API/user-preferences-genres] Error:",
      error instanceof Error ? error.message : String(error)
    );

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
