/**
 * DTO and Command Model definitions for the getTaste API.
 *
 * Note:
 * - These types are declared based on the API plan and the underlying database models.
 * - Some fields (e.g. IDs) have been transformed (e.g. from string in the DB to number in DTOs)
 *   for clarity in the API. Conversion between types is expected to occur in the application layer.
 */

/* =========================
   Authentication & User Registration
   ========================= */

/** Command Model for user registration (POST /auth/register) */
export interface RegisterUserCommand {
  email: string;
  password: string;
  nick: string;
}

/** DTO for the response of user registration */
export interface RegisterUserResponseDTO {
  id: number; // transformed from DB string id to number
  email: string;
  nick: string;
  created_at: string;
  updated_at: string;
}

/** Command Model for user login (POST /auth/login) */
export interface LoginCommand {
  email: string;
  password: string;
}

/** DTO for the response of login containing the JWT token */
export interface LoginResponseDTO {
  token: string;
  user: UserProfileDTO;
}

/** DTO representing the authenticated user's profile (GET /auth/me and GET /users/{id}) */
export interface UserProfileDTO {
  id: string; // Changed from number to string to match Supabase Auth UUID
  email: string;
  nick: string;
  created_at: string;
  updated_at: string;
}

/** Alias for the /auth/me response */
export type AuthMeResponseDTO = UserProfileDTO;

/** Command Model for updating user details via PATCH /users/{id} */
export interface UpdateUserCommand {
  nick?: string;
}

/* =========================
     User Preferences
     ========================= */

/** Combined DTO for a user's preferences (GET /users/{id}/preferences) */
export interface UserPreferencesDTO {
  music?: MusicPreferencesDTO;
  film?: FilmPreferencesDTO;
}

/** DTO for music preferences (from music_preferences table) */
export interface MusicPreferencesDTO {
  genres: string[];
  artists: string[];
}

/** Command Model for updating music preferences (PATCH /users/{id}/preferences/music) */
export interface UpdateMusicPreferencesCommand {
  genres?: string[];
  artists?: string[];
}

/** DTO for film preferences (from film_preferences table) */
export interface FilmPreferencesDTO {
  genres: string[];
  director: string | null;
  cast: string[];
  screenwriter: string | null;
  liked_movies: string[];
}

/** Command Model for updating film preferences (PATCH /users/{id}/preferences/film) */
export interface UpdateFilmPreferencesCommand {
  genres?: string[];
  director?: string;
  cast?: string[];
  screenwriter?: string;
  liked_movies?: string[];
}

/** DTO for user taste based on preferences and recommendations */
export interface UserTasteDTO {
  name: string;
  description: string;
  music: MusicTasteProfile;
  film: FilmTasteProfile;
}

/** DTO for specific taste category */
export interface TasteDTO {
  genres?: string[];
  mood?: string[];
  style?: string;
  intensity?: number;
  variety?: number;
}

/* =========================
     Recommendations
     ========================= */

/** DTO for recommendations (from recommendations table) */
export interface RecommendationDTO {
  id: number;
  user_id: string;
  type: "music" | "film";
  data: RecommendationDataDetails;
  created_at: string;
}

/** Detailed structure for recommendation data */
export interface RecommendationDataDetails {
  title: string;
  description: string;
  items: RecommendationItem[];
  recommendations?: RecommendationItem[];
  results?: RecommendationItem[];
  errorMessage?: string;
}

/** Structure for recommendation item */
export interface RecommendationItem {
  id: string;
  name: string;
  type: string;
  details: Record<string, unknown>;
  explanation?: string;
  confidence?: number;
}

/** Command Model for generating new recommendations (POST /users/{id}/recommendations) */
export interface CreateRecommendationsCommand {
  type: "music" | "film";
  force_refresh?: boolean;
}

/** Enum for recommendation feedback type */
export enum FeedbackType {
  LIKE = "like",
  DISLIKE = "dislike",
}

/** Type for feedback from API */
export type RecommendationFeedbackType = "like" | "dislike";

/** Interface for recommendation feedback */
export interface RecommendationFeedback {
  id: number;
  recommendation_id: number;
  user_id: number;
  feedback_type: RecommendationFeedbackType;
  created_at: string;
}

/** Command Model for submitting recommendation feedback (POST /users/{id}/recommendations/{rec_id}/feedback) */
export interface SubmitRecommendationFeedbackCommand {
  feedback_type: RecommendationFeedbackType;
}

/** DTO for recommendation feedback history (GET /users/{id}/recommendation-history) */
export interface RecommendationHistoryDTO {
  data: RecommendationWithFeedbackDTO[];
  count: number;
  limit: number;
  offset: number;
}

/** DTO for recommendation with feedback details */
export interface RecommendationWithFeedbackDTO {
  recommendation: RecommendationDTO;
  feedback: RecommendationFeedback;
}

/** Command Model for filtering recommendation history (GET /users/{id}/recommendation-history) */
export interface FilterRecommendationHistoryCommand {
  type?: "music" | "film";
  feedback_type?: RecommendationFeedbackType;
  limit?: number;
  offset?: number;
}

/* =========================
     Spotify Integration
     ========================= */

/** Command Model for initiating a Spotify synchronization (POST /spotify/sync) */
export interface SpotifySyncCommand {
  user_id: number;
}

/** DTO for Spotify data (from spotify_data table, GET /users/{id}/spotify) */
export interface SpotifyDataDTO {
  id: number;
  user_id: number; // transformed from DB string id to number
  album_id: string | null;
  artist_id: string | null;
  data: SpotifyDataDetails; // Changed from 'any' to SpotifyDataDetails
  created_at: string;
}

/** Detailed structure for Spotify data */
export interface SpotifyDataDetails {
  album_name?: string;
  artist_name?: string;
  genres?: string[];
  popularity?: number;
  release_date?: string;
  tracks?: SpotifyTrack[];
}

/** Structure for Spotify track data */
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
}

/** Response DTO for POST /spotify/sync */
export interface SpotifySyncResponseDTO {
  message: string;
  status: "success" | "error";
  details?: string;
}

/** Response DTO for GET /users/{id}/spotify */
export interface SpotifyDataListResponseDTO {
  data: SpotifyDataDTO[];
  count: number;
  limit: number;
  offset: number;
}

/* =========================
   OpenRouter API Integration
   ========================= */

/** Response format type for structured LLM responses */
export interface ResponseFormat {
  type: "text" | "json_object" | "json_schema";
  json_schema?: {
    name?: string;
    strict?: boolean;
    schema: object;
  };
}

/** Chat message structure */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

/** Chat completion request structure */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/** Chat completion response structure */
export interface ChatCompletionResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    message: ChatMessage;
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Model information structure */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

/**
 * Typy preferencji użytkownika
 */
export interface MusicTasteProfile {
  genres: string[];
  mood: string[];
  style: string;
  intensity: number;
  variety: number;
}

export interface FilmTasteProfile {
  genres: string[];
  mood: string[];
  style: string;
  intensity: number;
  variety: number;
}

export interface MusicPreferences {
  genres?: string[];
  artists?: string[];
  years?: string[];
  tempos?: string[];
  moods?: string[];
  instruments?: string[];
  language?: string;
  themes?: string[];
  popularity?: number;
  variety?: number;
}

export interface FilmPreferences {
  genres?: string[];
  directors?: string[];
  actors?: string[];
  years?: string[];
  language?: string;
  themes?: string[];
  duration?: number;
  rating?: number;
  popularity?: number;
}
