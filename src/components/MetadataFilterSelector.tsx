import React from "react";
import { useFormContext } from "react-hook-form";
import { FormRangeSlider } from "./ui/FormRangeSlider";
import type { RecommendationFormValues } from "../types/forms";

interface MetadataFilterSelectorProps {
  onResetWeights?: () => void;
}

export function MetadataFilterSelector({ onResetWeights }: MetadataFilterSelectorProps) {
  const { getValues, setValue } = useFormContext<RecommendationFormValues>();

  const weights = getValues("weights");

  const resetWeights = () => {
    if (onResetWeights) {
      onResetWeights();
    } else {
      const resetWeights = weights.map((weight) => ({ ...weight, weight: 0.5 }));
      setValue("weights", resetWeights, { shouldDirty: true });
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Dostosuj wpływ metadanych</h3>
        <button
          onClick={resetWeights}
          className="text-sm px-2 py-1 rounded border border-input hover:bg-accent hover:text-accent-foreground"
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {weights.map((weight, index) => (
          <FormRangeSlider
            key={weight.type}
            name={`weights.${index}.weight`}
            label={weight.name}
            min={0}
            max={1}
            step={0.1}
          />
        ))}
      </div>
    </div>
  );
}
