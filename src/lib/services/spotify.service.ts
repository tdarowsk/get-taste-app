import { supabaseClient } from "../../db/supabase.client";
import type { SpotifyDataDTO, SpotifySyncCommand, SpotifySyncResponseDTO, RecommendationItem } from "../../types";
import { z } from "zod";

// Schema for Spotify data validation
const spotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration_ms: z.number().positive(),
  explicit: z.boolean(),
  preview_url: z.string().url().optional(),
});

// Schema for Spotify data details validation
const spotifyDataSchema = z.object({
  album_name: z.string().optional(),
  artist_name: z.string().optional(),
  genres: z.array(z.string()).optional(),
  popularity: z.number().min(0).max(100).optional(),
  release_date: z.string().optional(),
  tracks: z.array(spotifyTrackSchema).optional(),
});

// Schema for sync command validation
const spotifySyncSchema = z.object({
  user_id: z.number().positive(),
});

// Interface for Spotify data details
export interface SpotifyDataDetails {
  album_name?: string;
  artist_name?: string;
  genres?: string[];
  popularity?: number;
  release_date?: string;
  tracks?: SpotifyTrack[];
}

// Interface for Spotify track
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
}

// Helper functions for Spotify data

/**
 * Initiates synchronization of Spotify data for a user.
 *
 * @param command - Spotify sync command
 * @returns Status of the synchronization
 * @throws Error if database or Spotify API errors occur
 */
export async function syncSpotifyData(command: SpotifySyncCommand): Promise<SpotifySyncResponseDTO> {
  // Validate input data
  try {
    spotifySyncSchema.parse(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Invalid input data: ${error.message}`);
    }
    throw new Error("Invalid input data");
  }

  try {
    // Fetch data from Spotify API
    // In MVP we use simulated data
    const spotifyData = await fetchSpotifyData();

    // Validate fetched data
    const validatedData = spotifyDataSchema.parse(spotifyData);

    // Save data to database
    const { error } = await supabaseClient.from("spotify_data").insert({
      user_id: command.user_id.toString(), // Convert number to string
      album_id: "sample_album_id", // In real implementation from Spotify API
      artist_id: "sample_artist_id", // In real implementation from Spotify API
      data: validatedData,
    });

    if (error) {
      throw new Error(`Error saving Spotify data: ${error.message}`);
    }

    return {
      message: "Spotify synchronization started",
      status: "success",
    };
  } catch (error: unknown) {
    console.error(`Error during Spotify synchronization: ${error instanceof Error ? error.message : String(error)}`);
    return {
      message: "An error occurred during Spotify synchronization",
      status: "error",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Retrieves Spotify data for a user.
 *
 * @param userId - User ID
 * @param limit - Result limit (default 10)
 * @param offset - Pagination offset (default 0)
 * @returns List of Spotify data and pagination metadata
 * @throws Error if database errors occur
 */
export async function getSpotifyData(
  userId: string | number,
  limit = 10,
  offset = 0
): Promise<{ data: SpotifyDataDTO[]; count: number; limit: number; offset: number }> {
  // Convert userId to string if it's a number
  const userIdString = typeof userId === "number" ? userId.toString() : userId;

  // Get total record count
  const { count, error: countError } = await supabaseClient
    .from("spotify_data")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userIdString);

  if (countError) {
    throw new Error(`Error retrieving record count: ${countError.message}`);
  }

  // Get paginated data
  const { data, error } = await supabaseClient
    .from("spotify_data")
    .select("*")
    .eq("user_id", userIdString)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error retrieving Spotify data: ${error.message}`);
  }

  // Map data to DTO
  const mappedData = data.map((item) => ({
    id: item.id,
    user_id: typeof item.user_id === "string" ? parseInt(item.user_id) : item.user_id,
    album_id: item.album_id,
    artist_id: item.artist_id,
    data: item.data as SpotifyDataDetails,
    created_at: item.created_at,
  }));

  return {
    data: mappedData,
    count: count || 0,
    limit,
    offset,
  };
}

/**
 * Helper method to fetch data from Spotify API.
 * In MVP returns sample data, in production will implement real integration.
 *
 * @returns Sample data from Spotify API
 */
async function fetchSpotifyData(): Promise<SpotifyDataDetails> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Sample data in Spotify API format
  return {
    album_name: "Sample Album",
    artist_name: "Sample Artist",
    genres: ["Rock", "Alternative"],
    popularity: 85,
    release_date: "2023-04-15",
    tracks: [
      {
        id: "track_1",
        name: "Sample Track 1",
        duration_ms: 240000,
        explicit: false,
        preview_url: "https://spotify.com/preview/track_1",
      },
      {
        id: "track_2",
        name: "Sample Track 2",
        duration_ms: 180000,
        explicit: true,
        preview_url: "https://spotify.com/preview/track_2",
      },
    ],
  };
}

/**
 * Service for interacting with the Spotify API
 */
export class SpotifyService {
  private readonly API_BASE_URL = "https://api.spotify.com/v1";
  private accessToken: string | null = null;

  /**
   * Gets the artist's albums from Spotify API
   * @param artistId The Spotify artist ID
   * @param includeGroups Optional filter for album types (album, single, appears_on, compilation)
   * @param market Optional market code (ISO 3166-1 alpha-2 country code)
   * @param limit Maximum number of albums to return (default: 10, max: 50)
   */
  async getArtistAlbums(
    artistId: string,
    includeGroups = "album,single",
    market = "US",
    limit = 10
  ): Promise<RecommendationItem[]> {
    try {
      // In a real implementation, we would:
      // 1. Get a valid access token from our auth system
      // 2. Make the API request to Spotify
      // 3. Transform and return the data

      // For now, we'll simulate the response from Spotify
      return this.getMockArtistAlbums(artistId);
    } catch (error) {
      console.error("Error fetching artist albums from Spotify:", error);
      return [];
    }
  }

  /**
   * Mock function to simulate getting artist albums from Spotify
   * This is used for demonstration purposes until actual API integration is implemented
   */
  private getMockArtistAlbums(artistId: string): RecommendationItem[] {
    // Mock data based on the Spotify API response structure
    const artistName = this.getArtistNameById(artistId);

    return [
      {
        id: `album-${artistId}-1`,
        name: `${artistName} - Album 1`,
        type: "album",
        details: {
          artist: artistName,
          releaseDate: "2022-05-20",
          totalTracks: 12,
          imageUrl: "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
        },
      },
      {
        id: `album-${artistId}-2`,
        name: `${artistName} - Album 2`,
        type: "album",
        details: {
          artist: artistName,
          releaseDate: "2020-08-15",
          totalTracks: 10,
          imageUrl: "https://i.scdn.co/image/ab67616d00001e02b5d60a94c44a87d9c1768ba2",
        },
      },
      {
        id: `album-${artistId}-3`,
        name: `${artistName} - Single Collection`,
        type: "single",
        details: {
          artist: artistName,
          releaseDate: "2021-03-10",
          totalTracks: 5,
          imageUrl: "https://i.scdn.co/image/ab67616d00001e02dbfc8e57c44bb54e10d7c6c7",
        },
      },
    ];
  }

  /**
   * Helper method to get artist name from ID
   * In a real implementation, this would use a database lookup or API call
   */
  private getArtistNameById(artistId: string): string {
    const artistMap: Record<string, string> = {
      "0TnOYISbd1XYRBk9myaseg": "Drake",
      "6vWDO969PvNqNYHIOW5v0m": "Beyoncé",
      "1Xyo4u8uXC1ZmMpatF05PJ": "The Weeknd",
      "6qqNVTkY8uBg9cP3Jd7DAH": "Billie Eilish",
      "6M2wZ9GZgrQXHCFfjv46we": "Dua Lipa",
      "5K4W6rqBFWDnAN6FQUkS6x": "Kanye West",
      default: "Unknown Artist",
    };

    return artistMap[artistId] || artistMap["default"];
  }

  /**
   * Gets track information from Spotify API
   * @param trackId The Spotify track ID
   * @param market Optional market code (ISO 3166-1 alpha-2 country code)
   */
  async getTrackInfo(trackId: string, market = "US"): Promise<RecommendationItem | null> {
    try {
      // In a real implementation, we would:
      // 1. Get a valid access token
      // 2. Make the API request to Spotify
      // 3. Transform and return the data

      // For now, simulate the Spotify API response
      return this.getMockTrackInfo(trackId);
    } catch (error) {
      console.error("Error fetching track info from Spotify:", error);
      return null;
    }
  }

  /**
   * Mock function to simulate getting track information from Spotify
   */
  private getMockTrackInfo(trackId: string): RecommendationItem {
    // Find the track name based on ID
    const trackMap: Record<string, { name: string; artist: string; imageUrl: string }> = {
      "0VjIjW4GlUZAMYd2vXMi3b": {
        name: "Blinding Lights",
        artist: "The Weeknd",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856",
      },
      "2Fxmhks0bxGSBdJ92vM42m": {
        name: "Bad Guy",
        artist: "Billie Eilish",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02deae7d931928fc1543e70203",
      },
      "39LLxExYz6ewLAcYrzQQyP": {
        name: "Levitating",
        artist: "Dua Lipa",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e0282b243023e9806c15b5f8130",
      },
      "5HCyWlXZPP0y6Gqq8TgA20": {
        name: "Stay",
        artist: "The Kid LAROI & Justin Bieber",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02ca99583f5142d370240b8ada",
      },
      default: {
        name: "Unknown Track",
        artist: "Unknown Artist",
        imageUrl: "https://i.scdn.co/image/ab67616d00001e02000000000000000000000000",
      },
    };

    const trackInfo = trackMap[trackId] || trackMap["default"];

    return {
      id: `track-${trackId}`,
      name: trackInfo.name,
      type: "song",
      details: {
        artist: trackInfo.artist,
        imageUrl: trackInfo.imageUrl,
        spotifyId: trackId,
        popularity: 90,
        releaseDate: "2020-01-01",
      },
    };
  }
}
