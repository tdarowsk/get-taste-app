import type { RecommendationDTO, RecommendationItem, MusicPreferencesDTO, FilmPreferencesDTO } from "../../types";
import type {
  RecommendationViewModel,
  RecommendationItemViewModel,
  MusicPreferencesFormModel,
  FilmPreferencesFormModel,
} from "../types/viewModels";

/**
 * Transforms a RecommendationDTO to a RecommendationViewModel
 */
export function transformRecommendationToViewModel(dto: RecommendationDTO): RecommendationViewModel {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.data.title || "Recommendation",
    items: (dto.data.items || []).map(transformRecommendationItemToViewModel),
    createdAt: new Date(dto.created_at),
  };
}

/**
 * Transforms a RecommendationItem to a RecommendationItemViewModel
 */
export function transformRecommendationItemToViewModel(item: RecommendationItem): RecommendationItemViewModel {
  return {
    id: item.id,
    name: item.name,
    description: item.details?.description as string | undefined,
    imageUrl: item.details?.imageUrl as string | undefined,
    metadata: item.details || {},
  };
}

/**
 * Transforms MusicPreferencesDTO to MusicPreferencesFormModel
 */
export function transformMusicPreferencesToFormModel(dto: MusicPreferencesDTO | undefined): MusicPreferencesFormModel {
  return {
    genres: dto?.genres || [],
    artists: dto?.artists || [],
  };
}

/**
 * Transforms FilmPreferencesDTO to FilmPreferencesFormModel
 */
export function transformFilmPreferencesToFormModel(dto: FilmPreferencesDTO | undefined): FilmPreferencesFormModel {
  return {
    genres: dto?.genres || [],
    director: dto?.director || "",
    cast: dto?.cast || [],
    screenwriter: dto?.screenwriter || "",
  };
}
