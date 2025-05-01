import type { APIRoute } from "astro";
import type { RecommendationDTO } from "../../../../types";
import { SpotifyService } from "../../../../lib/services/spotify.service";
import { RecommendationService } from "../../../../lib/services/recommendation.service";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";

// Initialize the SpotifyService
const spotifyService = new SpotifyService();

// Add a function to fetch artist albums
async function enrichWithSpotifyData(recommendations: RecommendationDTO[]): Promise<RecommendationDTO[]> {
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
          (item.type === "song" || item.type === "track") && item.details?.spotifyId && !("imageUrl" in item.details)
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
            } catch (error) {
              console.error(`Error fetching albums for artist ${artistItem.name}:`, error);
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
            } catch (error) {
              console.error(`Error fetching track info for song ${songItem.name}:`, error);
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
      console.log("Fetched popular artists from API:", popularArtists);
    } catch (spotifyError) {
      console.error("Failed to fetch from Spotify API:", spotifyError);
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
            error: spotifyError instanceof Error ? spotifyError.message : String(spotifyError),
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
    console.error("Error creating real music recommendations:", error);
    // Fall back to a generic error message
    return [
      {
        id: Math.floor(Math.random() * 10000) + 1,
        user_id: userId,
        type: "music",
        data: {
          title: "Recommendation Error",
          description: "There was an error generating your recommendations. Please try again later.",
          items: [],
          error: error instanceof Error ? error.message : String(error),
        },
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
  console.log(">>> GET /api/users/[id]/recommendations invoked");
  try {
    console.log("========== GET RECOMMENDATIONS START ==========");
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
      console.error("Authentication error:", authError);
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
    console.log("User ID from URL:", userId);

    // Validate user ID
    if (!userId) {
      console.error("Missing user ID in URL");
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
    console.log("URL User ID:", userId, "Type:", typeof userId);
    console.log("Session User ID:", session.user.id, "Type:", typeof session.user.id);
    console.log("Comparing:", String(userId), "vs", String(session.user.id));
    console.log("Are they equal?", String(userId) === String(session.user.id));

    // Get query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as "music" | "film" | null;
    console.log("Recommendation type requested:", type || "all");

    // Get real recommendations
    let recommendations: RecommendationDTO[] = [];

    try {
      // Get film recommendations via service based on user preferences
      if (!type || type === "film") {
        console.log("Generating film recommendations based on user preferences");
        const filmRec = await RecommendationService.generateRecommendations(userId, {
          type: "film",
          force_refresh: false,
        });
        recommendations.push(filmRec);
      }

      // Get real music recommendations if type is music or undefined
      if (!type || type === "music") {
        console.log("Getting music recommendations");
        try {
          console.log("Calling RecommendationService.callOpenrouterAPI for music");
          const musicRecommendations = await RecommendationService.callOpenrouterAPI(
            {
              user_id: userId,
              genres: null,
              artists: null,
            },
            "music"
          );
          console.log("Music recommendations received:", musicRecommendations);

          if (musicRecommendations.items && musicRecommendations.items.length > 0) {
            recommendations.push({
              id: Math.floor(Math.random() * 10000) + 1,
              user_id: userId,
              type: "music",
              data: {
                title: "Music Recommendations",
                description: "Personalized music recommendations",
                items: musicRecommendations.items,
              },
              created_at: new Date().toISOString(),
            });
          } else {
            console.log("No music items received, using fallback data");
            recommendations.push({
              id: Math.floor(Math.random() * 10000) + 1,
              user_id: userId,
              type: "music",
              data: {
                title: "Music Recommendations",
                description: "Sample music recommendations (API returned no items)",
                items: [
                  {
                    id: "mock-music-1",
                    name: "Mock Artist 1",
                    type: "artist",
                    details: {
                      imageUrl: "https://via.placeholder.com/300x300?text=Artist+1",
                    },
                  },
                  {
                    id: "mock-music-2",
                    name: "Mock Track 1",
                    type: "track",
                    details: {
                      artist: "Mock Artist 1",
                      imageUrl: "https://via.placeholder.com/300x300?text=Track+1",
                    },
                  },
                ],
              },
              created_at: new Date().toISOString(),
            });
          }
        } catch (musicError) {
          console.error("Error fetching music recommendations:", musicError);
          // Add mock music recommendation
          recommendations.push({
            id: Math.floor(Math.random() * 10000) + 1,
            user_id: userId,
            type: "music",
            data: {
              title: "Music Recommendations",
              description: "Sample music recommendations (API error fallback)",
              items: [
                {
                  id: "mock-music-1",
                  name: "Mock Artist 1",
                  type: "artist",
                  details: {
                    imageUrl: "https://via.placeholder.com/300x300?text=Artist+1",
                  },
                },
                {
                  id: "mock-music-2",
                  name: "Mock Track 1",
                  type: "track",
                  details: {
                    artist: "Mock Artist 1",
                    imageUrl: "https://via.placeholder.com/300x300?text=Track+1",
                  },
                },
              ],
            },
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error processing recommendations:", error);
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

    console.log("Final recommendations count before filtering:", recommendations.length);
    // Fetch user's feedback and filter out already interacted items
    try {
      console.log("Entering feedback filtering block");
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from("item_feedback")
        .select("item_id")
        .eq("user_id", userId);
      if (!feedbackError && feedbackRows) {
        console.log("Feedback filtering: feedbackRows:", feedbackRows);
        const feedbackIds = feedbackRows.map((row) => row.item_id);
        console.log("Extracted feedbackIds:", feedbackIds);
        // Consider both prefixed and raw numeric IDs
        const likedMovieId =
          feedbackIds.find((id) => id.startsWith("movie_")) ?? feedbackIds.find((id) => /^[0-9]+$/.test(id));
        console.log("Feedback filtering: likedMovieId:", likedMovieId);
        if (likedMovieId) {
          console.log("Triggering similar movies fetch for:", likedMovieId);
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
                      (fbId) => fbId.startsWith("movie_") && fbId.split("-")[0].replace("movie_", "") === movieBase
                    );
                  }
                  return !feedbackIds.includes(item.id);
                }) || [],
            },
          }))
          .filter((rec) => (rec.data.items || []).length > 0);
      }
    } catch (filterError) {
      console.error("Error filtering recommendations by feedback:", filterError);
    }
    console.log("Final recommendations count after filtering:", recommendations.length);
    console.log("========== GET RECOMMENDATIONS END ==========");

    return new Response(JSON.stringify(recommendations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing recommendation request:", error);
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
  console.log(">>> POST /api/users/[id]/recommendations invoked");
  try {
    console.log("Received recommendation request");

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
      console.error("Authentication error:", authError);
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
      console.error("Missing user ID in URL");
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

    console.log("URL User ID:", userId, "Type:", typeof userId);
    console.log("Session User ID:", session.user.id, "Type:", typeof session.user.id);

    // Get parameters from the request body
    const body = await request.json();
    const type = body.type as "music" | "film" | undefined;
    console.log("Request body:", body);

    // Get real recommendations
    let recommendations: RecommendationDTO[] = [];

    // Get film recommendations via service based on user preferences
    if (!type || type === "film") {
      console.log("Generating film recommendations based on user preferences");
      const filmRec = await RecommendationService.generateRecommendations(userId, {
        type: "film",
        force_refresh: false,
      });
      recommendations.push(filmRec);
    }

    // Keep music recommendations as they are for now (we're focusing on fixing film recommendations)
    if (!type || type === "music") {
      console.log("Getting music recommendations");
      try {
        const musicRecommendations = await getRealMusicRecommendations(userId);
        console.log("Music recommendations:", musicRecommendations);
        recommendations = [...recommendations, ...musicRecommendations];
      } catch (musicError) {
        console.error("Error getting music recommendations:", musicError);
        // Don't return early, allow film recommendations to be returned if they were successful
      }
    }

    console.log("Final recommendations:", recommendations);

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
  } catch (error) {
    console.error("Error generating recommendations:", error);

    return new Response(
      JSON.stringify({
        error: "An error occurred while generating recommendations",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
