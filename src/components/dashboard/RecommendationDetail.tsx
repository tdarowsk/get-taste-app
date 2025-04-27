import { Button } from "../ui/button";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";

interface RecommendationDetailProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  onClose: () => void;
}

export function RecommendationDetail({ item, type, onClose }: RecommendationDetailProps) {
  // Extract genre safely
  const genre = (item.metadata.genre as string) || (type === "music" ? "Music" : "Film");

  // Function to safely get property from metadata
  const getMetadataValue = (key: string): string | null => {
    if (!item.metadata || !(key in item.metadata)) return null;
    const value = item.metadata[key];
    return value ? String(value) : null;
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");
  const director = getMetadataValue("director");

  // Apply different accent colors based on type
  const accentColor = type === "music" ? "from-blue-500 to-indigo-600" : "from-purple-500 to-pink-600";
  const accentSolid = type === "music" ? "bg-blue-600" : "bg-purple-600";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-t">
      <div className="container mx-auto p-3 max-w-screen-2xl">
        <div className="flex items-start gap-3 max-h-[120px]">
          {/* Small thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div
                  className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${accentSolid} text-white mb-1`}
                >
                  {genre}
                </div>
                <h3 className="text-lg font-bold line-clamp-1">{item.name}</h3>
                {type === "music" && artist && <p className="text-sm text-gray-600 dark:text-gray-300">{artist}</p>}
                {type === "film" && director && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dir: {director}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="mt-1">
                Close
              </Button>
            </div>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{item.description}</p>
            )}
          </div>

          {/* Action button */}
          <div className="flex-shrink-0 flex items-center">
            <Button className={`bg-gradient-to-r ${accentColor} text-white rounded-full h-10 px-4`}>
              {type === "music" ? "Listen now" : "Watch now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
