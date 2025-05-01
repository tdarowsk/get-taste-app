import React from "react";
import type { MetadataWeight } from "../types/recommendations";
import { MetadataType } from "../types/recommendations";

interface MetadataFilterSelectorProps {
  weights: MetadataWeight[];
  onWeightsChange: (weights: MetadataWeight[]) => void;
}

export function MetadataFilterSelector({ weights, onWeightsChange }: MetadataFilterSelectorProps) {
  const handleWeightChange = (type: MetadataType, newWeight: number) => {
    const updatedWeights = weights.map((weight) => (weight.type === type ? { ...weight, weight: newWeight } : weight));
    onWeightsChange(updatedWeights);
  };

  const resetWeights = () => {
    const resetWeights = weights.map((weight) => ({ ...weight, weight: 0.5 }));
    onWeightsChange(resetWeights);
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
        {weights.map((weight) => (
          <div key={weight.type} className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor={`weight-${weight.type}`} className="text-sm font-medium">
                {weight.name}
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(weight.weight * 100)}%</span>
            </div>
            <input
              id={`weight-${weight.type}`}
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weight.weight}
              onChange={(e) => handleWeightChange(weight.type, parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
