import type { NextApiRequest, NextApiResponse } from "next";
import type { RecommendationDTO, RecommendationItem } from "../../../../../types";
import { SpotifyService } from "../../../../../lib/services/spotify.service";
import { mockMusicRecommendations, mockFilmRecommendations } from "../../../../../mockData";

// Initialize the SpotifyService
const spotifyService = new SpotifyService();

// Add a new function to fetch artist albums
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  let userId: number;

  try {
    const { id } = req.query;
    const forceRefresh = req.query.force_refresh === "true";
    const isNewUser = req.query.is_new_user === "true";
    const type = req.query.type as string | undefined;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "User ID must be a number" });
    }

    // Handle cold start scenario for new users without feedback
    if (isNewUser) {
      let recommendations: RecommendationDTO[] = [
        generatePopularMusicRecommendation(userId),
        generateTrendingMusicRecommendation(userId),
        generatePopularFilmRecommendation(userId),
        generateTrendingFilmRecommendation(userId),
      ];

      // Enrich music recommendations with Spotify data
      recommendations = await enrichWithSpotifyData(recommendations);

      // If type filter is specified, return only that type
      if (type) {
        const filteredRecs = recommendations.filter((rec) => rec.type === type);
        return res.status(200).json(filteredRecs);
      }

      return res.status(200).json(recommendations);
    }

    // For existing users, we would:
    // 1. Check if we need to generate new recommendations or can use cached ones
    // 2. If needed, query OpenAI with user preferences to generate recommendations
    // 3. Store the generated recommendations
    // 4. Return the recommendations to the client

    // For now, we'll return mock data - use forceRefresh to simulate getting fresh data
    let recommendations: RecommendationDTO[] = forceRefresh
      ? [
          generateMockMusicRecommendation(userId, Math.floor(Math.random() * 100) + 1),
          generateMockMusicRecommendation(userId, Math.floor(Math.random() * 100) + 2),
          generateMockFilmRecommendation(userId, Math.floor(Math.random() * 100) + 3),
          generateMockFilmRecommendation(userId, Math.floor(Math.random() * 100) + 4),
        ]
      : [
          generateMockMusicRecommendation(userId, 1),
          generateMockMusicRecommendation(userId, 2),
          generateMockFilmRecommendation(userId, 3),
          generateMockFilmRecommendation(userId, 4),
        ];

    // Enrich music recommendations with Spotify data
    recommendations = await enrichWithSpotifyData(recommendations);

    // If type filter is specified, return only that type
    if (type) {
      recommendations = recommendations.filter((rec) => rec.type === type);
    }

    return res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error processing recommendation request:", error);

    // Use a default user ID if we couldn't parse it from the request
    userId = parseInt((Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) || "1", 10) || 1;

    // Return mock data with images instead of a 500 error
    const fallbackRecommendations =
      req.query.type === "film"
        ? mockFilmRecommendations
        : req.query.type === "music"
          ? mockMusicRecommendations
          : [...mockMusicRecommendations, ...mockFilmRecommendations];

    // Update user_id in fallback recommendations
    const recommendationsWithUserId = fallbackRecommendations.map((rec) => ({
      ...rec,
      user_id: userId,
    }));

    return res.status(200).json(recommendationsWithUserId);
  }
}

// Special recommendation generators for cold start users
function generatePopularMusicRecommendation(userId: number): RecommendationDTO {
  const popularMusicItems: RecommendationItem[] = [
    {
      id: "artist-popular-1",
      name: "Drake",
      type: "artist",
      details: {
        genres: ["hip hop", "rap", "r&b"],
        popularity: 98,
        albums: 8,
        spotifyId: "0TnOYISbd1XYRBk9myaseg",
      },
    },
    {
      id: "album-popular-1",
      name: "Scorpion",
      type: "album",
      details: {
        artist: "Drake",
        year: 2018,
        tracks: 25,
        spotifyId: "1ATL5GLyefJaxhQzSPVrLX",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02f907de96b9a4fbc04accc0d5",
      },
    },
    {
      id: "artist-popular-2",
      name: "Beyoncé",
      type: "artist",
      details: {
        genres: ["r&b", "pop", "soul"],
        popularity: 96,
        albums: 7,
        spotifyId: "6vWDO969PvNqNYHIOW5v0m",
      },
    },
    {
      id: "album-popular-2",
      name: "Renaissance",
      type: "album",
      details: {
        artist: "Beyoncé",
        year: 2022,
        tracks: 16,
        spotifyId: "6FJxoadUE4JNVwWHghBwnb",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e023e0698e4ae5661dea9ae6a79",
      },
    },
  ];

  return {
    id: 1001,
    user_id: userId,
    type: "music",
    data: {
      title: "Top Charting Artists",
      description: "The most popular artists loved by millions of listeners worldwide.",
      items: popularMusicItems,
    },
    created_at: new Date().toISOString(),
  };
}

function generateTrendingMusicRecommendation(userId: number): RecommendationDTO {
  const trendingMusicItems: RecommendationItem[] = [
    {
      id: "song-trending-1",
      name: "Blinding Lights",
      type: "song",
      details: {
        artist: "The Weeknd",
        genres: ["synth-pop", "dance"],
        popularity: 95,
        spotifyId: "0VjIjW4GlUZAMYd2vXMi3b",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856",
      },
    },
    {
      id: "song-trending-2",
      name: "Bad Guy",
      type: "song",
      details: {
        artist: "Billie Eilish",
        genres: ["electropop", "pop"],
        popularity: 93,
        spotifyId: "2Fxmhks0bxGSBdJ92vM42m",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02deae7d931928fc1543e70203",
      },
    },
    {
      id: "song-trending-3",
      name: "Levitating",
      type: "song",
      details: {
        artist: "Dua Lipa",
        genres: ["pop", "disco"],
        popularity: 94,
        spotifyId: "39LLxExYz6ewLAcYrzQQyP",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e0282b243023e9806c15b5f8130",
      },
    },
    {
      id: "song-trending-4",
      name: "Stay",
      type: "song",
      details: {
        artist: "The Kid LAROI & Justin Bieber",
        genres: ["pop", "hip hop"],
        popularity: 92,
        spotifyId: "5HCyWlXZPP0y6Gqq8TgA20",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02ca99583f5142d370240b8ada",
      },
    },
  ];

  return {
    id: 1002,
    user_id: userId,
    type: "music",
    data: {
      title: "Trending Songs Right Now",
      description: "Catch up with what everyone is listening to this week.",
      items: trendingMusicItems,
    },
    created_at: new Date().toISOString(),
  };
}

function generatePopularFilmRecommendation(userId: number): RecommendationDTO {
  const popularFilmItems: RecommendationItem[] = [
    {
      id: "movie-popular-1",
      name: "Avengers: Endgame",
      type: "movie",
      details: {
        director: "Anthony & Joe Russo",
        year: 2019,
        genres: ["action", "adventure", "sci-fi"],
        duration: 181,
      },
    },
    {
      id: "movie-popular-2",
      name: "Avatar",
      type: "movie",
      details: {
        director: "James Cameron",
        year: 2009,
        genres: ["action", "adventure", "fantasy"],
        duration: 162,
      },
    },
    {
      id: "movie-popular-3",
      name: "Titanic",
      type: "movie",
      details: {
        director: "James Cameron",
        year: 1997,
        genres: ["drama", "romance"],
        duration: 195,
      },
    },
    {
      id: "movie-popular-4",
      name: "Star Wars: The Force Awakens",
      type: "movie",
      details: {
        director: "J.J. Abrams",
        year: 2015,
        genres: ["action", "adventure", "sci-fi"],
        duration: 138,
      },
    },
  ];

  return {
    id: 1003,
    user_id: userId,
    type: "film",
    data: {
      title: "Highest Grossing Films of All Time",
      description: "Blockbusters loved by audiences worldwide that broke box office records.",
      items: popularFilmItems,
    },
    created_at: new Date().toISOString(),
  };
}

function generateTrendingFilmRecommendation(userId: number): RecommendationDTO {
  const trendingFilmItems: RecommendationItem[] = [
    {
      id: "movie-trending-1",
      name: "Dune",
      type: "movie",
      details: {
        director: "Denis Villeneuve",
        year: 2021,
        genres: ["sci-fi", "adventure"],
        duration: 155,
      },
    },
    {
      id: "movie-trending-2",
      name: "No Time to Die",
      type: "movie",
      details: {
        director: "Cary Joji Fukunaga",
        year: 2021,
        genres: ["action", "adventure", "thriller"],
        duration: 163,
      },
    },
    {
      id: "movie-trending-3",
      name: "The Batman",
      type: "movie",
      details: {
        director: "Matt Reeves",
        year: 2022,
        genres: ["action", "crime", "drama"],
        duration: 176,
      },
    },
    {
      id: "movie-trending-4",
      name: "Top Gun: Maverick",
      type: "movie",
      details: {
        director: "Joseph Kosinski",
        year: 2022,
        genres: ["action", "drama"],
        duration: 130,
      },
    },
  ];

  return {
    id: 1004,
    user_id: userId,
    type: "film",
    data: {
      title: "Trending Movies Everyone's Talking About",
      description: "The most talked about films that are making waves in theaters and streaming.",
      items: trendingFilmItems,
    },
    created_at: new Date().toISOString(),
  };
}

function generateMockMusicRecommendation(userId: number, id: number): RecommendationDTO {
  const musicItems: RecommendationItem[] = [
    {
      id: `artist-${id}-1`,
      name: "Taylor Swift",
      type: "artist",
      details: {
        genres: ["pop", "country pop"],
        popularity: 99,
        albums: 10,
        spotifyId: "06HL4z0CvFAxyc27GXpf02",
      },
    },
    {
      id: `album-${id}-1`,
      name: "Midnights",
      type: "album",
      details: {
        artist: "Taylor Swift",
        year: 2022,
        tracks: 13,
        spotifyId: "151w1FgRZfnKZA9FEcg9Z3",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02e0b60c608586d88252b8fbc0",
      },
    },
    {
      id: `artist-${id}-2`,
      name: "Kendrick Lamar",
      type: "artist",
      details: {
        genres: ["hip hop", "rap", "west coast rap"],
        popularity: 96,
        albums: 5,
        spotifyId: "2YZyLoL8N0Wb9xBt1NhZWg",
      },
    },
    {
      id: `album-${id}-2`,
      name: "Mr. Morale & The Big Steppers",
      type: "album",
      details: {
        artist: "Kendrick Lamar",
        year: 2022,
        tracks: 18,
        spotifyId: "79ONNoS4M9tfIA1mYLBYVX",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e0295f5585e2a3e426f7886996c",
      },
    },
  ];

  return {
    id,
    user_id: userId,
    type: "music",
    data: {
      title: "New Music Recommendations",
      description: "Based on your listening history and preferences, we think you might like these artists and albums.",
      items: musicItems,
    },
    created_at: new Date().toISOString(),
  };
}

function generateMockFilmRecommendation(userId: number, id: number): RecommendationDTO {
  const actionItems: RecommendationItem[] = [
    {
      id: `movie-${id}-1`,
      name: "The Dark Knight",
      type: "movie",
      details: {
        director: "Christopher Nolan",
        year: 2008,
        genres: ["action", "crime", "drama"],
        duration: 152,
      },
    },
    {
      id: `movie-${id}-2`,
      name: "Inception",
      type: "movie",
      details: {
        director: "Christopher Nolan",
        year: 2010,
        genres: ["action", "sci-fi", "thriller"],
        duration: 148,
      },
    },
    {
      id: `movie-${id}-3`,
      name: "Mad Max: Fury Road",
      type: "movie",
      details: {
        director: "George Miller",
        year: 2015,
        genres: ["action", "adventure", "sci-fi"],
        duration: 120,
      },
    },
  ];

  const dramaItems: RecommendationItem[] = [
    {
      id: `movie-${id}-4`,
      name: "The Shawshank Redemption",
      type: "movie",
      details: {
        director: "Frank Darabont",
        year: 1994,
        genres: ["drama"],
        duration: 142,
      },
    },
    {
      id: `movie-${id}-5`,
      name: "The Godfather",
      type: "movie",
      details: {
        director: "Francis Ford Coppola",
        year: 1972,
        genres: ["crime", "drama"],
        duration: 175,
      },
    },
    {
      id: `movie-${id}-6`,
      name: "Schindler's List",
      type: "movie",
      details: {
        director: "Steven Spielberg",
        year: 1993,
        genres: ["biography", "drama", "history"],
        duration: 195,
      },
    },
  ];

  // Randomly choose between action and drama recommendations
  const items = Math.random() > 0.5 ? actionItems : dramaItems;

  // Safely get the first genre if it exists
  let firstGenre = "";
  if (
    items.length > 0 &&
    items[0].details &&
    typeof items[0].details === "object" &&
    "genres" in items[0].details &&
    Array.isArray(items[0].details.genres) &&
    items[0].details.genres.length > 0
  ) {
    firstGenre = items[0].details.genres[0] as string;
  }

  const title = `${firstGenre.charAt(0).toUpperCase() + firstGenre.slice(1)} Films for Your Taste`;
  const description = `Based on your preferences, we think you might enjoy these ${firstGenre} films.`;

  return {
    id: 200 + id,
    user_id: userId,
    type: "film",
    data: {
      title,
      description,
      items,
    },
    created_at: new Date().toISOString(),
  };
}
