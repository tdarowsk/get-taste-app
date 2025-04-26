import { supabaseClient } from "../../db/supabase.client";
import type { SpotifyDataDTO, SpotifySyncCommand, SpotifySyncResponseDTO } from "../../types";
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
