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

/** Command Model for 2FA verification (POST /auth/verify-2fa) */
export interface VerifyTwoFaCommand {
  user_id: number;
  verification_code: string;
}

/** DTO for the response of 2FA verification containing the JWT token */
export interface VerifyTwoFaResponseDTO {
  token: string;
}

/** Command Model for user login (POST /auth/login) */
export interface LoginCommand {
  email: string;
  password: string;
}

/** DTO for the response of login.
 *  Either a token is returned directly or a flag indicates 2FA is required.
 */
export interface LoginResponseDTO {
  token?: string;
  requires2FA?: boolean;
}

/** DTO representing the authenticated user's profile (GET /auth/me and GET /users/{id}) */
export interface UserProfileDTO {
  id: number; // transformed from DB string id to number
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
}

/** Command Model for updating film preferences (PATCH /users/{id}/preferences/film) */
export interface UpdateFilmPreferencesCommand {
  genres?: string[];
  director?: string;
  cast?: string[];
  screenwriter?: string;
}

/* =========================
     Recommendations
     ========================= */

/** DTO for recommendations (from recommendations table) */
export interface RecommendationDTO {
  id: number;
  user_id: number; // transformed from DB user_id type to number
  type: "music" | "film";
  data: RecommendationDataDetails; // Changed from 'any' to specific type
  created_at: string;
  feedback?: RecommendationFeedback; // Added feedback field
}

/** Detailed structure for recommendation data */
export interface RecommendationDataDetails {
  title?: string;
  description?: string;
  items?: RecommendationItem[];
  [key: string]: unknown; // Allow for additional properties
}

/** Structure for recommendation item */
export interface RecommendationItem {
  id: string;
  name: string;
  type: string;
  details?: Record<string, unknown>;
}

/** Command Model for generating new recommendations (POST /users/{id}/recommendations) */
export interface CreateRecommendationsCommand {
  type: "music" | "film";
  force_refresh: boolean;
}

/** Enum for recommendation feedback type */
export enum RecommendationFeedbackType {
  LIKE = "like",
  DISLIKE = "dislike",
}

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
