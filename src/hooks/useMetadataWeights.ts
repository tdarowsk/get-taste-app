import { useState, useCallback } from "react";
import type { MetadataWeight, MetadataType } from "../types/recommendations";

export function useMetadataWeights(initialWeights: MetadataWeight[]) {
  const [weights, setWeights] = useState<MetadataWeight[]>(initialWeights);

  const updateWeight = useCallback((type: MetadataType, newWeight: number) => {
    setWeights((prevWeights) =>
      prevWeights.map((weight) =>
        weight.type === type ? { ...weight, weight: Math.max(0, Math.min(1, newWeight)) } : weight
      )
    );
  }, []);

  const resetWeights = useCallback(() => {
    setWeights(initialWeights);
  }, [initialWeights]);

  return {
    weights,
    updateWeight,
    resetWeights,
  };
}
