import { Recommendation } from "../../domain/models/Recommendation";
import { RecommendationType } from "../../domain/enums/RecommendationType";
import type { IRecommendationRepository } from "../../domain/interfaces/IRecommendationRepository";
import type { DataSource } from "../data/DataSource";
import { RecommendationItem } from "../../domain/models/RecommendationItem";

interface RecommendationDTO {
  id: number;
  user_id: string;
  type: "music" | "film";
  data: {
    title: string;
    description: string;
    items: {
      id: string;
      name: string;
      type: string;
      details: Record<string, unknown>;
      explanation?: string;
      confidence?: number;
    }[];
  };
  created_at: string;
}

export class RecommendationRepository implements IRecommendationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findByUserAndType(userId: string, type: RecommendationType): Promise<Recommendation[]> {
    const recommendationDTOs = await this.dataSource.query<RecommendationDTO[]>(
      `/api/users/${encodeURIComponent(userId)}/recommendations?type=${type}`
    );

    return recommendationDTOs.map((dto) => this.mapDtoToDomain(dto));
  }

  async findById(id: string): Promise<Recommendation | null> {
    try {
      const dto = await this.dataSource.query<RecommendationDTO>(`/api/recommendations/${id}`);
      return this.mapDtoToDomain(dto);
    } catch {
      // Error caught and ignored
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(recommendation: Recommendation): Promise<void> {
    // In a real implementation, we would save the recommendation to the API
    // This is not implemented in the current API, so we'll just stub it
  }

  private mapDtoToDomain(dto: RecommendationDTO): Recommendation {
    return new Recommendation(
      String(dto.id),
      dto.user_id,
      dto.type === "music" ? RecommendationType.MUSIC : RecommendationType.FILM,
      dto.data.items.map(
        (item) =>
          new RecommendationItem(
            item.id,
            item.name,
            item.type,
            item.details,
            item.explanation,
            item.confidence
          )
      ),
      dto.data.title,
      dto.data.description,
      new Date(dto.created_at)
    );
  }
}
