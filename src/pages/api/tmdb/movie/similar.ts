import type { APIRoute } from "astro";
import { TMDB_API_KEY } from "../../../../env.config";

// Define types for TMDB API responses
interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  [key: string]: unknown; // For any other properties we're not explicitly using
}

interface TMDBSimilarMoviesResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const movieId = url.searchParams.get("id");
    const page = url.searchParams.get("page") || "1";

    if (!movieId) {
      return new Response(JSON.stringify({ error: "Movie ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Fetch similar movies from TMDB API
    const similarMoviesResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/similar?page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!similarMoviesResponse.ok) {
      // console.error(`Error fetching similar movies: ${similarMoviesResponse.status}`);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch similar movies",
          status: similarMoviesResponse.status,
          message: similarMoviesResponse.statusText,
        }),
        {
          status: similarMoviesResponse.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const similarMoviesData = (await similarMoviesResponse.json()) as TMDBSimilarMoviesResponse;

    // Format the response to include only necessary data
    const formattedResponse = {
      page: similarMoviesData.page,
      total_pages: similarMoviesData.total_pages,
      total_results: similarMoviesData.total_results,
      results: similarMoviesData.results.map((movie: TMDBMovie) => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        release_date: movie.release_date,
        poster_path: movie.poster_path,
        overview: movie.overview,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
      })),
    };

    // Return the similar movies data
    return new Response(JSON.stringify(formattedResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in similar movies endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Server error while fetching similar movies",
        message: error instanceof Error ? error.message : "Unknown error",
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
