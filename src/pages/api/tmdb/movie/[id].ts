import type { APIRoute } from "astro";
import { TMDB_API_KEY } from "../../../../env.config";

// Typ dla osoby z obsady
interface CastMember {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
}

// Fetch movie credits (cast and crew) from TMDB API
async function getCreditsByMovieId(movieId: string) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movie credits: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract only the original_name field from cast members
    const cast = data.cast?.map((person: CastMember) => person.original_name) || [];

    return cast;
  } catch {
    // Jeśli nie uda się pobrać obsady, zwróć pustą tablicę
    return [];
  }
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Movie ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Fetch movie details and credits in parallel
    const [movieDetailsPromise, movieCreditsPromise] = await Promise.all([
      // Fetch movie details from TMDb API
      fetch(`https://api.themoviedb.org/3/movie/${id}`, {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }),
      // Fetch movie credits
      getCreditsByMovieId(id),
    ]);

    // Handle movie details response
    if (!movieDetailsPromise.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch movie details",
          status: movieDetailsPromise.status,
          message: movieDetailsPromise.statusText,
        }),
        {
          status: movieDetailsPromise.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const movieData = await movieDetailsPromise.json();

    // Add cast to movie data
    movieData.cast = movieCreditsPromise;

    // Return the combined data
    return new Response(JSON.stringify(movieData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({
        error: "Server error while fetching movie details",
        message: _error instanceof Error ? _error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
