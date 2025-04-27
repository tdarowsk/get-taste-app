import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { RecommendationDTO, RecommendationItem } from "../../types";
import { RecommendationFeedbackType as FeedbackType } from "../../types";
import { mockMusicRecommendations, mockFilmRecommendations } from "../../mockData";

// Use imported mock data instead of local definitions
const mockRecommendations: RecommendationDTO[] = [...mockMusicRecommendations, ...mockFilmRecommendations];

// Define an interface for storing feedback history
interface FeedbackHistory {
  itemId: string; // Changed from recommendationId to itemId
  timestamp: number; // Unix timestamp in milliseconds
  feedbackType: FeedbackType;
}

// The time period for which items should not be shown after feedback (24 hours)
const RECOMMENDATION_COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ItemCardProps {
  item: RecommendationItem;
  onSwipe: (id: string, direction: FeedbackType) => void;
  isActive: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSwipe, isActive }) => {
  const [direction, setDirection] = useState(0);
  const [swiped, setSwiped] = useState(false);

  // Reset the direction when a new card becomes active
  useEffect(() => {
    if (isActive) {
      setDirection(0);
      setSwiped(false);
    }
  }, [isActive, item.id]);

  // Sprawdź, czy ten element był już kiedyś oceniony
  const hasBeenRatedBefore = () => {
    try {
      const storedHistory = localStorage.getItem(`item-feedback-history`);
      if (storedHistory) {
        const history = JSON.parse(storedHistory) as FeedbackHistory[];
        // Znajdź najnowszy feedback dla tego elementu (jeśli istnieje)
        const previousFeedback = history
          .filter((historyItem) => historyItem.itemId === item.id)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

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
            onSwipe(item.id, FeedbackType.LIKE);
          }, 200);
        } else if (dragX < -100) {
          setDirection(-1);
          setSwiped(true);
          setTimeout(() => {
            onSwipe(item.id, FeedbackType.DISLIKE);
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
      <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
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
          <span className="text-xs text-gray-500 capitalize">{item.type}</span>
        </div>

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

interface RecommendationSidebarProps {
  userId: number;
  className?: string;
  isNewUser?: boolean;
}

const RecommendationSidebar: React.FC<RecommendationSidebarProps> = ({ userId, className, isNewUser = false }) => {
  // Flatten all recommendation items into a single array
  const [allItems, setAllItems] = useState<RecommendationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);

  // Load feedback history from localStorage on component mount
  useEffect(() => {
    const loadFeedbackHistory = () => {
      try {
        const storedHistory = localStorage.getItem(`item-feedback-history`);
        if (storedHistory) {
          setFeedbackHistory(JSON.parse(storedHistory));
        }
      } catch (err) {
        console.error("Error loading feedback history from localStorage:", err);
      }
    };

    loadFeedbackHistory();
  }, []);

  // Save feedback history to localStorage whenever it changes
  useEffect(() => {
    if (feedbackHistory.length > 0) {
      try {
        localStorage.setItem(`item-feedback-history`, JSON.stringify(feedbackHistory));
      } catch (err) {
        console.error("Error saving feedback history to localStorage:", err);
      }
    }
  }, [feedbackHistory]);

  // Filter out items that have received feedback recently
  const filterItems = (items: RecommendationItem[]): RecommendationItem[] => {
    const now = Date.now();

    return items.filter((item) => {
      // Check if this item has feedback that's not yet expired
      const feedback = feedbackHistory.find((fb) => fb.itemId === item.id);
      if (!feedback) return true; // No feedback, include it

      // Check if the feedback is still in the cooldown period
      return now - feedback.timestamp > RECOMMENDATION_COOLDOWN_PERIOD;
    });
  };

  // Fetch recommendations and extract items on component mount and when userId changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build URL with query parameters
        const url = new URL(`/api/users/${userId}/recommendations`, window.location.origin);

        // Add is_new_user parameter for new users
        if (isNewUser) {
          url.searchParams.append("is_new_user", "true");
        }

        const response = await fetch(url.toString());
        let recommendations: RecommendationDTO[] = [];

        // If API returns 404 or any error, silently use mock data
        if (!response.ok) {
          console.log("API error or not found, using mock recommendations");
          // Update user_id in mock recommendations
          recommendations = mockRecommendations.map((rec) => ({
            ...rec,
            user_id: userId,
            id: rec.id + Math.floor(Math.random() * 1000), // Ensure unique IDs
          }));
        } else {
          // Parse API response
          const data = await response.json();
          if (data && data.length > 0) {
            recommendations = data;
          } else {
            // If API returned empty results, use mocks
            recommendations = mockRecommendations.map((rec) => ({
              ...rec,
              user_id: userId,
              id: rec.id + Math.floor(Math.random() * 1000),
            }));
          }
        }

        // Extract all items from recommendations
        const extractedItems: RecommendationItem[] = [];
        recommendations.forEach((rec) => {
          if (rec.data?.items && Array.isArray(rec.data.items)) {
            // Add a unique ID to each item to ensure uniqueness across recommendations
            const itemsWithUniqueIds = rec.data.items.map((item) => ({
              ...item,
              id: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            }));
            extractedItems.push(...itemsWithUniqueIds);
          }
        });

        // Shuffle the items for variety
        const shuffledItems = extractedItems.sort(() => Math.random() - 0.5);

        // Filter out items with recent feedback
        const filteredItems = filterItems(shuffledItems);

        setAllItems(filteredItems);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching recommendations:", err);

        // Use mock recommendations as fallback in case of error
        const fallbackItems: RecommendationItem[] = [];
        mockRecommendations.forEach((rec) => {
          if (rec.data?.items && Array.isArray(rec.data.items)) {
            // Add a unique ID to each item
            const itemsWithUniqueIds = rec.data.items.map((item) => ({
              ...item,
              id: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            }));
            fallbackItems.push(...itemsWithUniqueIds);
          }
        });

        // Filter out items with recent feedback
        const filteredItems = filterItems(fallbackItems);

        setAllItems(filteredItems);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, isNewUser]);

  // Handle swipe action for an item
  const handleSwipe = async (itemId: string, feedbackType: FeedbackType) => {
    try {
      // First update the current index to show the next item immediately
      if (currentIndex < allItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (allItems.length > 0) {
        // If we're at the end, show a message about seeing all items
        setCurrentIndex(allItems.length);
      }

      // Add to feedback history
      setFeedbackHistory((prev) => [
        ...prev,
        {
          itemId: itemId,
          timestamp: Date.now(),
          feedbackType: feedbackType,
        },
      ]);

      // Remove the item from the current list
      setAllItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      // TODO: If you want to send feedback to the server, you would need to
      // implement a new endpoint for item feedback or modify the existing one
    } catch (err) {
      console.error("Error processing item feedback:", err);
    }
  };

  // Clear feedback history
  const clearFeedbackHistory = () => {
    setFeedbackHistory([]);
    localStorage.removeItem(`item-feedback-history`);
    // Reset index to show all items
    setCurrentIndex(0);
  };

  // Fetch more items if needed
  const fetchMoreItems = useCallback(async () => {
    setLoading(true);

    try {
      // Generate new mock items as a simple way to get "more" items
      const newMockItems: RecommendationItem[] = [];
      mockRecommendations.forEach((rec) => {
        if (rec.data?.items && Array.isArray(rec.data.items)) {
          const itemsWithUniqueIds = rec.data.items.map((item) => ({
            ...item,
            id: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          }));
          newMockItems.push(...itemsWithUniqueIds);
        }
      });

      // Filter and shuffle
      const filteredItems = filterItems(newMockItems);
      const shuffledItems = filteredItems.sort(() => Math.random() - 0.5);

      setAllItems(shuffledItems);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching more items:", err);
      setError("Failed to fetch more items");
    } finally {
      setLoading(false);
    }
  }, [filterItems]);

  return (
    <div className={`recommendations-sidebar h-full flex flex-col ${className || ""}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Recommendations</h2>
          {feedbackHistory.length > 0 && (
            <button
              onClick={clearFeedbackHistory}
              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              title="Clear your feedback history to see all recommendations again"
            >
              Reset ({feedbackHistory.length})
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {isNewUser ? "Rate these popular items to improve your recommendations" : "Swipe to like or dislike"}
        </p>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">
            <p>Error: {error}</p>
            <button
              className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-gray-500 mb-4">
              {feedbackHistory.length > 0
                ? "You've rated all available items. Clear your history to see them again."
                : "No recommendations available at this time."}
            </p>
            {feedbackHistory.length > 0 && (
              <button
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={clearFeedbackHistory}
              >
                Clear History
              </button>
            )}
          </div>
        ) : currentIndex >= allItems.length ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-gray-500 mb-4">You&apos;ve seen all items!</p>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600" onClick={fetchMoreItems}>
              Get More Recommendations
            </button>
          </div>
        ) : (
          // Render all item cards but only show the active one
          allItems.map((item, index) => (
            <ItemCard key={item.id} item={item} onSwipe={handleSwipe} isActive={index === currentIndex} />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-50"
          disabled={loading || allItems.length === 0 || currentIndex >= allItems.length}
          onClick={async () => {
            if (currentIndex < allItems.length) {
              await handleSwipe(allItems[currentIndex].id, FeedbackType.DISLIKE);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          className="p-2 rounded-full bg-green-100 text-green-500 hover:bg-green-200 disabled:opacity-50"
          disabled={loading || allItems.length === 0 || currentIndex >= allItems.length}
          onClick={async () => {
            if (currentIndex < allItems.length) {
              await handleSwipe(allItems[currentIndex].id, FeedbackType.LIKE);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Make sure this component is exported correctly
export { RecommendationSidebar };
export default RecommendationSidebar;
