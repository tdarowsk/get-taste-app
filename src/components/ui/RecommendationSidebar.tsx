import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { RecommendationDTO, RecommendationItem } from "../../types";
import { FeedbackType } from "../../types";
import { UniqueRecommendationsService } from "../../lib/services/uniqueRecommendations.service";

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

  // Fetch movie details from our backend API when card becomes active and is a film
  useEffect(() => {
    if (isActive && item.type === "film") {
      fetchMovieDetails(item.id);
    }
  }, [isActive, item.id, item.type]);

  // Function to fetch movie details from our backend API
  const fetchMovieDetails = async (itemId: string) => {
    try {
      setLoading(true);
      // Extract the actual movie ID from our composite ID format
      const movieId = itemId.split("-")[0];

      // For movie_id format, we need to extract just the number
      const cleanMovieId = movieId.startsWith("movie_") ? movieId.substring(6) : movieId;

      console.log(`Fetching details for movie ID: ${cleanMovieId}`);

      // Use our backend API to get movie details
      const data = await fetchMovieDetailsFromBackend(cleanMovieId);
      console.log("Movie details from backend:", data);

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

    console.log("Movie details for feedback:", {
      id: item.id,
      movieDetails,
      formattedGenres: genreString,
      formattedCast: castString,
    });

    // Store movie details in item.details for feedback
    if (item.type === "film" && movieDetails) {
      if (!item.details) item.details = {};
      if (genreString) item.details.genre = genreString;
      if (castString) item.details.cast = castString;
    }

    console.log(`Sending feedback with genres: ${genreString}, cast: ${castString}`);

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

        return previousFeedback ? { exists: true, type: previousFeedback.feedbackType } : { exists: false };
      }
    } catch (err) {
      console.error("Error checking feedback history:", err);
    }
    return { exists: false };
  };

  const previousRating = hasBeenRatedBefore();

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

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <div className="flex items-center">
            {item.type === "film" && (movieDetails?.overview || (item.details && "description" in item.details)) && (
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
                  (item.details && "description" in item.details ? String(item.details.description) : "")}
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
          {/* Display image if available */}
          {item.details && "imageUrl" in item.details && (
            <div className={`${["album", "song"].includes(item.type) ? "w-24 h-24" : "w-32 h-32"} flex-shrink-0`}>
              <img
                src={String(item.details.imageUrl)}
                alt={`${item.name} cover`}
                className="w-full h-full object-cover rounded shadow-sm"
                onError={(e) => {
                  // Fallback to a default image if loading fails
                  e.currentTarget.src = "https://placehold.co/200x200/ddd/333?text=No+Image";
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Display artist directly for songs/albums */}
            {typeof item.details?.artist === "string" && (
              <p className="text-sm text-gray-700 italic">by {item.details.artist}</p>
            )}

            {/* Display movie details if available */}
            {item.type === "film" && (
              <div className="mt-2">
                {movieDetails?.release_date && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Release:</span> {new Date(movieDetails.release_date).getFullYear()}
                  </p>
                )}
                {movieDetails?.genres && movieDetails.genres.length > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Genre:</span> {movieDetails.genres.map((g) => g.name).join(", ")}
                  </p>
                )}
                {movieDetails?.runtime && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Runtime:</span> {movieDetails.runtime} min
                  </p>
                )}
                {loading && <p className="text-xs text-gray-500 italic">Loading details...</p>}
              </div>
            )}

            {item.details && (
              <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-1">
                {Object.entries(item.details)
                  .filter(
                    ([key]) => !key.includes("imageUrl") && !key.includes("spotifyId") && key !== "artist" // Skip artist since we display it separately
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
                        <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}: </span>
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

const RecommendationSidebar: React.FC<RecommendationSidebarProps> = ({ userId, className, isNewUser = false }) => {
  // Flatten all recommendation items into a single array
  const [allItems, setAllItems] = useState<RecommendationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needMoreRecommendations, setNeedMoreRecommendations] = useState(false);

  // Fetch recommendations and extract items on component mount and when userId changes
  useEffect(() => {
    fetchRecommendations();
  }, [userId, isNewUser]);

  // Fetch recommendations and filter them
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching recommendations for user:", userId);
      // Build URL with query parameters
      const url = new URL(`/api/users/${userId}/recommendations`, window.location.origin);

      // Add is_new_user parameter for new users
      if (isNewUser) {
        url.searchParams.append("is_new_user", "true");
      }

      console.log("Request URL:", url.toString());
      const response = await fetch(url.toString(), { credentials: "include" });

      if (!response.ok) {
        console.error("Failed to fetch recommendations:", response.status, response.statusText);
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received recommendations data:", data);

      if (!data || data.length === 0) {
        console.error("No recommendations available");
        throw new Error("No recommendations available");
      }

      // Extract all items from recommendations
      const extractedItems: RecommendationItem[] = [];
      data.forEach((rec: RecommendationDTO) => {
        if (rec.data?.items && Array.isArray(rec.data.items)) {
          console.log("Processing recommendation:", rec);
          // Add a unique ID to each item to ensure uniqueness across recommendations
          const itemsWithUniqueIds = rec.data.items.map((item: RecommendationItem) => ({
            ...item,
            id: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          }));
          extractedItems.push(...itemsWithUniqueIds);
        }
      });

      console.log("Extracted items:", extractedItems);

      // Shuffle the items for variety
      const shuffledItems = extractedItems.sort(() => Math.random() - 0.5);
      console.log("Shuffled items:", shuffledItems);

      // Filter out items based on user's history (using async method to check server + local)
      const filteredItems = await UniqueRecommendationsService.filterUniqueRecommendationsAsync(
        userId,
        shuffledItems,
        RECOMMENDATION_COOLDOWN_PERIOD
      );
      console.log("Filtered items:", filteredItems);

      // Check if we need more recommendations
      setNeedMoreRecommendations(UniqueRecommendationsService.needsMoreRecommendations(filteredItems));

      setAllItems(filteredItems);
    } catch (err) {
      console.error("Error in fetchRecommendations:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isNewUser]);

  // Handle swipe action for an item
  const handleSwipe = async (itemId: string, feedbackType: FeedbackType) => {
    console.log(`Processing swipe for item ${itemId} with feedback: ${feedbackType}`);

    try {
      // First update the current index to show the next item immediately
      if (currentIndex < allItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (allItems.length > 0) {
        // If we're at the end, show a message about seeing all items
        setCurrentIndex(allItems.length);
      }

      // Find the current item in the array
      const currentItem = allItems.find((item) => item.id === itemId);
      if (!currentItem) {
        console.error(`Item with ID ${itemId} not found in allItems array`);
        return;
      }

      // Add to feedback history using the service (saves to localStorage)
      UniqueRecommendationsService.addToHistory(userId, itemId, feedbackType);
      console.log(`Saved feedback to localStorage for item ${itemId}`);

      // Remove the item from the current list
      setAllItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      // Store feedback in the database
      try {
        // Try the primary endpoint first
        let savedSuccessfully = false;
        try {
          console.log("Attempting to save feedback to primary endpoint for item " + itemId);
          const primaryUrl = new URL(`/api/users/${userId}/item-feedback`, window.location.origin);

          // Znajdź item w oryginalnej tablicy allItems
          const genre = currentItem?.details?.genre || null;
          const artist = currentItem?.details?.artist || currentItem?.details?.director || null;
          const cast = currentItem?.details?.cast || null;

          console.log("Item metadata for feedback - primary endpoint:", {
            id: itemId,
            genre,
            artist,
            cast,
            details: currentItem?.details,
          });

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
          } catch (e) {
            console.warn("Could not include metadata in feedback payload:", e);
          }

          const primaryResponse = await fetch(primaryUrl.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: body,
          });

          if (primaryResponse.ok) {
            console.log(`✅ Feedback saved to database successfully via primary endpoint for item ${itemId}`);
            savedSuccessfully = true;
          } else {
            console.warn(
              `❌ Failed to save feedback to primary endpoint: ${primaryResponse.status} ${primaryResponse.statusText}`
            );
          }
        } catch (primaryError) {
          console.warn("Error with primary feedback endpoint:", primaryError);
        }

        // If primary endpoint failed, try fallback
        if (!savedSuccessfully) {
          try {
            console.log(`Attempting to save feedback to fallback endpoint for item ${itemId}...`);
            const fallbackUrl = new URL(`/api/users/${userId}/recommendations/feedback`, window.location.origin);

            // Znajdź item w oryginalnej tablicy allItems
            const genre = currentItem?.details?.genre || null;
            const artist = currentItem?.details?.artist || currentItem?.details?.director || null;
            const cast = currentItem?.details?.cast || null;

            console.log("Item metadata for feedback - fallback endpoint:", {
              id: itemId,
              genre,
              artist,
              cast,
              details: currentItem?.details,
            });

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
            } catch (e) {
              console.warn("Could not include metadata in feedback payload:", e);
            }

            const fallbackResponse = await fetch(fallbackUrl.toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: body,
            });

            if (fallbackResponse.ok) {
              console.log(`✅ Feedback saved to fallback endpoint successfully for item ${itemId}`);
              savedSuccessfully = true;
            } else {
              console.warn(
                `❌ Fallback feedback endpoint also failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`
              );
            }
          } catch (fallbackError) {
            console.warn("Error with fallback feedback endpoint:", fallbackError);
          }
        }

        // If both endpoints failed but we have localStorage, that's okay
        if (!savedSuccessfully) {
          console.log(
            `⚠️ Could not save feedback to any API endpoint for item ${itemId}. Feedback is stored locally only.`
          );
        }
      } catch (apiError) {
        // Silent fail - feedback is still stored locally
        console.warn("Could not send feedback to API, storing locally only", apiError);
      }
    } catch (err) {
      console.error("Error processing item feedback:", err);
    }
  };

  // Clear feedback history
  const clearFeedbackHistory = () => {
    UniqueRecommendationsService.clearHistory(userId);
    // Reset index to show all items
    setCurrentIndex(0);
    // Refresh recommendations
    fetchRecommendations();
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
      console.log(response);

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

      // Filter and shuffle
      const filteredItems = await UniqueRecommendationsService.filterUniqueRecommendationsAsync(
        userId,
        extractedItems,
        RECOMMENDATION_COOLDOWN_PERIOD
      );

      const shuffledItems = filteredItems.sort(() => Math.random() - 0.5);

      setAllItems(shuffledItems);
      setCurrentIndex(0);
      setNeedMoreRecommendations(false);
    } catch (err) {
      console.error("Error fetching more items:", err);
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
            <button className="mt-2 text-indigo-500 hover:underline" onClick={fetchRecommendations}>
              Try again
            </button>
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No recommendations available right now.</p>
            {needMoreRecommendations && (
              <button
                className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={fetchMoreRecommendations}
              >
                Get More Recommendations
              </button>
            )}
          </div>
        ) : currentIndex >= allItems.length ? (
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
            {allItems.map((item, index) => (
              <ItemCard key={item.id} item={item} onSwipe={handleSwipe} isActive={index === currentIndex} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationSidebar;
