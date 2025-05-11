import { Button } from "../ui/button";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { extractPosterUrl, isValidImageUrl } from "../../lib/utils/poster-utils";
import { MoviePoster } from "../MoviePoster";

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
    if (!item.metadata) return null;

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
    }

    return null;
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");
  const director = getMetadataValue("director");
  const year = getMetadataValue("year");

  // Use different placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Get the image URL with better poster handling
  const rawImageUrl =
    extractPosterUrl(item.metadata || {}, type) ||
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

  // Validate the image URL
  const imageUrl = isValidImageUrl(rawImageUrl as string) ? rawImageUrl : placeholderImage;

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-black/80 backdrop-blur-md flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-gray-900/90 rounded-lg shadow-2xl border border-white/10 max-w-3xl w-full mx-4 p-6 animate-fadeIn"
        role="document"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          aria-label="Close dialog"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="flex items-start gap-4">
            {/* Display image */}
            <div
              className={`${["album", "song"].includes(item.type) ? "w-24 h-24" : "w-32 h-32"} flex-shrink-0`}
            >
              {type === "film" ? (
                <MoviePoster title={item.name} size="md" />
              ) : (
                <img
                  src={imageUrl}
                  alt={`${item.name} cover`}
                  className="w-full h-full object-cover rounded shadow-sm"
                  onError={(e) => {
                    // Fallback to a default image if loading fails
                    e.currentTarget.src = "https://placehold.co/200x200/ddd/333?text=No+Image";
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    type === "music" ? "bg-blue-600" : "bg-purple-600"
                  } text-white`}
                >
                  {type === "music" ? "Music" : "Film"}
                </span>
                <span className="text-sm text-gray-400">{genre}</span>
                {year && <span className="text-sm text-gray-400">({year})</span>}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{item.name}</h2>

              {type === "music" && artist && (
                <p className="text-gray-300 mb-4">
                  Artist: <span className="text-white">{artist}</span>
                </p>
              )}

              {type === "film" && director && (
                <p className="text-gray-300 mb-4">
                  Director: <span className="text-white">{director}</span>
                </p>
              )}

              {item.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-200 text-sm leading-relaxed">{item.description}</p>
                </div>
              )}

              <Button
                className={`px-6 py-5 rounded-lg bg-gradient-to-r shadow-lg ${
                  type === "music"
                    ? "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    : "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                } text-white font-medium`}
              >
                {type === "music" ? "Listen now" : "Watch now"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
