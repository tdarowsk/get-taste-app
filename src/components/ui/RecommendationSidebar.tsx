import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { RecommendationDTO, RecommendationItem } from "../../types";
import { FeedbackType } from "../../types";
import { UniqueRecommendationsService } from "../../lib/services/uniqueRecommendations.service";
import { MoviePoster } from "../MoviePoster";

// The time period for which items should not be shown after feedback (24 hours)
const RECOMMENDATION_COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to fetch movie details from our backend API
const fetchMovieDetailsFromBackend = async (movieId: string) => {
  try {
    // Fetch movie details from our backend API endpoint
    const response = await fetch(`/api/tmdb/movie/${movieId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
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
  const [direction, setDirection] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Reset the direction when a new card becomes active
  useEffect(() => {
    if (isActive) {
      setDirection(0);
      setSwiped(false);
    }
  }, [isActive, item.id]);

  // Sprawdź, czy to jest element AI-generowany
  const isAiGenerated = useMemo(() => {
    return !!(
      (item.details &&
        typeof item.details === "object" &&
        ("director" in item.details || "genres" in item.details || "cast" in item.details)) ||
      (item.type === "film" &&
        item.id &&
        (String(item.id).startsWith("ai_") || String(item.id).includes("1234")))
    );
  }, [item]);

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
      director: details.director ? String(details.director) : undefined,
      cast: Array.isArray(details.cast) ? details.cast.map((c) => String(c)) : [],
      overview: details.description ? String(details.description) : undefined,
    };

    console.log("Extracted details:", extractedDetails);
    return extractedDetails;
  }, [item]);

  // Fetch movie details from our backend API when card becomes active and is a film
  useEffect(() => {
    if (isActive && item.type === "film" && !isAiGenerated) {
      fetchMovieDetails(item.id);
    } else if (isActive && isAiGenerated) {
      // For AI-generated content, we already have details
      const aiDetails = extractDetails;
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

  // Extracted image URL with fallback
  const imageUrl = useMemo(() => {
    // Z AI-generowanych danych
    if (isAiGenerated && item.details) {
      return (
        item.details.imageUrl ||
        item.details.img ||
        "https://placehold.co/200x200/ddd/333?text=AI+Generated"
      );
    }

    // Z standardowych danych
    return item.details && item.details.imageUrl
      ? String(item.details.imageUrl)
      : "https://placehold.co/200x200/ddd/333?text=No+Image";
  }, [item, isAiGenerated]);

  return (
    <motion.div
      className={`absolute top-0 left-0 w-full ${!isActive || swiped ? "hidden" : ""}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        const dragX = info.offset.x;
        if (dragX > 100) {
          setDirection(1);
          setSwiped(true);
          setTimeout(() => {
            handleSwipeWithDetails(FeedbackType.LIKE);
          }, 200);
        } else if (dragX < -100) {
          setDirection(-1);
          setSwiped(true);
          setTimeout(() => {
            handleSwipeWithDetails(FeedbackType.DISLIKE);
          }, 200);
        }
      }}
      animate={{
        x: direction === 0 ? 0 : direction > 0 ? 200 : -200,
        opacity: direction === 0 ? 1 : 0,
      }}
      transition={{ duration: 0.2 }}
      style={{ cursor: "grab" }}
    >
      <div
        className="p-4 bg-white rounded-lg shadow-md border border-gray-200 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {previousRating.exists && (
          <div
            className={`absolute top-0 right-0 px-2 py-1 text-xs text-white rounded-bl-lg ${
              previousRating.type === FeedbackType.LIKE ? "bg-green-500" : "bg-red-500"
            }`}
          >
            Previously {previousRating.type === FeedbackType.LIKE ? "Liked" : "Disliked"}
          </div>
        )}

        {/* AI Badge */}
        {isAiGenerated && (
          <div className="absolute top-0 left-0 px-2 py-1 text-xs text-white rounded-br-lg bg-green-500">
            AI
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold" style={{ color: "black" }}>
            {item.name}
          </h3>
          <div className="flex items-center">
            {item.type === "film" &&
              (movieDetails?.overview || (item.details && "description" in item.details)) && (
                <span className="mr-2 text-xs text-blue-500 cursor-help" title="Hover for details">
                  ⓘ
                </span>
              )}
            <span className="text-xs text-gray-500 capitalize">{item.type}</span>
          </div>
        </div>

        {/* Movie overview tooltip */}
        {isHovered &&
          item.type === "film" &&
          (movieDetails?.overview || (item.details && "description" in item.details)) && (
            <div className="absolute left-0 bottom-full p-3 bg-black bg-opacity-90 text-white text-sm rounded-md shadow-lg z-10 w-auto min-w-[200px] max-w-[400px] mb-2 transition-all duration-200 ease-in-out">
              <div className="font-semibold mb-1 border-b border-gray-600 pb-1">Movie Overview</div>
              <p className="text-xs leading-relaxed my-2">
                {movieDetails?.overview ||
                  (item.details && "description" in item.details
                    ? String(item.details.description)
                    : "")}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
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
                <div className="mt-2 text-xs">
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
                <div className="mt-2 text-xs">
                  <span className="font-semibold">Cast: </span>
                  <div className="mt-1 text-xs">
                    {movieDetails.cast.slice(0, 5).join(", ")}
                    {movieDetails.cast.length > 5 && "..."}
                  </div>
                </div>
              )}
              {/* Tooltip arrow */}
              <div className="absolute w-3 h-3 bg-black bg-opacity-90 transform rotate-45 left-4 -bottom-1.5"></div>
            </div>
          )}

        <div className="flex items-start gap-4">
          {/* Display image */}
          <div
            className={`${["album", "song"].includes(item.type) ? "w-24 h-24" : "w-32 h-48 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-md flex items-center justify-center"} flex-shrink-0`}
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
                {/* Display Director */}
                {(movieDetails?.director ||
                  (item.details &&
                    typeof item.details === "object" &&
                    "director" in item.details)) && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Director:</span>{" "}
                    {movieDetails?.director ||
                      (item.details &&
                      typeof item.details === "object" &&
                      "director" in item.details
                        ? String(item.details.director)
                        : "")}
                  </p>
                )}

                {/* Display Year/Release */}
                {(movieDetails?.release_date ||
                  (item.details && typeof item.details === "object" && "year" in item.details)) && (
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
                      !["artist", "director", "genres", "cast", "year", "description"].includes(key)
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
  const [activeTab, setActiveTab] = useState<"film" | "music">("film");
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistoryItem[]>([]);

  // Funkcja do sprawdzania czy film istnieje w historii - używana w interfejsie
  const checkIfItemExists = async (itemId: string): Promise<{ exists: boolean }> => {
    try {
      const feedbackData = localStorage.getItem(`recommendation-feedback-${userId}`);
      if (feedbackData) {
        const parsedData = JSON.parse(feedbackData);
        const exists = parsedData.some((item: FeedbackHistoryItem) => item.id === itemId);
        return exists ? { exists: true } : { exists: false };
      }
    } catch (error) {
      console.error("Error checking movie existence:", error);
    }
    return { exists: false };
  };

  // Get stored feedback history from local storage on component mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(`recommendation-feedback-${userId}`);
      if (storedHistory) {
        setFeedbackHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error loading feedback history:", error);
    }
  }, []);

  // Fetch recommendations when component mounts
  useEffect(() => {
    fetchRecommendations(activeTab);
  }, [userId, activeTab]);

  // Funkcja do ponownego ładowania rekomendacji po kliknięciu przycisku Try again
  const handleTryAgain = () => {
    fetchRecommendations(activeTab);
  };

  // Function to fetch recommendations from API
  const fetchRecommendations = async (type: "film" | "music") => {
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
          force_refresh: isNewUser || !!error, // Force refresh if new user or previous error
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[RecommendationSidebar] API Error: ${JSON.stringify(errorData)}`);
        throw new Error(errorData.error || "Error fetching recommendations");
      }

      const data = await response.json();
      console.log(`[RecommendationSidebar] Received response: ${JSON.stringify(data)}`);

      // Validation & filtering
      if (!data || !data.data || !data.data.items) {
        console.warn("[RecommendationSidebar] Invalid response format - missing data.items");
        throw new Error("No recommendations available");
      }

      // Make sure items is an array
      if (!Array.isArray(data.data.items)) {
        console.warn("[RecommendationSidebar] data.items is not an array");
        throw new Error("Invalid recommendations format");
      }

      // Filter out items the user has already seen based on local history
      const filteredItems = UniqueRecommendationsService.filterLocalRecommendations(
        userId,
        data.data.items,
        RECOMMENDATION_COOLDOWN_PERIOD
      );

      if (filteredItems.length === 0) {
        console.warn("[RecommendationSidebar] No unseen items available after filtering");
        if (data.data.items.length > 0) {
          // If there were items but all have been filtered out
          setHasSeenAllItems(true);
        } else {
          throw new Error("No recommendations available");
        }
      } else {
        setHasSeenAllItems(false);
      }

      // Add unique ids to items if they don't have them
      const enhancedItems = filteredItems.map((item: RecommendationItem) => {
        if (!item.id) {
          item.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return item;
      });

      console.log(`[RecommendationSidebar] ${enhancedItems.length} recommendations loaded`);
      setItems(enhancedItems);
      setCurrentIndex(0);

      // Wyloguj dane dla weryfikacji struktury
      console.log(
        "[RecommendationSidebar] Received data structure:",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "[RecommendationSidebar] Recommendations:",
        JSON.stringify(enhancedItems, null, 2)
      );

      // Filtruj, aby pokazać tylko nowe lub pomijane wcześniej rekomendacje
      const filteredRecommendations = UniqueRecommendationsService.filterLocalRecommendations(
        userId,
        enhancedItems,
        RECOMMENDATION_COOLDOWN_PERIOD
      );

      const shuffledItems = filteredRecommendations.sort(() => Math.random() - 0.5);
      setItems(shuffledItems);
      setCurrentIndex(0);
      setHasSeenAllItems(false);
    } catch (err) {
      console.error("[RecommendationSidebar] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Load empty array to avoid showing old items
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle swipe action for an item
  const handleSwipe = async (itemId: string, feedbackType: FeedbackType) => {
    try {
      // First update the current index to show the next item immediately
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (items.length > 0) {
        // If we're at the end, show a message about seeing all items
        setCurrentIndex(items.length);
      }

      // Find the current item in the array
      const currentItem = items.find((item) => item.id === itemId);
      if (!currentItem) {
        return;
      }

      // Add to feedback history using the service (saves to localStorage)
      UniqueRecommendationsService.addToHistory(userId, itemId, feedbackType);

      // Remove the item from the current list
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      // Store feedback in the database
      try {
        // Try the primary endpoint first
        let savedSuccessfully = false;
        try {
          const primaryUrl = new URL(`/api/users/${userId}/item-feedback`, window.location.origin);

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
  };

  // Clear feedback history
  const clearFeedbackHistory = () => {
    UniqueRecommendationsService.clearHistory(userId);
    // Reset index to show all items
    setCurrentIndex(0);
    // Refresh recommendations
    fetchRecommendations(activeTab);
  };

  // Fetch more recommendations
  const fetchMoreRecommendations = useCallback(async () => {
    setLoading(true);

    try {
      // Build URL with query parameters and force refresh
      const url = new URL(`/api/users/${userId}/recommendations`, window.location.origin);
      url.searchParams.append("force_refresh", "true");

      if (isNewUser) {
        url.searchParams.append("is_new_user", "true");
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "music", // Could be made dynamic based on user preference
          force_refresh: true,
        }),
      });

      let recommendations: RecommendationDTO[] = [];

      // Ensure successful response
      if (!response.ok) {
        throw new Error(`Failed to fetch more recommendations: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.data) {
        recommendations = [data.data];
      } else {
        recommendations = [];
      }

      // Filtruj, aby pokazać tylko nowe lub pomijane wcześniej rekomendacje

      // Extract items from recommendations
      const extractedItems: RecommendationItem[] = [];
      recommendations.forEach((rec) => {
        if (rec.data?.items && Array.isArray(rec.data.items)) {
          // Add a unique ID to each item
          const itemsWithUniqueIds = rec.data.items.map((item) => ({
            ...item,
            id: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          }));
          extractedItems.push(...itemsWithUniqueIds);
        }
      });

      // Filter using client-side history
      const filteredItems = UniqueRecommendationsService.filterLocalRecommendations(
        userId,
        extractedItems,
        RECOMMENDATION_COOLDOWN_PERIOD
      );

      const shuffledItems = filteredItems.sort(() => Math.random() - 0.5);
      setItems(shuffledItems);
      setCurrentIndex(0);
      setHasSeenAllItems(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch more items");
    } finally {
      setLoading(false);
    }
  }, [userId, isNewUser]);

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
          <div className="text-center text-red-500">
            <p>{error}</p>
            <button className="mt-2 text-indigo-500 hover:underline" onClick={handleTryAgain}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No recommendations available right now.</p>
            {hasSeenAllItems && (
              <button
                className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={fetchMoreRecommendations}
              >
                Get More Recommendations
              </button>
            )}
          </div>
        ) : currentIndex >= items.length ? (
          <div className="text-center">
            <p className="text-gray-600">You&apos;ve seen all recommendations for now.</p>
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              onClick={clearFeedbackHistory}
            >
              Clear History to See More
            </button>
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
