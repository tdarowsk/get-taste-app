/**
 * View Models for Dashboard UI
 */

/**
 * ViewModel to represent UI recommendations
 */
export interface RecommendationViewModel {
  id: number;
  type: "music" | "film";
  title: string;
  items: RecommendationItemViewModel[];
  createdAt: Date;
}

/**
 * ViewModel for a recommendation item
 */
export interface RecommendationItemViewModel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  metadata: Record<string, unknown>;
}

/**
 * ViewModel for music preferences form
 */
export interface MusicPreferencesFormModel {
  genres: string[];
  artists: string[];
}

/**
 * ViewModel for film preferences form
 */
export interface FilmPreferencesFormModel {
  genres: string[];
  director: string;
  cast: string[];
  screenwriter: string;
}
