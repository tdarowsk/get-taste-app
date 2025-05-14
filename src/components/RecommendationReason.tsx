import { useState } from "react";
import type { RecommendationReason as RecommendationReasonType } from "../types/recommendations";

interface RecommendationReasonProps {
  reason: RecommendationReasonType;
  expanded?: boolean;
  onToggle?: () => void;
}

export function RecommendationReason({
  reason,
  expanded: controlledExpanded,
  onToggle,
}: RecommendationReasonProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex justify-between items-start">
        <h4 className="text-base font-medium">Dlaczego to widzisz:</h4>
        <button onClick={handleToggle} className="text-sm text-muted-foreground">
          {isExpanded ? "Mniej szczegółów" : "Więcej szczegółów"}
        </button>
      </div>

      <p className="mt-2 text-sm">{reason.primaryReason}</p>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {reason.detailedReasons.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Szczegółowe powody:</h5>
              <ul className="space-y-1 text-sm list-disc list-inside">
                {reason.detailedReasons.map((detailedReason, idx) => (
                  <li key={idx}>{detailedReason}</li>
                ))}
              </ul>
            </div>
          )}

          {reason.relatedItems.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Powiązane z rzeczami, które lubisz:</h5>
              <div className="flex flex-wrap gap-2">
                {reason.relatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background border border-input px-3 py-1 rounded-full text-xs flex items-center"
                  >
                    <span>{item.name}</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-muted rounded-full text-xs">
                      {Math.round(item.similarity * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
