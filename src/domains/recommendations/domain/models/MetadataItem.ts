import { MetadataType } from "../enums/MetadataType";

export class MetadataItem {
  constructor(
    public readonly id: string,
    public readonly type: MetadataType,
    public readonly name: string,
    public readonly count: number,
    public readonly weight: number
  ) {}

  public getWeightPercentage(): number {
    return Math.round(this.weight * 100);
  }
}
