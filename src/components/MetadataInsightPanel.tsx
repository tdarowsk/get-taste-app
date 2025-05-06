import React, { useState, useMemo } from "react";
import { MetadataType } from "../types/recommendations";
import type { MetadataInsight, MetadataItem as MetadataItemType } from "../types/recommendations";
import { MetadataCategory } from "./MetadataCategory";

interface MetadataInsightPanelProps {
  insight: MetadataInsight;
  onFilterSelect?: (item: MetadataItemType) => void;
}

export function MetadataInsightPanel({ insight, onFilterSelect }: MetadataInsightPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<MetadataType[]>([]);

  const toggleCategory = (type: MetadataType) => {
    setExpandedCategories((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Group items by type
  const groupedItems = useMemo(() => {
    const allItems = [
      ...insight.primaryFactors,
      ...insight.secondaryFactors,
      ...insight.uniqueFactors,
    ];

    const grouped = new Map<MetadataType, MetadataItemType[]>();

    allItems.forEach((item) => {
      if (!grouped.has(item.type)) {
        grouped.set(item.type, []);
      }

      const existing = grouped.get(item.type);
      if (!existing?.some((i) => i.id === item.id)) {
        grouped.set(item.type, [...(existing || []), item]);
      }
    });

    return grouped;
  }, [insight]);

  return (
    <div className="p-4 bg-card rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Czynniki wpływające na rekomendacje</h3>

      <div className="space-y-3">
        {Array.from(groupedItems.entries()).map(([type, items]) => (
          <MetadataCategory
            key={type}
            type={type}
            items={items.sort((a, b) => b.weight - a.weight)}
            expanded={expandedCategories.includes(type)}
            onToggle={() => toggleCategory(type)}
            onItemSelect={onFilterSelect}
          />
        ))}
      </div>
    </div>
  );
}
