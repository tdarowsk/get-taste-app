import React from "react";
import type { RecommendationDataDetails, RecommendationItem } from "../types";

interface RecommendationContentProps {
  data: RecommendationDataDetails;
  items?: RecommendationItem[];
}

export function RecommendationContent({ data, items = [] }: RecommendationContentProps) {
  return (
    <div className="space-y-4">
      {data.title && <h3 className="text-xl font-bold">{data.title}</h3>}

      {data.description && <p className="text-muted-foreground">{data.description}</p>}

      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-border p-3 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>

                {item.details && item.details.imageUrl && (
                  <img
                    src={item.details.imageUrl as string}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </div>

              {item.details && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(item.details)
                    .filter(([key]) => key !== "imageUrl")
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground">{key}: </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
