import { useState } from "react";
import { Card } from "../ui/card";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { RecommendationDetail } from "./RecommendationDetail";

interface RecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  "data-testid"?: string;
}

export function RecommendationCard({ item, type, "data-testid": testId }: RecommendationCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Define placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Use actual image or placeholder
  const imageUrl = item.imageUrl || placeholderImage;

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
  const accentColor = type === "music" ? "from-blue-600 to-indigo-600" : "from-purple-600 to-pink-600";

  // Handle card click to open detail view
  const handleCardClick = () => {
    setIsDetailOpen(true);
  };

  // Handle close detail view
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  return (
    <>
      <Card
        data-testid={testId}
        className="overflow-hidden transition-all duration-300 h-full flex flex-col group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg rounded-lg cursor-pointer hover:transform hover:scale-105"
        onClick={handleCardClick}
      >
        <div className="flex p-3">
          {/* Thumbnail image */}
          <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-md mr-3 border border-white/10">
            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Title and metadata */}
          <div className="flex-1 min-w-0">
            <div
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${accentColor} text-white mb-1`}
            >
              {genre}
            </div>
            <h3 className="text-xs font-bold line-clamp-1 text-white">{item.name}</h3>
            {type === "music" && artist && <p className="text-[10px] text-gray-300 line-clamp-1">{artist}</p>}
            {type === "film" && director && <p className="text-[10px] text-gray-300 line-clamp-1">Dir: {director}</p>}
          </div>
        </div>

        {item.description && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-gray-300 line-clamp-2">{item.description}</p>
          </div>
        )}

        <div className="mt-auto px-3 pb-3 pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            {type === "music" ? "Listen" : "Watch"}
          </span>
          <button className={`p-1.5 rounded-full bg-gradient-to-r ${accentColor} text-white shadow-md`}>
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </Card>

      {/* Detail View */}
      {isDetailOpen && <RecommendationDetail item={item} type={type} onClose={handleCloseDetail} />}
    </>
  );
}
