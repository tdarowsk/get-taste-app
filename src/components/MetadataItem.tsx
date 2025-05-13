import type { MetadataItem as MetadataItemType } from "../types/recommendations";

interface MetadataItemProps {
  item: MetadataItemType;
  selected?: boolean;
  onClick?: () => void;
}

export function MetadataItem({ item, selected = false, onClick }: MetadataItemProps) {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <button
      className={`w-full flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-accent ${selected ? "bg-accent text-accent-foreground" : ""}`}
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-center">
        <span className="text-sm font-medium">{item.name}</span>
        <span className="ml-2 text-xs bg-muted text-muted-foreground px-1 py-0.5 rounded">
          {item.count}×
        </span>
      </div>

      <div className="w-16 h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${item.weight * 100}%` }} />
      </div>
    </button>
  );
}
