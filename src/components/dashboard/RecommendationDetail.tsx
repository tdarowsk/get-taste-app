import { Button } from "../ui/button";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { extractPosterUrl, isValidImageUrl } from "../../lib/utils/poster-utils";
import { MoviePoster } from "../MoviePoster";
import { useEffect, useState } from "react";

interface RecommendationDetailProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  onClose: () => void;
}

export function RecommendationDetail({ item, type, onClose }: RecommendationDetailProps) {
  const [fetchedDirector, setFetchedDirector] = useState<string | null>(null);

  // Debug logging
  console.log("RecommendationDetail - item:", item);
  console.log("item.metadata:", item.metadata);
  console.log("item.metadata.details:", item.metadata?.details);
  console.log("===== DIRECTOR DEBUG IN DETAIL VIEW =====");
  console.log(
    "Director from item:",
    Object.hasOwn(item, "director") ? (item as unknown as { director: string }).director : undefined
  );
  // Używam metadata jako alternatywę dla details
  console.log("Metadata object:", item.metadata);
  console.log("Metadata type:", typeof item.metadata);
  // Sprawdzam, czy director jest dostępny w metadata
  if (item.metadata && typeof item.metadata === "object") {
    console.log("Metadata keys:", Object.keys(item.metadata));
    console.log(
      "Director in metadata:",
      Object.hasOwn(item.metadata, "director") ? item.metadata.director : undefined
    );
  }
  console.log("===== END DIRECTOR DEBUG =====");

  // Extract director directly from metadata.details if available
  let directFromDetails = null;
  if (
    item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "director" in item.metadata.details
  ) {
    directFromDetails = String(item.metadata.details.director);
    console.log("Direct director access:", directFromDetails);
  }

  // Extract genre safely
  const genre = (item.metadata?.genre as string) || (type === "music" ? "Music" : "Film");

  // Check if item is from TMDB based on the metadata
  const isFromTMDB = !!(
    item.id &&
    (String(item.id).includes("tmdb-") || String(item.id).startsWith("movie_"))
  );

  // Helper to extract the numeric TMDB ID from any ID format
  const extractTmdbId = (id: string): string | null => {
    console.log("Detail View: Extracting TMDB ID from:", id);

    // If ID starts with "tmdb-", extract the number after it
    if (id.startsWith("tmdb-")) {
      // Look for a pattern like "tmdb-12345-timestamp-random"
      // First try: Match only the numeric part immediately after tmdb-
      const match = id.match(/^tmdb-(\d+)/);
      if (match && match[1]) {
        console.log("Detail View: Extracted TMDB ID using first pattern:", match[1]);
        return match[1];
      }

      // Second try: Look for a number embedded in the ID
      const secondMatch = id.match(/tmdb-.*?(\d+)/);
      if (secondMatch && secondMatch[1]) {
        console.log("Detail View: Extracted TMDB ID using second pattern:", secondMatch[1]);
        return secondMatch[1];
      }
    }

    // If ID starts with "movie_", extract the number after it
    if (id.startsWith("movie_")) {
      return id.substring(6);
    }

    // Check if it's a plain numeric ID
    if (/^\d+$/.test(id)) {
      return id;
    }

    console.log("Detail View: No TMDB ID could be extracted from:", id);
    return null;
  };

  // Fetch movie details from TMDB API for this specific movie
  useEffect(() => {
    const fetchMovieDetails = async () => {
      // If director is already available in details, don't fetch
      if (
        item.metadata &&
        item.metadata.details &&
        typeof item.metadata.details === "object" &&
        "director" in (item.metadata.details as Record<string, unknown>) &&
        typeof (item.metadata.details as Record<string, unknown>).director === "string" &&
        (item.metadata.details as Record<string, unknown>).director !== "Unknown Director"
      ) {
        console.log(
          `Director already available in details: ${(item.metadata.details as Record<string, unknown>).director}`
        );
        setFetchedDirector(String((item.metadata.details as Record<string, unknown>).director));
        return;
      }

      if (!isFromTMDB || !item.id || type !== "film") return;

      const tmdbId = extractTmdbId(item.id);
      if (!tmdbId) return;

      try {
        console.log(`Fetching TMDB details for movie ID: ${tmdbId}`);
        const response = await fetch(`/api/tmdb/movie/${tmdbId}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched TMDB movie details:", data);

          // Extract director from crew if available
          if (data.credits && Array.isArray(data.credits.crew)) {
            const directors = data.credits.crew.filter(
              (person: { job: string; name?: string }) => person.job === "Director"
            );
            if (directors.length > 0) {
              setFetchedDirector(directors[0].name);
            }
          }
        } else {
          console.error(`Failed to fetch TMDB details: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching TMDB details:", error);
      }
    };

    fetchMovieDetails();
  }, [item.id, isFromTMDB, type, item.metadata]);

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

      // Specjalne sprawdzenie dla TMDB - ekipa filmowa (crew)
      if (
        item.metadata.credits &&
        typeof item.metadata.credits === "object" &&
        Array.isArray((item.metadata.credits as Record<string, unknown>).crew)
      ) {
        const crew = (item.metadata.credits as Record<string, unknown>).crew as Record<
          string,
          unknown
        >[];
        const directors = crew.filter((person) => person.job === "Director");
        if (directors && directors.length > 0 && directors[0].name) {
          return String(directors[0].name);
        }
      }

      // Sprawdź w details.credits
      if (
        item.metadata.details &&
        typeof item.metadata.details === "object" &&
        (item.metadata.details as Record<string, unknown>).credits &&
        typeof (item.metadata.details as Record<string, unknown>).credits === "object" &&
        Array.isArray(
          ((item.metadata.details as Record<string, unknown>).credits as Record<string, unknown>)
            .crew
        )
      ) {
        const crew = (
          (item.metadata.details as Record<string, unknown>).credits as Record<string, unknown>
        ).crew as Record<string, unknown>[];
        const directors = crew.filter((person) => person.job === "Director");
        if (directors && directors.length > 0 && directors[0].name) {
          return String(directors[0].name);
        }
      }
    }

    return null;
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");

  // Improved helper function to extract director information from multiple sources
  const extractDirector = () => {
    // Directly extracted director has highest priority
    if (
      directFromDetails &&
      directFromDetails !== "Unknown Director" &&
      directFromDetails !== "null"
    ) {
      return directFromDetails;
    }

    // Use fetchedDirector if available
    if (fetchedDirector) {
      return fetchedDirector;
    }

    // Try the getMetadataValue helper
    const metadataDirector = getMetadataValue("director");
    if (metadataDirector && metadataDirector !== "Unknown Director") {
      return metadataDirector;
    }

    // Final fallback
    return isFromTMDB ? "Loading director..." : "Unknown Director";
  };

  // Use fetched director if available, otherwise fall back to metadata
  const director = extractDirector();
  console.log("Final selected director for detail view:", director);

  const year =
    getMetadataValue("year") ||
    (item.metadata &&
    "release_date" in item.metadata &&
    typeof item.metadata.release_date === "string" &&
    item.metadata.release_date.length >= 4
      ? String(item.metadata.release_date).substring(0, 4)
      : null);

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
    (item.metadata && "poster_path" in item.metadata
      ? `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}`
      : null) ||
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
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "poster_path" in (item.metadata.details as Record<string, unknown>)
      ? `https://image.tmdb.org/t/p/w500${(item.metadata.details as Record<string, unknown>).poster_path}`
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

              {type === "film" && (
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
