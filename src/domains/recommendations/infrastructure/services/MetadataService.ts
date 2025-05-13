import type { IMetadataService } from "../../domain/interfaces/IMetadataService";
import { MetadataInsight } from "../../domain/models/MetadataInsight";
import { MetadataItem } from "../../domain/models/MetadataItem";
import type { DataSource } from "../data/DataSource";
import { MetadataType } from "../../domain/enums/MetadataType";

interface MetadataInsightDTO {
  recommendationId: number;
  primaryFactors: {
    id: string;
    type: string;
    name: string;
    count: number;
    weight: number;
  }[];
  secondaryFactors: {
    id: string;
    type: string;
    name: string;
    count: number;
    weight: number;
  }[];
  uniqueFactors: {
    id: string;
    type: string;
    name: string;
    count: number;
    weight: number;
  }[];
}

export class MetadataService implements IMetadataService {
  constructor(private readonly dataSource: DataSource) {}

  async getInsightForRecommendation(
    userId: string,
    recommendationId: string
  ): Promise<MetadataInsight> {
    const insightDTO = await this.dataSource.query<MetadataInsightDTO>(
      `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/metadata`
    );

    return this.mapDtoToDomain(insightDTO);
  }

  async updateWeights(userId: string, weights: { type: string; weight: number }[]): Promise<void> {
    await this.dataSource.query(`/api/users/${encodeURIComponent(userId)}/metadata/weights`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weights }),
    });
  }

  private mapDtoToDomain(dto: MetadataInsightDTO): MetadataInsight {
    return new MetadataInsight(
      String(dto.recommendationId),
      this.mapMetadataItemsToDomain(dto.primaryFactors),
      this.mapMetadataItemsToDomain(dto.secondaryFactors),
      this.mapMetadataItemsToDomain(dto.uniqueFactors)
    );
  }

  private mapMetadataItemsToDomain(
    items: { id: string; type: string; name: string; count: number; weight: number }[]
  ): MetadataItem[] {
    return items.map(
      (item) =>
        new MetadataItem(
          item.id,
          this.mapStringToMetadataType(item.type),
          item.name,
          item.count,
          item.weight
        )
    );
  }

  private mapStringToMetadataType(type: string): MetadataType {
    switch (type) {
      case "musicGenre":
        return MetadataType.MUSIC_GENRE;
      case "filmGenre":
        return MetadataType.FILM_GENRE;
      case "director":
        return MetadataType.DIRECTOR;
      case "castMember":
        return MetadataType.CAST_MEMBER;
      case "screenwriter":
        return MetadataType.SCREENWRITER;
      case "artist":
        return MetadataType.ARTIST;
      default:
        throw new Error(`Unknown metadata type: ${type}`);
    }
  }
}
