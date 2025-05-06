import type { APIRoute } from "astro";
import type { RecommendationDTO } from "../../../../types";
import { SpotifyService } from "../../../../lib/services/spotify.service";
import { RecommendationService } from "../../../../lib/services/recommendation.service";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { TMDB_API_KEY } from "../../../../env.config";

// Initialize the SpotifyService
const spotifyService = new SpotifyService();

// Add a function to fetch artist albums
async function enrichWithSpotifyData(
  recommendations: RecommendationDTO[]
): Promise<RecommendationDTO[]> {
  // Process music-type recommendations only
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (recommendation) => {
      if (recommendation.type !== "music") {
        return recommendation;
      }

      // Find artist items with Spotify IDs
      const artistItems = recommendation.data.items?.filter(
        (item) => item.type === "artist" && item.details?.spotifyId
      );

      // Find song items that might need images
      const songItems = recommendation.data.items?.filter(
        (item) =>
          (item.type === "song" || item.type === "track") &&
          item.details?.spotifyId &&
          !("imageUrl" in item.details)
      );

      const newItems = [...(recommendation.data.items || [])];

      // Enrich artist items with album data
      if (artistItems && artistItems.length > 0) {
        for (const artistItem of artistItems) {
          if (artistItem.details?.spotifyId) {
            try {
              const artistId = artistItem.details.spotifyId as string;
              const albums = await spotifyService.getArtistAlbums(artistId);

              if (albums.length > 0) {
                // Add first two albums if they're not already in the recommendations
                albums.slice(0, 2).forEach((album) => {
                  if (!newItems.some((item) => item.id === album.id)) {
                    newItems.push(album);
                  }
                });
              }
            } catch {
              // Silently continue if we can't get artist albums - non-critical feature
            }
          }
        }
      }

      // Enrich song items with track images if needed
      if (songItems && songItems.length > 0) {
        for (const songItem of songItems) {
          if (songItem.details?.spotifyId) {
            try {
              const trackId = songItem.details.spotifyId as string;
              const trackInfo = await spotifyService.getTrackInfo(trackId);

              if (trackInfo && trackInfo.details?.imageUrl) {
                // Update the song item with image information
                const songItemIndex = newItems.findIndex((item) => item.id === songItem.id);
                if (songItemIndex >= 0) {
                  newItems[songItemIndex] = {
                    ...newItems[songItemIndex],
                    details: {
                      ...newItems[songItemIndex].details,
                      imageUrl: trackInfo.details.imageUrl,
                    },
                  };
                }
              }
            } catch {
              // Silently continue if we can't get track info - non-critical feature
            }
          }
        }
      }

      // Return the updated recommendation
      return {
        ...recommendation,
        data: {
          ...recommendation.data,
          items: newItems,
        },
      };
    })
  );

  return enrichedRecommendations;
}

// Function to fetch real music recommendations with Spotify data
async function getRealMusicRecommendations(userId: string): Promise<RecommendationDTO[]> {
  try {
    // Create Spotify service instance
    const spotifyService = new SpotifyService();

    // Fetch popular artists from Spotify API - now returns full objects with images
    let popularArtists;
    try {
      popularArtists = await spotifyService.getPopularArtists(6);
    } catch (spotifyError) {
      // Return an empty recommendation with error info
      return [
        {
          id: Math.floor(Math.random() * 10000) + 1,
          user_id: userId,
          type: "music",
          data: {
            title: "Spotify API Issue",
            description: "Unable to fetch recommendations from Spotify. Please try again later.",
            items: [],
            errorMessage:
              spotifyError instanceof Error ? spotifyError.message : String(spotifyError),
          },
          created_at: new Date().toISOString(),
        },
      ];
    }

    // If we got artists but the array is empty, return a message
    if (!popularArtists || popularArtists.length === 0) {
      return [
        {
          id: Math.floor(Math.random() * 10000) + 1,
          user_id: userId,
          type: "music",
          data: {
            title: "No Artists Found",
            description: "No artists matched your search criteria. Try updating your preferences.",
            items: [],
          },
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Transform the artist data into recommendation items
    const artistItems = popularArtists.map((artist) => ({
      id: "music_" + artist.id,
      name: artist.name,
      type: "artist",
      details: {
        spotifyId: artist.id,
        imageUrl: artist.imageUrl,
      },
    }));

    // Create a base recommendation with real artist data
    const baseRecommendation = {
      id: Math.floor(Math.random() * 10000) + 1,
      user_id: userId,
      type: "music" as const,
      data: {
        title: "Top Artists on Spotify",
        description: "Popular music artists with their latest albums",
        items: artistItems,
      },
      created_at: new Date().toISOString(),
    };

    // Enrich with Spotify data (albums, etc.)
    const enrichedRecommendations = await enrichWithSpotifyData([baseRecommendation]);

    return enrichedRecommendations;
  } catch (error) {
    // Fall back to a generic error message
    return [
      {
        id: Math.floor(Math.random() * 10000) + 1,
        user_id: userId,
        type: "music",
        data: {
          title: "Recommendation Error",
          description:
            "There was an error generating your recommendations. Please try again later.",
          items: [],
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Check authentication
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

    // Extract user ID from the URL
    const userId = params.id;

    // Validate user ID
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

    // Compare user IDs as strings

    // Get query parameters
    const url = new URL(request.url);
    // Define type for TMDB discover results
    interface RawMovie {
      id: number;
      title: string;
      overview: string;
      poster_path: string | null;
      release_date: string;
      vote_average: number;
    }
    const type = url.searchParams.get("type") as "music" | "film" | null;
    const isNewUserParam = url.searchParams.get("is_new_user") === "true";

    // Bypass for new users: return both film 'discover' and music recommendations without auth
    if (url.searchParams.get("is_new_user") === "true") {
      // Film: fetch popular movies
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
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      const discoverData = await discoverRes.json();
      const rawMovies = Array.isArray(discoverData.results)
        ? (discoverData.results as RawMovie[])
        : [];
      const filmItems = rawMovies.map((m: RawMovie) => ({
        id: `movie_${m.id}`,
        name: m.title,
        type: "film",
        details: {
          imageUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          description: m.overview,
          releaseDate: m.release_date,
          voteAverage: m.vote_average,
        },
      }));
      const filmRec: RecommendationDTO = {
        id: Math.floor(Math.random() * 100000) + 1,
        user_id: userId,
        type: "film",
        data: {
          title: "Popular Movies",
          description: "Trending movies for new users",
          items: filmItems,
        },
        created_at: new Date().toISOString(),
      };
      // Music: fetch via Spotify-based service

      const musicRecsArray = await getRealMusicRecommendations(userId);
      // Return combined array
      return new Response(JSON.stringify([filmRec, ...musicRecsArray]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get real recommendations
    let recommendations: RecommendationDTO[] = [];

    try {
      // Film recommendations: use discover endpoint for new users without preferences
      if (!type || type === "film") {
        // Check if user has any film preferences
        const filmPrefs = await RecommendationService.getUserPreferences(userId, "film");
        let hasFilmPrefs = false;
        if ("director" in filmPrefs) {
          hasFilmPrefs =
            Boolean(filmPrefs.director && filmPrefs.director.trim() !== "") ||
            Boolean(filmPrefs.screenwriter && filmPrefs.screenwriter.trim() !== "") ||
            Boolean(filmPrefs.cast && filmPrefs.cast.length > 0) ||
            Boolean(filmPrefs.liked_movies && filmPrefs.liked_movies.length > 0);
        }
        // For new users, always fetch discover movies
        if (!hasFilmPrefs || isNewUserParam) {
          // Define local type for TMDB movie shape
          interface RawMovie {
            id: number;
            title: string;
            overview: string;
            poster_path: string | null;
            release_date: string;
            vote_average: number;
          }
          const discoverRes = await fetch(
            `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`,
            {
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${TMDB_API_KEY}`,
              },
            }
          );
          if (!discoverRes.ok) throw new Error("Failed to fetch discover movies");
          const discoverData = await discoverRes.json();
          const rawMovies = Array.isArray(discoverData.results)
            ? (discoverData.results as RawMovie[])
            : [];
          const items = rawMovies.map((m) => ({
            id: `movie_${m.id}`,
            name: m.title,
            type: "film",
            details: {
              imageUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
              description: m.overview,
              releaseDate: m.release_date,
              voteAverage: m.vote_average,
            },
          }));
          recommendations.push({
            id: Math.floor(Math.random() * 100000) + 1,
            user_id: userId,
            type: "film",
            data: {
              title: "Popular Movies",
              description: "Trending movies for new users",
              items,
            },
            created_at: new Date().toISOString(),
          });
        } else {
          const filmRec = await RecommendationService.generateRecommendations(userId, {
            type: "film",
            force_refresh: false,
          });
          recommendations.push(filmRec);
        }
      }

      // Get real music recommendations if type is music or undefined
      if (!type || type === "music") {
        try {
          const musicRecs = await getRealMusicRecommendations(userId);

          // Append each music recommendation from the array
          musicRecs.forEach((rec) => recommendations.push(rec));
        } catch {
          // Continue with unfiltered recommendations if music fetching fails
        }
      }
    } catch {
      // Return mock data if everything fails
      recommendations = [
        {
          id: Math.floor(Math.random() * 10000) + 1,
          user_id: userId,
          type: "film",
          data: {
            title: "Sample Recommendations",
            description: "Fallback sample recommendations",
            items: [
              {
                id: "fallback-1",
                name: "Fallback Item 1",
                type: "film",
                details: {
                  imageUrl: "https://via.placeholder.com/300x450?text=Fallback",
                  description: "Fallback recommendation item",
                },
              },
            ],
          },
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Fetch user's feedback and filter out already interacted items
    try {
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from("item_feedback")
        .select("item_id")
        .eq("user_id", userId);
      if (!feedbackError && feedbackRows) {
        const feedbackIds = feedbackRows.map((row) => row.item_id);

        // Consider both prefixed and raw numeric IDs
        const likedMovieId =
          feedbackIds.find((id) => id.startsWith("movie_")) ??
          feedbackIds.find((id) => /^[0-9]+$/.test(id));

        if (likedMovieId) {
          // Extract numeric base ID (handle prefixed or raw)
          const rawId = likedMovieId.startsWith("movie_")
            ? likedMovieId.replace(/^movie_/, "").split(/[_-]/)[0]
            : likedMovieId;
          // Fetch similar movies using the new service method
          const similarData = await RecommendationService.getSimilarMovies(rawId);
          // Return a single recommendation entry with similar movies
          return new Response(
            JSON.stringify([
              {
                id: Math.floor(Math.random() * 10000) + 1,
                user_id: userId,
                type: "film",
                data: similarData,
                created_at: new Date().toISOString(),
              },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        recommendations = recommendations
          .map((rec) => ({
            ...rec,
            data: {
              ...rec.data,
              items:
                rec.data.items?.filter((item) => {
                  if (item.id.startsWith("movie_")) {
                    // Extract base id from the recommendation item (e.g. "movie_1153714" or "movie_1153714_2")
                    const movieBase = item.id.split("_")[1];
                    // Check if any feedback id starting with "movie_" has the same base id
                    return !feedbackIds.some(
                      (fbId) =>
                        fbId.startsWith("movie_") &&
                        fbId.split("-")[0].replace("movie_", "") === movieBase
                    );
                  }
                  return !feedbackIds.includes(item.id);
                }) || [],
            },
          }))
          .filter((rec) => (rec.data.items || []).length > 0);
      }
    } catch {
      // Continue with unfiltered recommendations if feedback filtering fails
    }

    return new Response(JSON.stringify(recommendations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your recommendation request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Sprawdź autentykację
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

    // Sprawdź, czy ID z parametru zgadza się z ID zalogowanego użytkownika
    const userId = params.id;
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

    // Get parameters from the request body
    const body = await request.json();
    const type = body.type as "music" | "film" | undefined;

    // Get real recommendations
    let recommendations: RecommendationDTO[] = [];

    // Get film recommendations via service based on user preferences
    if (!type || type === "film") {
      const filmRec = await RecommendationService.generateRecommendations(userId, {
        type: "film",
        force_refresh: false,
      });
      recommendations.push(filmRec);
    }

    // Keep music recommendations as they are for now (we're focusing on fixing film recommendations)
    if (!type || type === "music") {
      try {
        const musicRecommendations = await getRealMusicRecommendations(userId);

        recommendations = [...recommendations, ...musicRecommendations];
      } catch {
        // Don't return early, allow film recommendations to be returned if they were successful
      }
    }

    if (recommendations.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No recommendations available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(recommendations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({
        error: "An error occurred while generating recommendations",
        details: _error instanceof Error ? _error.message : String(_error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
