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
  data: any; // JSON payload with recommendation details
  created_at: string;
}

/** Command Model for generating new recommendations (POST /users/{id}/recommendations) */
export interface CreateRecommendationsCommand {
  type: "music" | "film";
  force_refresh: boolean;
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
  data: any; // JSON payload with Spotify data
  created_at: string;
}
