import { RecommendationItem } from "./RecommendationItem";
import { RecommendationType } from "../enums/RecommendationType";

export class Recommendation {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: RecommendationType,
    public readonly items: RecommendationItem[],
    public readonly title: string,
    public readonly description: string,
    public readonly createdAt: Date
  ) {}

  public hasItems(): boolean {
    return this.items.length > 0;
  }

  public getItemById(itemId: string): RecommendationItem | undefined {
    return this.items.find((item) => item.id === itemId);
  }

  public getFirstItem(): RecommendationItem | undefined {
    return this.items[0];
  }
}
