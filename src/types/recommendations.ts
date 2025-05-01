import type { RecommendationDTO } from "../types";

export enum MetadataType {
  MUSIC_GENRE = "musicGenre",
  FILM_GENRE = "filmGenre",
  DIRECTOR = "director",
  CAST_MEMBER = "castMember",
  SCREENWRITER = "screenwriter",
  ARTIST = "artist",
}

export interface MetadataItem {
  id: string;
  type: MetadataType;
  name: string;
  count: number; // ile razy wystąpiła w polubionych treściach
  weight: number; // waga w algorytmie rekomendacji (0-1)
}

export interface MetadataInsight {
  recommendationId: number;
  primaryFactors: MetadataItem[]; // główne czynniki wpływające
  secondaryFactors: MetadataItem[]; // drugorzędne czynniki
  uniqueFactors: MetadataItem[]; // unikalne czynniki dla tej rekomendacji
}

export interface RecommendationReason {
  primaryReason: string; // główny powód rekomendacji
  detailedReasons: string[]; // szczegółowe powody
  relatedItems: {
    id: string;
    name: string;
    similarity: number; // podobieństwo (0-1)
  }[];
}

export interface MetadataWeight {
  type: MetadataType;
  name: string;
  weight: number; // 0-1
}

export interface EnhancedRecommendationViewModel {
  recommendation: RecommendationDTO;
  reason: RecommendationReason;
  metadataInsight: MetadataInsight;
  isNew: boolean; // czy to nowa rekomendacja
}
