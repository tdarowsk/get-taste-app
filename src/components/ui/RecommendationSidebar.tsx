import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { RecommendationItem } from "../../types";
import { FeedbackType } from "../../types";
import { UniqueRecommendationsService } from "../../lib/services/uniqueRecommendations.service";
import { MoviePoster } from "../MoviePoster";

// The time period for which items should not be shown after feedback (24 hours)
const RECOMMENDATION_COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to fetch movie details from our backend API
const fetchMovieDetailsFromBackend = async (movieId: string) => {
  // Fetch movie details from our backend API endpoint
  const response = await fetch(`/api/tmdb/movie/${movieId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch movie details: ${response.statusText}`);
  }

  return await response.json();
};

interface FeedbackHistoryItem {
  id: string;
  timestamp: number;
  feedbackType: FeedbackType;
}

interface MovieDetails {
  genres?: { id: number; name: string }[];
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  director?: string;
  overview?: string;
  cast?: string[];
}

interface ItemCardProps {
  item: RecommendationItem;
  onSwipe: (id: string, direction: FeedbackType) => void;
  isActive: boolean;
}

interface RecommendationSidebarProps {
  userId: string;
  className?: string;
  isNewUser?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSwipe, isActive }) => {
  // console.log("item", item);
  console.log("isActive", isActive);
  const [direction, setDirection] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Reset the drag state when new card becomes active
  useEffect(() => {
    if (isActive) {
      setDirection(0);
      setSwiped(false);
      setDragOffset(0);
    }
  }, [isActive, item.id]);

  // Najpierw definiujemy isFromTMDB, aby móc go użyć w isAiGenerated
  const isFromTMDB = useMemo(() => {
    console.log("Checking isFromTMDB for item:", item.id, item.name);
    const result = !!(
      item.id &&
      (String(item.id).includes("tmdb-") ||
        (typeof item.explanation === "string" && item.explanation.toLowerCase().includes("tmdb")))
    );
    console.log("isFromTMDB result:", result);
    return result;
  }, [item]);

  // Teraz definiujemy isAiGenerated, z dostępem do isFromTMDB
  const isAiGenerated = useMemo(() => {
    console.log("Checking isAiGenerated for item:", item.id, item.name);
    console.log("Full item data for AI check:", item);

    // Check for explicit AI flag in the item (added by API)
    const hasAiFlag =
      Object.hasOwn(item, "ai_generated") &&
      (item as unknown as { ai_generated: boolean }).ai_generated === true;

    // Check for AI source in details
    const hasAiSource =
      item.details &&
      typeof item.details === "object" &&
      "source" in item.details &&
      item.details.source === "AI";

    // Najpierw sprawdzamy czy item ma director, genres lub cast w details
    const hasDetailFields = !!(
      item.details &&
      typeof item.details === "object" &&
      ("director" in item.details || "genres" in item.details || "cast" in item.details)
    );

    console.log("hasDetailFields:", hasDetailFields);
    console.log("hasAiFlag:", hasAiFlag);
    console.log("hasAiSource:", hasAiSource);

    // Musi też spełnić przynajmniej jeden warunek identyfikujący AI
    const hasAiIdentifiers = !!(
      // Check explicit API flags
      (
        hasAiFlag ||
        hasAiSource ||
        // Check item ID patterns that suggest AI generation
        (item.type === "film" &&
          item.id &&
          (String(item.id).startsWith("ai_") ||
            String(item.id).includes("1234") ||
            String(item.id).match(/^\d{10,}$/))) ||
        // Sprawdź, czy to jest oznaczone jako rekomendacja AI (nie z TMDB)
        (typeof item.explanation === "string" &&
          (item.explanation.toLowerCase().includes("ai") ||
            !item.explanation.toLowerCase().includes("tmdb")))
      )
    );

    console.log("hasAiIdentifiers:", hasAiIdentifiers);
    console.log("Is not from TMDB:", !isFromTMDB);
    console.log("Final isAiGenerated check:", (hasDetailFields || hasAiIdentifiers) && !isFromTMDB);

    // Less restrictive check: either has AI details OR has AI identifiers, but never from TMDB
    return (hasAiFlag || hasAiSource || (hasDetailFields && hasAiIdentifiers)) && !isFromTMDB;
  }, [item, isFromTMDB]);

  // Konwersja detali na wspólny format
  const extractDetails = useMemo(() => {
    console.log("Extracting details from item:", item);

    if (!item.details) return null;

    const details = item.details;

    // Wyodrębnij informacje o filmie w jednolity sposób
    const extractedDetails: MovieDetails = {
      genres: Array.isArray(details.genres)
        ? details.genres.map((g) => ({ id: 0, name: String(g) }))
        : [],
      release_date: details.year ? String(details.year) : undefined,
      // Ensure we capture director correctly - try from both locations
      director: details.director
        ? String(details.director)
        : Object.hasOwn(item, "director")
          ? String((item as unknown as { director: string }).director)
          : undefined,
      cast: Array.isArray(details.cast) ? details.cast.map((c) => String(c)) : [],
      overview: details.description ? String(details.description) : undefined,
    };

    console.log("Extracted details:", extractedDetails);
    console.log("Director from extracted details:", extractedDetails.director);
    return extractedDetails;
  }, [item]);

  // Fetch movie details from our backend API when card becomes active and is a film
  useEffect(() => {
    if (isActive && item.type === "film" && !isAiGenerated) {
      fetchMovieDetails(item.id.replace(/^tmdb-/, ""));
    } else if (isActive && isAiGenerated) {
      // For AI-generated content, we already have details
      const aiDetails = extractDetails;
      console.log("Using AI-generated details:", aiDetails);
      if (aiDetails) {
        setMovieDetails(aiDetails);
      }
    }
  }, [isActive, item.id, item.type, isAiGenerated, extractDetails]);

  // Function to fetch movie details from our backend API
  const fetchMovieDetails = async (itemId: string) => {
    try {
      setLoading(true);
      // Extract the actual movie ID from our composite ID format
      const movieId = itemId.split("-")[0];

      // For movie_id format, we need to extract just the number
      const cleanMovieId = movieId.startsWith("movie_") ? movieId.substring(6) : movieId;

      // Use our backend API to get movie details
      const data = await fetchMovieDetailsFromBackend(cleanMovieId);

      console.log(data);

      setMovieDetails({
        genres: data.genres,
        release_date: data.release_date,
        runtime: data.runtime,
        vote_average: data.vote_average,
        overview: data.overview,
        cast: data.cast,
      });
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle swipe with movie details
  const handleSwipeWithDetails = (direction: FeedbackType) => {
    // Extract genre names to a string for feedback - format as comma-separated string without spaces
    const genreString = movieDetails?.genres?.map((g) => g.name).join(",") || null;

    // Extract cast names to a string for feedback - take top 5 actors
    const castString = movieDetails?.cast?.slice(0, 5).join(",") || null;

    // Store movie details in item.details for feedback
    if (item.type === "film" && movieDetails) {
      if (!item.details) item.details = {};
      if (genreString) item.details.genre = genreString;
      if (castString) item.details.cast = castString;
    }

    // Call parent onSwipe with extra metadata
    onSwipe(item.id, direction);
  };

  // Check if this item has been rated before
  const hasBeenRatedBefore = () => {
    try {
      const storedHistory = localStorage.getItem(`item-feedback-history`);
      if (storedHistory) {
        const history = JSON.parse(storedHistory) as FeedbackHistoryItem[];
        // Find the most recent feedback for this item (if it exists)
        const previousFeedback = history
          .filter((historyItem: FeedbackHistoryItem) => historyItem.id === item.id)
          .sort((a: FeedbackHistoryItem, b: FeedbackHistoryItem) => b.timestamp - a.timestamp)[0];

        return previousFeedback
          ? { exists: true, type: previousFeedback.feedbackType }
          : { exists: false };
      }
    } catch (error) {
      console.error("Error checking feedback history:", error);
    }
    return { exists: false };
  };

  const previousRating = hasBeenRatedBefore();

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Debugging director data in ItemCard
  useEffect(() => {
    if (isActive) {
      console.log("=== DIRECTOR DEBUG IN ITEM CARD ===");
      console.log("Item ID:", item.id);
      console.log("Item Name:", item.name);
      console.log("Item details:", item.details);

      const directorFromDetails =
        item.details && typeof item.details === "object" && "director" in item.details
          ? item.details.director
          : null;

      console.log("Director from item.details.director:", directorFromDetails);
      // Bezpieczny dostęp do właściwości director
      console.log(
        "Director from item root:",
        Object.hasOwn(item, "director")
          ? (item as unknown as { director: string }).director
          : undefined
      );
      console.log("Director from movieDetails:", movieDetails?.director);
      console.log("=== END DIRECTOR DEBUG ===");
    }
  }, [isActive, movieDetails, item]);

  // Check the director value in the render logic
  const directorToDisplay =
    movieDetails?.director ||
    (item.details && typeof item.details === "object" && "director" in item.details
      ? String(item.details.director)
      : Object.hasOwn(item, "director")
        ? String((item as unknown as { director: string }).director)
        : undefined) ||
    "Unknown Director";

  console.log("Director value to display:", directorToDisplay);

  return (
    <motion.div
      className={`absolute top-0 left-0 w-full ${!isActive || swiped ? "hidden" : ""}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDrag={(_, info) => {
        // Update drag offset to show real-time indicators
        setDragOffset(info.offset.x);
      }}
      onDragEnd={(e, info) => {
        const dragX = info.offset.x;
        const threshold = 80; // Lower threshold for easier swiping

        // Check for quick flick gestures
        const isQuickFlick = Math.abs(info.velocity.x) > 500;

        if (dragX > threshold || (isQuickFlick && dragX > 20)) {
          // Enhanced like animation
          setDirection(1);
          setSwiped(true);

          // Use a smoother approach with CSS transitions
          const card = document.getElementById(`card-${item.id}`);
          if (card) {
            card.style.transition = "transform 0.4s ease-out, opacity 0.4s ease-out";
            card.style.transform = `translateX(${window.innerWidth}px) rotate(40deg)`;
            card.style.opacity = "0";

            setTimeout(() => {
              handleSwipeWithDetails(FeedbackType.LIKE);
            }, 300);
          } else {
            // Fallback if the DOM method doesn't work
            setTimeout(() => {
              handleSwipeWithDetails(FeedbackType.LIKE);
            }, 50);
          }
        } else if (dragX < -threshold || (isQuickFlick && dragX < -20)) {
          // Enhanced dislike animation
          setDirection(-1);
          setSwiped(true);

          // Use a smoother approach with CSS transitions
          const card = document.getElementById(`card-${item.id}`);
          if (card) {
            card.style.transition = "transform 0.4s ease-out, opacity 0.4s ease-out";
            card.style.transform = `translateX(-${window.innerWidth}px) rotate(-40deg)`;
            card.style.opacity = "0";

            setTimeout(() => {
              handleSwipeWithDetails(FeedbackType.DISLIKE);
            }, 300);
          } else {
            // Fallback if the DOM method doesn't work
            setTimeout(() => {
              handleSwipeWithDetails(FeedbackType.DISLIKE);
            }, 50);
          }
        } else {
          // Return to center with smooth transition
          const card = document.getElementById(`card-${item.id}`);
          if (card) {
            card.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            card.style.transform = "translateX(0) rotate(0)";
          }
        }
      }}
      animate={{
        x: direction === 0 ? 0 : direction > 0 ? window.innerWidth : -window.innerWidth,
        opacity: direction === 0 ? 1 : 0,
        rotate: direction === 0 ? 0 : direction > 0 ? 30 : -30,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      }}
      style={{ cursor: "grab" }}
      whileTap={{ cursor: "grabbing", scale: 0.98 }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        className="p-4 bg-white rounded-lg shadow-md border border-gray-200 relative"
        id={`card-${item.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          // Add real-time visual feedback during dragging
          background:
            dragOffset > 50
              ? "linear-gradient(90deg, white, rgba(34, 197, 94, 0.1))"
              : dragOffset < -50
                ? "linear-gradient(90deg, rgba(239, 68, 68, 0.1), white)"
                : "white",
          transition: "background 0.3s ease",
        }}
      >
        {/* Show like/dislike indicators during swipe */}
        {dragOffset > 50 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">
            LIKE
          </div>
        )}
        {dragOffset < -50 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">
            NOPE
          </div>
        )}

        {previousRating.exists && (
          <div
            className={`absolute top-0 right-0 px-2 py-1 text-xs text-white rounded-bl-lg ${
              previousRating.type === FeedbackType.LIKE ? "bg-green-500" : "bg-red-500"
            }`}
          >
            Previously {previousRating.type === FeedbackType.LIKE ? "Liked" : "Disliked"}
          </div>
        )}

        {/* AI Badge - pokazuj tylko dla rekomendacji AI, nie dla TMDB */}
        {isAiGenerated && (
          <div className="absolute top-0 left-0 px-2 py-1 text-xs text-white rounded-br-lg bg-green-500">
            AI
          </div>
        )}

        {/* TMDB Badge - pokazujemy dla filmów z TMDB */}
        {isFromTMDB && (
          <div className="absolute top-0 left-0 px-2 py-1 text-xs text-white rounded-br-lg bg-blue-500">
            TMDB
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold" style={{ color: "black" }}>
            {item.name}
          </h3>
          <div className="flex items-center">
            {item.type === "film" &&
              (movieDetails?.overview || (item.details && "description" in item.details)) && (
                <button
                  className="mr-2 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 cursor-help"
                  title="Show movie details"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHovered(!isHovered);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsHovered(!isHovered);
                    }
                  }}
                  aria-label="Show movie details"
                >
                  Info
                </button>
              )}
            <span className="text-xs text-gray-500 capitalize">{item.type}</span>
          </div>
        </div>

        {/* Upewniamy się, że karta ma relative positioning */}
        <div className="relative">
          <div className="flex items-start gap-4">
            {/* Display image */}
            <div
              className={`${
                ["album", "song"].includes(item.type)
                  ? "w-24 h-24"
                  : "w-32 h-48 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-md flex items-center justify-center"
              } flex-shrink-0`}
            >
              <MoviePoster title={item.name} size="grid" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Display artist directly for songs/albums */}
              {typeof item.details?.artist === "string" && (
                <p className="text-sm text-gray-700 italic">by {item.details.artist}</p>
              )}
              {/* Display movie details if available */}
              {item.type === "film" && (
                <div className="mt-2">
                  {/* Display Director - zawsze pokazujemy, gdy mamy jakiekolwiek informacje o reżyserze */}
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Director:</span>{" "}
                    {directorToDisplay !== "Unknown Director" ? directorToDisplay : "Loading..."}
                  </p>

                  {/* Display Year/Release */}
                  {(movieDetails?.release_date ||
                    (item.details &&
                      typeof item.details === "object" &&
                      "year" in item.details)) && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Release:</span>{" "}
                      {movieDetails?.release_date
                        ? new Date(movieDetails.release_date).getFullYear()
                        : item.details && typeof item.details === "object" && "year" in item.details
                          ? String(item.details.year)
                          : ""}
                    </p>
                  )}

                  {/* Display Genres */}
                  {((movieDetails?.genres && movieDetails.genres.length > 0) ||
                    (item.details &&
                      typeof item.details === "object" &&
                      "genres" in item.details &&
                      Array.isArray(item.details.genres))) && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Genre:</span>{" "}
                      {movieDetails?.genres
                        ? movieDetails.genres.map((g) => g.name).join(", ")
                        : item.details &&
                            typeof item.details === "object" &&
                            "genres" in item.details &&
                            Array.isArray(item.details.genres)
                          ? (item.details.genres as string[]).join(", ")
                          : ""}
                    </p>
                  )}

                  {/* Display Runtime */}
                  {movieDetails?.runtime && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Runtime:</span> {movieDetails.runtime} min
                    </p>
                  )}

                  {loading && <p className="text-xs text-gray-500 italic">Loading details...</p>}
                </div>
              )}
              {/* Display additional details for AI-generated content */}
              {isAiGenerated && item.details && (
                <div className="mt-2 text-xs text-green-700 grid grid-cols-2 gap-1">
                  {Object.entries(item.details)
                    .filter(
                      ([key]) =>
                        !key.includes("imageUrl") &&
                        !key.includes("img") &&
                        !key.includes("spotifyId") &&
                        !["artist", "director", "genres", "cast", "year", "description"].includes(
                          key
                        )
                    )
                    .map(([key, value]) => {
                      // Convert value to a string safely
                      let displayValue: string;
                      if (value === null || value === undefined) {
                        displayValue = "";
                      } else if (typeof value === "object") {
                        displayValue = JSON.stringify(value);
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <div key={key} className="truncate">
                          <span className="font-semibold capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:{" "}
                          </span>
                          <span>{displayValue}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Movie overview tooltip */}
          {isHovered &&
            item.type === "film" &&
            (movieDetails?.overview || (item.details && "description" in item.details)) && (
              <div
                className="fixed inset-x-0 bottom-0 p-4 bg-black bg-opacity-95 text-white text-sm rounded-t-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="movie-details-title"
              >
                <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-2">
                  <div className="font-bold text-lg" id="movie-details-title">
                    {item.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHovered(false);
                    }}
                    className="text-gray-400 hover:text-white"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm leading-relaxed my-3">
                  {movieDetails?.overview ||
                    (item.details && "description" in item.details
                      ? String(item.details.description)
                      : "")}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {movieDetails?.vote_average && (
                    <div className="flex items-center">
                      <span className="font-semibold">Rating:</span>
                      <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-black font-bold rounded">
                        {movieDetails.vote_average.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                  {movieDetails?.runtime && (
                    <div className="flex items-center">
                      <span className="font-semibold">Runtime:</span>
                      <span className="ml-1">{movieDetails.runtime} min</span>
                    </div>
                  )}
                </div>
                {movieDetails?.genres && movieDetails.genres.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold">Genres: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {movieDetails.genres.map((genre) => (
                        <span key={genre.id} className="px-2 py-0.5 bg-gray-700 rounded-full">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {movieDetails?.cast && movieDetails.cast.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold">Cast: </span>
                    <div className="mt-1">
                      {movieDetails.cast.slice(0, 5).join(", ")}
                      {movieDetails.cast.length > 5 && "..."}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Swipe right to like, left to dislike</p>
        </div>
      </div>
    </motion.div>
  );
};

const RecommendationSidebar: React.FC<RecommendationSidebarProps> = ({
  userId,
  className,
  isNewUser = false,
}) => {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSeenAllItems, setHasSeenAllItems] = useState(false);
  const [activeTab] = useState<"film" | "music">("film");

  // DEBUG: Add a detailed logging for recommendation item format
  const debugLogRecommendations = (items: RecommendationItem[]) => {
    console.log("======================= DEBUG RECOMMENDATION DATA =======================");
    console.log(`Total items: ${items.length}`);

    // Count AI vs TMDB items
    const aiItems = items.filter(
      (item) =>
        (Object.hasOwn(item, "ai_generated") &&
          (item as unknown as { ai_generated: boolean }).ai_generated === true) ||
        (item.details &&
          typeof item.details === "object" &&
          "source" in item.details &&
          item.details.source === "AI")
    );

    const tmdbItems = items.filter(
      (item) =>
        (item.id && String(item.id).includes("tmdb-")) ||
        (item.details &&
          typeof item.details === "object" &&
          "source" in item.details &&
          item.details.source === "TMDB")
    );

    console.log(
      `AI items: ${aiItems.length}, TMDB items: ${tmdbItems.length}, Unknown: ${items.length - aiItems.length - tmdbItems.length}`
    );

    // Log the first item in detail
    if (items.length > 0) {
      const firstItem = items[0];
      console.log("First item details:", {
        id: firstItem.id,
        name: firstItem.name,
        type: firstItem.type,
        hasDirector:
          firstItem.details &&
          typeof firstItem.details === "object" &&
          "director" in firstItem.details,
        director: firstItem.details?.director || "none",
        genres: firstItem.details?.genres || "none",
        explanation: firstItem.explanation || "none",
        aiGenerated: Object.hasOwn(firstItem, "ai_generated")
          ? (firstItem as unknown as { ai_generated: boolean }).ai_generated
          : "none",
        detailsSource:
          firstItem.details &&
          typeof firstItem.details === "object" &&
          "source" in firstItem.details
            ? firstItem.details.source
            : "none",
      });
    }
    console.log("======================= END DEBUG =======================");
    return items;
  };

  // Load initial feedback history from local storage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(`recommendation-feedback-${userId}`);
      if (storedHistory) {
        // Just load it - we don't need to store in state
        const history = JSON.parse(storedHistory);
        console.log(`Loaded ${history.length} feedback history items`);
      }
    } catch (error) {
      console.error("Error loading feedback history:", error);
    }
  }, [userId]);

  // Fetch TMDB movie recommendations
  const fetchTMDBRecommendations = useCallback(async () => {
    setLoading(true);

    try {
      console.log("[RecommendationSidebar] Fetching TMDB recommendations");

      // Call the API endpoint that uses RecommendationService.getTMDBRecommendations
      const response = await fetch(`/api/tmdb/recommendations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `[RecommendationSidebar] TMDB API Error: ${response.status} - ${response.statusText}`
        );
        throw new Error(`Failed to fetch TMDB recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[RecommendationSidebar] TMDB response:`, data);

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Convert TMDB items to the expected RecommendationItem format
        const convertedItems: RecommendationItem[] = data.items.map(
          (item: Record<string, unknown>) => {
            console.log("Raw TMDB item:", item);

            // Safely access the details object
            const itemDetails =
              typeof item.details === "object" && item.details
                ? (item.details as Record<string, unknown>)
                : {};

            // Log the details we're working with
            console.log("Processing TMDB item details:", itemDetails);
            console.log("Director in TMDB item details:", itemDetails.director);

            // Properly extract TMDB ID - sprawdź wszystkie możliwe miejsca gdzie może się znajdować
            const tmdbId =
              typeof item.id === "string" || typeof item.id === "number"
                ? item.id
                : typeof itemDetails.id === "string" || typeof itemDetails.id === "number"
                  ? itemDetails.id
                  : null;

            // Generate unique ID using TMDB ID lub fallback do timestampu jeśli brak ID
            const uniqueId = tmdbId
              ? tmdbId
              : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Zapewniamy, że mamy poprawną wartość reżysera
            const directorValue =
              typeof itemDetails.director === "string" && itemDetails.director
                ? itemDetails.director
                : typeof item.director === "string" && item.director
                  ? item.director
                  : "Unknown Director";

            console.log("Using director value:", directorValue);

            // Ensure we properly preserve all movie details
            const details = {
              // First spread any existing details
              ...itemDetails,

              // Then add/override with the direct properties from details
              // This ensures we're using the correct fields from the right location
              genres: Array.isArray(itemDetails.genres) ? itemDetails.genres : [],
              director: directorValue,
              cast: Array.isArray(itemDetails.cast) ? itemDetails.cast : [],
              year:
                typeof itemDetails.year === "string"
                  ? itemDetails.year
                  : new Date().getFullYear().toString(),

              // If there's a poster_path, make sure it's preserved
              ...(itemDetails.poster_path ? { poster_path: itemDetails.poster_path } : {}),

              // Store original TMDB ID as well for future reference
              tmdbId: tmdbId,

              // Clearly mark the data source
              source: "TMDB",
            };

            console.log("Final constructed details:", details);

            const result = {
              id: uniqueId,
              name: String(item.name || item.title || "Unknown Movie"),
              type: "film",
              details: details,
              // Copy director to the root level too for maximum compatibility
              director: details.director,
              // Same for other important properties
              genres: details.genres,
              // Clearly indicate this is from TMDB, not AI
              explanation: "TMDB trending movie recommendation",
              confidence: typeof item.confidence === "number" ? item.confidence : 0.8,
            };

            console.log("Converted TMDB item:", result);
            return result;
          }
        );

        console.log(convertedItems);

        console.log(`[RecommendationSidebar] Converted ${convertedItems.length} TMDB items`);

        if (convertedItems.length > 0) {
          setItems(convertedItems);
          setCurrentIndex(0);
          setHasSeenAllItems(false);
          return;
        }
      }

      // Jeśli dotarliśmy tutaj, API TMDB nie zwróciło prawidłowych danych
      // Ustawiamy pusty stan i pokazujemy komunikat o błędzie
      // console.warn("[RecommendationSidebar] No valid data from TMDB API");
      setItems([]);
      setError("No recommendations available from TMDB. Please try again later.");
    } catch (err) {
      console.error("[RecommendationSidebar] TMDB Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch TMDB recommendations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch recommendations from API
  const fetchRecommendations = useCallback(
    async (type: "film" | "music") => {
      if (!userId) return;

      setLoading(true);
      setError(null);
      console.log(`[RecommendationSidebar] Fetching ${type} recommendations for user ${userId}`);

      try {
        // Make API request to get recommendations
        const response = await fetch("/api/recommendations/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            type,
            force_refresh: true, // Always force refresh to get new data
            is_new_user: isNewUser, // Pass the isNewUser flag to the API
          }),
        });

        if (!response.ok) {
          console.error(
            `[RecommendationSidebar] API Error: ${response.status} - ${response.statusText}`
          );
          // If we can't get regular recommendations, try TMDB as a fallback
          if (type === "film") {
            console.log("[RecommendationSidebar] Falling back to TMDB recommendations");
            await fetchTMDBRecommendations();
            return;
          }
          throw new Error("Error fetching recommendations");
        }

        try {
          const data = await response.json();
          console.log(`[RecommendationSidebar] Received response: ${JSON.stringify(data)}`);

          // Validation & filtering
          if (!data || !data.data || !data.data.items) {
            console.warn("[RecommendationSidebar] Invalid response format - missing data.items");

            // If we have no items from the API for film type, try TMDB as fallback
            if (type === "film") {
              console.log("[RecommendationSidebar] No items received, trying TMDB recommendations");
              await fetchTMDBRecommendations();
              return;
            }
            throw new Error("No recommendations available");
          }

          // Make sure items is an array
          if (!Array.isArray(data.data.items)) {
            console.warn("[RecommendationSidebar] data.items is not an array");

            // If items isn't an array for film type, try TMDB as fallback
            if (type === "film") {
              console.log(
                "[RecommendationSidebar] Invalid items format, trying TMDB recommendations"
              );
              await fetchTMDBRecommendations();
              return;
            }
            throw new Error("Invalid recommendations format");
          }

          // Check if we have any items before filtering
          if (data.data.items.length === 0) {
            console.warn("[RecommendationSidebar] Empty items array received");

            // If we have an empty array for film type, try TMDB as fallback
            if (type === "film") {
              console.log("[RecommendationSidebar] No items received, trying TMDB recommendations");
              await fetchTMDBRecommendations();
              return;
            }
            throw new Error("No recommendations available");
          }

          console.log(
            `[RecommendationSidebar] Received ${data.data.items.length} items before filtering`
          );

          // Filter out items the user has already seen based on local history
          // But don't filter if it would result in zero items
          let filteredItems = UniqueRecommendationsService.filterLocalRecommendations(
            userId,
            data.data.items,
            RECOMMENDATION_COOLDOWN_PERIOD
          );

          // If all items were filtered out, use the original items
          if (filteredItems.length === 0 && data.data.items.length > 0) {
            console.warn("[RecommendationSidebar] All items filtered out, using original items");
            filteredItems = data.data.items;
            setHasSeenAllItems(true);
          } else {
            setHasSeenAllItems(false);
          }

          // Add unique ids to items if they don't have them
          const enhancedItems = filteredItems.map((item) => {
            const newItem = { ...item } as RecommendationItem;

            // Ensure ID is set
            if (!newItem.id) {
              newItem.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Add ai_generated flag if the parent response has it
            if (data.ai_generated === true) {
              (newItem as unknown as { ai_generated: boolean }).ai_generated = true;

              // Also set source in details for double confirmation
              if (newItem.details && typeof newItem.details === "object") {
                newItem.details.source = "AI";
              }
            }

            return newItem;
          });

          console.log(`[RecommendationSidebar] ${enhancedItems.length} recommendations loaded`);

          // Shuffle items for variety
          const shuffledItems = enhancedItems.sort(() => Math.random() - 0.5);
          // Debug items before setting them
          const debuggedItems = debugLogRecommendations(shuffledItems);
          setItems(debuggedItems);
          setCurrentIndex(0);
        } catch (parseError) {
          console.error("[RecommendationSidebar] Error parsing response:", parseError);
          // If JSON parsing fails for film type, try TMDB as fallback
          if (type === "film") {
            console.log("[RecommendationSidebar] JSON parsing error, trying TMDB recommendations");
            await fetchTMDBRecommendations();
            return;
          }
          throw new Error("Error processing recommendations");
        }
      } catch (err) {
        console.error("[RecommendationSidebar] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Load empty array to avoid showing old items
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [userId, isNewUser, fetchTMDBRecommendations]
  );

  // Funkcja do ponownego ładowania rekomendacji po kliknięciu przycisku Try again
  const handleTryAgain = useCallback(() => {
    // Toggle between regular recommendations and TMDB if we had an error
    if (error && activeTab === "film") {
      console.log(
        "[RecommendationSidebar] Try again clicked with error - trying TMDB recommendations"
      );
      fetchTMDBRecommendations();
    } else {
      console.log("[RecommendationSidebar] Try again clicked - fetching new recommendations");
      fetchRecommendations(activeTab);
    }
  }, [activeTab, error, fetchTMDBRecommendations, fetchRecommendations]);

  // Fetch recommendations when component mounts
  useEffect(() => {
    fetchRecommendations(activeTab);
  }, [userId, activeTab, fetchRecommendations]);

  // Clear feedback history
  const clearFeedbackHistory = useCallback(() => {
    UniqueRecommendationsService.clearHistory(userId);
    // Reset index to show all items
    setCurrentIndex(0);
    // Refresh recommendations
    fetchRecommendations(activeTab);
  }, [userId, activeTab, fetchRecommendations]);

  // Fetch more recommendations
  const fetchMoreRecommendations = useCallback(() => {
    console.log(`[RecommendationSidebar] Fetching more ${activeTab} recommendations`);
    fetchRecommendations(activeTab);
  }, [activeTab, fetchRecommendations]);

  // Handle swipe action for an item
  const handleSwipe = useCallback(
    async (itemId: string, feedbackType: FeedbackType) => {
      try {
        // Find the current item in the array before updating states
        const currentItem = items.find((item) => item.id === itemId);
        if (!currentItem) {
          return;
        }

        // Add to feedback history using the service (saves to localStorage)
        UniqueRecommendationsService.addToHistory(userId, itemId, feedbackType);

        // Add transition delay to improve animation flow between cards
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Now update the UI states AFTER the animation completes
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (items.length > 0) {
          // If we're at the end, show a message about seeing all items
          setCurrentIndex(items.length);
        }

        // Remove the item from the current list with a smooth fade out
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

        // Store feedback in the database
        try {
          // Try the primary endpoint first
          let savedSuccessfully = false;
          try {
            const primaryUrl = new URL(
              `/api/users/${userId}/item-feedback`,
              window.location.origin
            );

            // Znajdź item w oryginalnej tablicy allItems
            const genre = currentItem?.details?.genre || null;
            const artist = currentItem?.details?.artist || currentItem?.details?.director || null;
            const cast = currentItem?.details?.cast || null;

            // Create payload with basic fields first
            let body = JSON.stringify({
              item_id: itemId,
              feedback_type: feedbackType,
            });

            // Try with metadata if available
            try {
              if (genre || artist || cast) {
                body = JSON.stringify({
                  item_id: itemId,
                  feedback_type: feedbackType,
                  genre: genre,
                  artist: artist,
                  cast: cast,
                });
              }
            } catch (error) {
              console.error("Error creating payload with metadata:", error);
            }

            const primaryResponse = await fetch(primaryUrl.toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: body,
            });

            if (primaryResponse.ok) {
              savedSuccessfully = true;
            } else {
              // Log primary error for debugging
              console.error("Primary endpoint failed");
            }
          } catch (primaryError) {
            // Log primary error
            console.error("Error using primary endpoint:", primaryError);
          }

          // If primary endpoint failed, try fallback
          if (!savedSuccessfully) {
            try {
              const fallbackUrl = new URL(
                `/api/users/${userId}/recommendations/feedback`,
                window.location.origin
              );

              // Znajdź item w oryginalnej tablicy allItems
              const genre = currentItem?.details?.genre || null;
              const artist = currentItem?.details?.artist || currentItem?.details?.director || null;
              const cast = currentItem?.details?.cast || null;

              // Create payload with basic fields first
              let body = JSON.stringify({
                item_id: itemId,
                feedback_type: feedbackType,
              });

              // Try with metadata if available
              try {
                if (genre || artist || cast) {
                  body = JSON.stringify({
                    item_id: itemId,
                    feedback_type: feedbackType,
                    genre: genre,
                    artist: artist,
                    cast: cast,
                  });
                }
              } catch (error) {
                console.error("Error creating fallback payload:", error);
              }

              const fallbackResponse = await fetch(fallbackUrl.toString(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: body,
              });

              if (fallbackResponse.ok) {
                savedSuccessfully = true;
              } else {
                console.error("Fallback feedback API error:", await fallbackResponse.text());
              }
            } catch (fallbackError) {
              console.error("Error using fallback endpoint:", fallbackError);
            }
          }

          // If both endpoints failed but we have localStorage, that's okay
          if (!savedSuccessfully) {
            console.warn("Failed to save feedback to server, but saved locally");
          }
        } catch (apiError) {
          console.error("Error submitting feedback:", apiError);
          // Silent fail - feedback is still stored locally
        }
      } catch (error) {
        console.error("Error handling swipe:", error);
      }
    },
    [currentIndex, items, userId]
  );

  return (
    <div className={`recommendations-sidebar h-full flex flex-col ${className || ""}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Recommendations</h2>
        <button
          onClick={clearFeedbackHistory}
          className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          title="Clear your feedback history to see all recommendations again"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-6">
        {loading ? (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading recommendations...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={handleTryAgain}
              >
                Try again
              </button>
              {activeTab === "film" && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={fetchTMDBRecommendations}
                >
                  Show TMDB Movies Instead
                </button>
              )}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">No recommendations available right now.</p>
            <div className="flex flex-col gap-2">
              {hasSeenAllItems && (
                <button
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  onClick={fetchMoreRecommendations}
                >
                  Get More Recommendations
                </button>
              )}
              {activeTab === "film" && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={fetchTMDBRecommendations}
                >
                  Show TMDB Popular Movies
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleTryAgain}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : currentIndex >= items.length ? (
          <div className="text-center">
            <p className="text-gray-600">You&apos;ve seen all recommendations for now.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={clearFeedbackHistory}
              >
                Clear History to See More
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={fetchTMDBRecommendations}
              >
                Show Popular TMDB Movies
              </button>
            </div>
          </div>
        ) : (
          // Cards are stacked, with the current one visible
          <div className="relative w-full max-w-md h-96">
            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                onSwipe={handleSwipe}
                isActive={index === currentIndex}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationSidebar;
