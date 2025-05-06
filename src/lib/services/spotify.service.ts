import { supabaseClient } from "../../db/supabase.client";
import type {
  SpotifyDataDTO,
  SpotifySyncCommand,
  SpotifySyncResponseDTO,
  RecommendationItem,
} from "../../types";
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

// Define interfaces for Spotify API responses
interface SpotifyTrackObject {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album?: {
    images?: { url: string; height: number; width: number }[];
    release_date?: string;
  };
  popularity?: number;
  preview_url?: string;
}

interface SpotifyAlbumObject {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images?: { url: string; height: number; width: number }[];
}

interface SpotifyArtistObject {
  id: string;
  name: string;
  images?: { url: string; height: number; width: number }[];
}

// Helper functions for Spotify data

/**
 * Initiates synchronization of Spotify data for a user.
 *
 * @param command - Spotify sync command
 * @returns Status of the synchronization
 * @throws Error if database or Spotify API errors occur
 */
export async function syncSpotifyData(
  command: SpotifySyncCommand
): Promise<SpotifySyncResponseDTO> {
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
  private readonly CLIENT_ID = "39c1fb4056f54cbc83009513dcbc63e8"; // From .env
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  /**
   * Gets an access token for the Spotify API
   * Uses Client Credentials Flow for server-to-server requests
   */
  private async getAccessToken(): Promise<string> {
    // Check if we already have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Get a new token using Client Credentials flow
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // The Authorization header contains "Basic <base64encoded(client_id:client_secret)>"
          // Since we only have client_id, we'll send it in the body
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.CLIENT_ID,
        }),
      });

      if (!response.ok) {
        throw new Error(`Spotify token error: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry time (token expiry minus 60 seconds buffer)
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      // We know the token is set at this point
      if (!this.accessToken) {
        throw new Error("Failed to get Spotify access token");
      }

      return this.accessToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets popular artists from Spotify API
   * @param limit Maximum number of popular artists to return
   * @returns Array of artist information with proper image URLs
   */
  async getPopularArtists(limit = 10): Promise<{ id: string; name: string; imageUrl: string }[]> {
    try {
      // Get a token
      const token = await this.getAccessToken();

      // First, get top artists directly from Spotify's search API
      const topArtistsResponse = await fetch(
        `${this.API_BASE_URL}/search?q=genre:pop&type=artist&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!topArtistsResponse.ok) {
        throw new Error(`Spotify API error: ${topArtistsResponse.statusText}`);
      }

      const topArtistsData = await topArtistsResponse.json();

      // Process the artist data to get IDs, names, and images
      if (topArtistsData?.artists?.items && Array.isArray(topArtistsData.artists.items)) {
        const artists = topArtistsData.artists.items.map((artist: SpotifyArtistObject) => ({
          id: artist.id,
          name: artist.name,
          imageUrl:
            artist.images && artist.images.length > 0
              ? artist.images[0].url
              : "https://via.placeholder.com/300x300?text=No+Image",
        }));

        return artists;
      }

      throw new Error("No artists found in Spotify API response");
    } catch (error) {
      // Don't use fallback data - throw the error so the caller can handle it
      throw new Error(`Failed to fetch artists from Spotify: ${error}`);
    }
  }

  /**
   * Get artist information by ID
   * @param artistId The Spotify artist ID
   * @returns Artist information
   */
  async getArtistInfo(artistId: string): Promise<{ name: string; imageUrl?: string } | null> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.API_BASE_URL}/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        imageUrl: data.images?.[0]?.url,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets the artist's albums from Spotify API
   * @param artistId The Spotify artist ID
   * @returns Array of recommendation items representing albums
   */
  async getArtistAlbums(artistId: string): Promise<RecommendationItem[]> {
    try {
      // Get an access token
      const token = await this.getAccessToken();

      // First, get the artist info for the name
      const artistInfo = await this.getArtistInfo(artistId);
      if (!artistInfo) {
        throw new Error(`Could not get info for artist ID: ${artistId}`);
      }

      // Now get the albums
      const response = await fetch(
        `${this.API_BASE_URL}/artists/${artistId}/albums?include_groups=album,single&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform albums to RecommendationItems
      if (data?.items && Array.isArray(data.items)) {
        return data.items.map((album: SpotifyAlbumObject) => ({
          id: `album-${album.id}`,
          name: album.name,
          type: "album",
          details: {
            artist: artistInfo.name,
            releaseDate: album.release_date,
            totalTracks: album.total_tracks,
            imageUrl: album.images?.[0]?.url,
            spotifyId: album.id,
          },
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Gets track information from Spotify API
   * @param trackId The Spotify track ID
   * @returns Track information as a recommendation item
   */
  async getTrackInfo(trackId: string): Promise<RecommendationItem | null> {
    try {
      // Get an access token
      const token = await this.getAccessToken();

      // Make API request to get track info
      const response = await fetch(`${this.API_BASE_URL}/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = (await response.json()) as SpotifyTrackObject;

      // Extract artist name
      const artistName = data.artists?.[0]?.name || "Unknown Artist";

      // Transform to RecommendationItem
      return {
        id: `track-${trackId}`,
        name: data.name,
        type: "song",
        details: {
          artist: artistName,
          imageUrl: data.album?.images?.[0]?.url,
          spotifyId: trackId,
          popularity: data.popularity,
          releaseDate: data.album?.release_date,
          previewUrl: data.preview_url,
        },
      };
    } catch (error) {
      return null;
    }
  }
}
