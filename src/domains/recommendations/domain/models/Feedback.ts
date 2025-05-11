import { FeedbackType } from "../enums/FeedbackType";

export class Feedback {
  constructor(
    public readonly id: string,
    public readonly recommendationId: string,
    public readonly itemId: string,
    public readonly type: FeedbackType,
    public readonly userId: string,
    public readonly createdAt: Date
  ) {}

  public isPositive(): boolean {
    return this.type === FeedbackType.LIKE;
  }

  public isNegative(): boolean {
    return this.type === FeedbackType.DISLIKE;
  }
}
