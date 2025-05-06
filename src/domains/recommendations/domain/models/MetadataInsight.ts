import { MetadataItem } from "./MetadataItem";

export class MetadataInsight {
  constructor(
    public readonly recommendationId: string,
    public readonly primaryFactors: MetadataItem[],
    public readonly secondaryFactors: MetadataItem[],
    public readonly uniqueFactors: MetadataItem[]
  ) {}

  public getAllFactors(): MetadataItem[] {
    return [...this.primaryFactors, ...this.secondaryFactors, ...this.uniqueFactors];
  }

  public hasFactors(): boolean {
    return (
      this.primaryFactors.length > 0 ||
      this.secondaryFactors.length > 0 ||
      this.uniqueFactors.length > 0
    );
  }
}
