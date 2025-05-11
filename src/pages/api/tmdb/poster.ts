import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title");
  if (!title) {
    return new Response(JSON.stringify({ error: "Missing title" }), { status: 400 });
  }

  const apiKey = import.meta.env.TMDB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TMDB API key not set" }), { status: 500 });
  }

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    if (!tmdbRes.ok) {
      return new Response(JSON.stringify({ error: "TMDB error" }), { status: 502 });
    }
    const data = await tmdbRes.json();
    const movieWithPoster = data.results?.find((movie: any) => movie.poster_path);
    if (!movieWithPoster?.poster_path) {
      return new Response(JSON.stringify({ posterUrl: null }), { status: 200 });
    }
    return new Response(
      JSON.stringify({
        posterUrl: `https://image.tmdb.org/t/p/w500${movieWithPoster.poster_path}`,
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
