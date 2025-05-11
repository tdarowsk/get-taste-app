import { IMetadataService } from "../../domain/interfaces/IMetadataService";
import { MetadataType } from "../../domain/enums/MetadataType";

export class UpdateMetadataWeightsUseCase {
  constructor(private metadataService: IMetadataService) {}

  async execute(userId: string, weights: { type: MetadataType; weight: number }[]): Promise<void> {
    // Validate weights
    for (const weight of weights) {
      if (weight.weight < 0 || weight.weight > 1) {
        throw new Error(`Weight value must be between 0 and 1, got ${weight.weight}`);
      }
    }

    // Update weights in the metadata service
    await this.metadataService.updateWeights(
      userId,
      weights.map((w) => ({ type: w.type.toString(), weight: w.weight }))
    );
  }
}
