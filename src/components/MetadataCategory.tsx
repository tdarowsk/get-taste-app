import React, { useState } from "react";
import { MetadataType } from "../types/recommendations";
import type { MetadataItem as MetadataItemType } from "../types/recommendations";
import { MetadataItem } from "./MetadataItem";

interface MetadataCategoryProps {
  type: MetadataType;
  items: MetadataItemType[];
  expanded?: boolean;
  onToggle?: () => void;
  onItemSelect?: (item: MetadataItemType) => void;
}

export function MetadataCategory({
  type,
  items,
  expanded: controlledExpanded,
  onToggle,
  onItemSelect,
}: MetadataCategoryProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleItemClick = (item: MetadataItemType) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      setSelectedItems((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
    }
  };

  const getTypeName = () => {
    switch (type) {
      case MetadataType.MUSIC_GENRE:
        return "Gatunki muzyczne";
      case MetadataType.FILM_GENRE:
        return "Gatunki filmowe";
      case MetadataType.DIRECTOR:
        return "Reżyserzy";
      case MetadataType.CAST_MEMBER:
        return "Obsada";
      case MetadataType.SCREENWRITER:
        return "Scenarzyści";
      case MetadataType.ARTIST:
        return "Artyści";
      default:
        return "Inne";
    }
  };

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        className="w-full px-4 py-3 bg-card flex justify-between items-center"
        onClick={handleToggle}
        type="button"
      >
        <h4 className="font-medium">{getTypeName()}</h4>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-2 py-2 space-y-1">
          {items.length > 0 ? (
            items.map((item) => (
              <MetadataItem
                key={item.id}
                item={item}
                selected={selectedItems.includes(item.id)}
                onClick={() => handleItemClick(item)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">Brak danych</p>
          )}
        </div>
      )}
    </div>
  );
}
