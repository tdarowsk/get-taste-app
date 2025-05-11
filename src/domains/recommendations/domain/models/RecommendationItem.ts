export class RecommendationItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly details: Record<string, unknown>,
    public readonly explanation?: string,
    public readonly confidence?: number
  ) {}

  public hasExplanation(): boolean {
    return !!this.explanation;
  }

  public getConfidencePercentage(): number {
    return this.confidence !== undefined ? Math.round(this.confidence * 100) : 0;
  }
}
