import { Card } from "../ui/card";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { extractPosterUrl, isValidImageUrl } from "../../lib/utils/poster-utils";
import { MoviePoster } from "../MoviePoster";

interface RecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  "data-testid"?: string;
}

export function RecommendationCard({ item, type, "data-testid": testId }: RecommendationCardProps) {
  // Check if item is AI-generated
  const isAiGenerated = !!(
    (item.metadata && "source" in item.metadata && item.metadata.source === "ai") ||
    (item.metadata && item.metadata.details && typeof item.metadata.details === "object")
  );

  // Define placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Get image URL with enhanced poster handling
  const rawImageUrl =
    extractPosterUrl(item.metadata || {}, type) ||
    item.imageUrl ||
    (item.metadata && "imageUrl" in item.metadata ? String(item.metadata.imageUrl) : null) ||
    (item.metadata && "poster" in item.metadata ? String(item.metadata.poster) : null) ||
    (item.metadata && "img" in item.metadata ? String(item.metadata.img) : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "imageUrl" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).imageUrl)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "img" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).img)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "poster" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).poster)
      : null) ||
    placeholderImage;

  // Validate the image URL before using it
  const imageUrl = isValidImageUrl(rawImageUrl as string) ? rawImageUrl : placeholderImage;

  // Extract genre safely
  let genres: string[] = [];
  if (item.metadata && "genres" in item.metadata && Array.isArray(item.metadata.genres)) {
    genres = item.metadata.genres as string[];
  } else if (
    item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "genres" in (item.metadata.details as Record<string, unknown>) &&
    Array.isArray((item.metadata.details as Record<string, unknown>).genres)
  ) {
    genres = (item.metadata.details as Record<string, unknown>).genres as string[];
  } else if (item.metadata && "genre" in item.metadata) {
    genres = [String(item.metadata.genre)];
  }

  const primaryGenre = genres.length > 0 ? String(genres[0]) : "";

  // Extract cast safely
  let cast: string[] = [];
  if (item.metadata && "cast" in item.metadata && Array.isArray(item.metadata.cast)) {
    cast = item.metadata.cast as string[];
  } else if (
    item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "cast" in (item.metadata.details as Record<string, unknown>) &&
    Array.isArray((item.metadata.details as Record<string, unknown>).cast)
  ) {
    cast = (item.metadata.details as Record<string, unknown>).cast as string[];
  }

  // Function to safely get property from metadata
  const getMetadataValue = (key: string): string | null => {
    if (!item.metadata) return null;

    // Direct check in metadata - AI data will often be here
    if (key in item.metadata) {
      const value = item.metadata[key];
      if (value) return String(value);
    }

    // Check in nested details
    if (item.metadata.details && typeof item.metadata.details === "object") {
      const details = item.metadata.details as Record<string, unknown>;
      if (key in details) {
        const value = details[key];
        if (value) return String(value);
      }
    }

    // Special check for 'directors' array if looking for 'director'
    if (key === "director") {
      // Check directors array in metadata
      if (
        "directors" in item.metadata &&
        Array.isArray(item.metadata.directors) &&
        item.metadata.directors.length > 0
      ) {
        return String(item.metadata.directors[0]);
      }

      // Check directors array in details
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (
          "directors" in details &&
          Array.isArray(details.directors) &&
          details.directors.length > 0
        ) {
          return String(details.directors[0]);
        }
      }
    }

    return null;
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");
  const director = getMetadataValue("director");
  const year = getMetadataValue("year");

  // Apply different accent colors based on type and source
  const accentColor = isAiGenerated
    ? "from-green-500 to-emerald-600"
    : type === "music"
      ? "from-blue-600 to-indigo-600"
      : "from-purple-600 to-pink-600";

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

  // Determine display name - fallback to empty string if no name is available
  const displayName = item.name || "";

  // Get a safe string representation of the genres
  const genresString = genres
    .filter((g) => g !== null && g !== undefined)
    .map((g) => String(g))
    .join(", ");

  // Get a safe string representation of the cast
  const castString =
    cast && cast.length > 0
      ? cast
          .filter((c) => c !== null && c !== undefined)
          .map((c) => String(c))
          .slice(0, 3)
          .join(", ")
      : "";

  return (
    <Card
      data-testid={testId}
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col group backdrop-blur-sm border shadow-lg rounded-lg cursor-pointer hover:transform hover:scale-105 ${
        isAiGenerated
          ? "bg-green-900/20 border-green-500/30 hover:border-green-400/40"
          : "bg-white/10 border-white/10 hover:border-white/20"
      }`}
    >
      <div className="absolute top-2 right-2 text-xs text-gray-400 px-2 py-1 bg-black/30 rounded">
        {type === "music" ? "Music" : "Film"}
      </div>

      <div className="flex flex-col h-full">
        <div className="p-4">
          {/* Thumbnail image */}
          <div className="relative w-full h-44 overflow-hidden rounded-md mb-3 border border-white/10 bg-gray-800 aspect-[2/3] flex items-center justify-center">
            {type === "film" ? (
              <MoviePoster title={displayName} size="grid" className="w-full h-full" />
            ) : (
              <img
                src={imageUrl}
                alt={displayName}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/240x360?text=No+Cover";
                }}
              />
            )}

            {/* AI badge overlay */}
            {isAiGenerated && (
              <div className="absolute top-2 left-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                AI
              </div>
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex-1 min-w-0">
            {primaryGenre && (
              <div
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${accentColor} text-white mb-1`}
              >
                {primaryGenre}
              </div>
            )}
            <h3 className="text-base font-bold line-clamp-1 text-white mt-1">{displayName}</h3>
            {isAiGenerated ? (
              <div className="mt-1">
                {director && (
                  <span className="text-xs text-green-300 block">Director: {director}</span>
                )}
                {year && <span className="text-xs text-green-300 block">Year: {year}</span>}
                {castString && (
                  <span className="text-xs text-green-300 block">Cast: {castString}</span>
                )}
                {genresString !== "" && (
                  <span className="text-xs text-green-300 block">Genres: {genresString}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-300 line-clamp-1">{getSubtitle()}</p>
            )}
          </div>
        </div>

        {!isAiGenerated && item.description && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-300 line-clamp-2">{item.description}</p>
          </div>
        )}

        <div className="mt-auto px-4 pb-4 pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            {isAiGenerated ? "AI Generated" : type === "music" ? "Listen" : "Watch"}
          </span>
          <div className="flex items-center">
            <span className="text-xs text-gray-400 mr-2">Swipe to like/dislike</span>
            <button
              className={`p-1.5 rounded-full bg-gradient-to-r ${accentColor} text-white shadow-md`}
            >
              <svg
                className="w-3 h-3"
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
        </div>
      </div>
    </Card>
  );
}
