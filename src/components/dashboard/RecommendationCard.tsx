import { Card } from "../ui/card";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";

interface RecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  "data-testid"?: string;
}

export function RecommendationCard({ item, type, "data-testid": testId }: RecommendationCardProps) {
  // Log item details for debugging

  // Define placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Use actual image or placeholder
  const imageUrl =
    item.imageUrl ||
    (item.metadata && "imageUrl" in item.metadata ? String(item.metadata.imageUrl) : null) ||
    (item.metadata && "poster" in item.metadata ? String(item.metadata.poster) : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "imageUrl" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).imageUrl)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "poster" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).poster)
      : null) ||
    placeholderImage;

  // Extract genre safely
  let genres = [];
  if (Array.isArray(item.metadata.genres)) {
    genres = item.metadata.genres;
  } else if (item.metadata.genre) {
    genres = [item.metadata.genre];
  } else {
    genres = [type === "music" ? "Music" : "Film"];
  }

  const primaryGenre = genres.length > 0 ? String(genres[0]) : type === "music" ? "Music" : "Film";

  // Function to safely get property from metadata
  const getMetadataValue = (key: string): string | null => {
    if (!item.metadata) return null;

    // Dodaj debug dla ważnych przypadków
    if (key === "director" || key === "poster" || key === "image") {
    }

    // Sprawdź bezpośrednio w metadanych - dane z AI będą najczęściej tutaj
    if (key in item.metadata) {
      const value = item.metadata[key];
      if (value) return String(value);
    }

    // Sprawdź w zagnieżdżonych detalach
    if (item.metadata.details && typeof item.metadata.details === "object") {
      const details = item.metadata.details as Record<string, unknown>;
      if (key in details) {
        const value = details[key];
        if (value) return String(value);
      }
    }

    // Specjalne sprawdzenie dla tablicy 'directors' jeśli szukamy 'director'
    if (key === "director") {
      // Sprawdź tablicę directors w metadanych
      if (Array.isArray(item.metadata.directors) && item.metadata.directors.length > 0) {
        return String(item.metadata.directors[0]);
      }

      // Sprawdź tablicę directors w details
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (Array.isArray(details.directors) && details.directors.length > 0) {
          return String(details.directors[0]);
        }
      }

      // Hardcoded fallback dla znanych filmów
      if (
        item.name === "Inception" ||
        item.name === "Interstellar" ||
        item.name === "The Dark Knight"
      ) {
        return "Christopher Nolan";
      }
      if (item.name === "Blade Runner 2049" || item.name === "Arrival") {
        return "Denis Villeneuve";
      }
      if (item.name === "Parasite" || item.name === "Snowpiercer") {
        return "Bong Joon-ho";
      }
    }

    return null;
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");
  const director = getMetadataValue("director");
  const year = getMetadataValue("year");

  // Apply different accent colors based on type
  const accentColor =
    type === "music" ? "from-blue-600 to-indigo-600" : "from-purple-600 to-pink-600";

  // Format the subtitle text
  const getSubtitle = () => {
    if (type === "music" && artist) {
      return year ? `${artist} (${year})` : artist;
    }
    if (type === "film" && director) {
      return year ? `Dir: ${director} (${year})` : `Dir: ${director}`;
    }
    return year ? `(${year})` : "";
  };

  // Determine display name - fallback to placeholder if no name is available
  const displayName = item.name || (type === "music" ? "Unknown Track" : "Unknown Movie");

  return (
    <Card
      data-testid={testId}
      className="overflow-hidden transition-all duration-300 h-full flex flex-col group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg rounded-lg cursor-pointer hover:transform hover:scale-105"
    >
      <div className="flex p-3">
        {/* Thumbnail image */}
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-md mr-3 border border-white/10">
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        </div>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <div
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${accentColor} text-white mb-1`}
          >
            {primaryGenre}
          </div>
          <h3 className="text-xs font-bold line-clamp-1 text-white">{displayName}</h3>
          <p className="text-[10px] text-gray-300 line-clamp-1">{getSubtitle()}</p>
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
        <button
          className={`p-1.5 rounded-full bg-gradient-to-r ${accentColor} text-white shadow-md`}
        >
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>
    </Card>
  );
}
