import type { APIRoute } from "astro";
import type { RecommendationDTO } from "../../../../types";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { TMDB_API_KEY } from "../../../../env.config";

/**
 * Endpoint do pobierania rekomendacji filmowych z TMDB,
 * gdy skończą się rekomendacje AI.
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Sprawdzamy autoryzację
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies: cookies,
    });

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (!session || authError) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pobieramy ID użytkownika z parametrów URL
    const userId = params.id;

    // Sprawdzamy, czy ID użytkownika jest dostępne
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Missing user ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Typ dla odpowiedzi z TMDB
    interface RawMovie {
      id: number;
      title: string;
      overview: string;
      poster_path: string | null;
      release_date: string;
      vote_average: number;
      genre_ids: number[];
    }

    // Pobieramy popularne filmy z TMDB jako awaryjne rekomendacje
    const urlDiscover = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;

    const discoverRes = await fetch(urlDiscover, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    });

    if (!discoverRes.ok) {
      const text = await discoverRes.text();
      return new Response(
        JSON.stringify({
          error: "Failed to fetch discover movies",
          status: discoverRes.status,
          body: text,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Przetwarzamy odpowiedź z TMDB
    const discoverData = await discoverRes.json();
    const rawMovies = Array.isArray(discoverData.results)
      ? (discoverData.results as RawMovie[])
      : [];

    // Przekształcamy dane z TMDB na format rekomendacji
    const filmItems = rawMovies.map((m: RawMovie) => ({
      id: `movie_${m.id}`,
      name: m.title,
      type: "film",
      details: {
        imageUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        description: m.overview,
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        genreIds: m.genre_ids,
      },
    }));

    // Tworzymy obiekt rekomendacji
    const filmRec: RecommendationDTO = {
      id: Math.floor(Math.random() * 100000) + 1,
      user_id: userId,
      type: "film",
      data: {
        title: "Popularne Filmy",
        description: "Filmy polecane według obecnych trendów",
        items: filmItems,
      },
      created_at: new Date().toISOString(),
    };

    // Zwracamy dane jako tablicę rekomendacji
    return new Response(JSON.stringify([filmRec]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch recommendations",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
