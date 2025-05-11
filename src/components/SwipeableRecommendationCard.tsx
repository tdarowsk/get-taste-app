import { useState, useRef, useEffect } from "react";
import { Card, useToast } from "../ui";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { RecommendationDetail } from "./RecommendationDetail";
import type { RecommendationFeedbackType } from "../../types";
import { isValidImageUrl } from "../../lib/utils/poster-utils";

interface SwipeableRecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  recommendationId: number;
  userId: string;
  onSwipe: (
    itemId: string,
    feedbackType: RecommendationFeedbackType,
    metadata: Record<string, unknown>
  ) => Promise<void>;
}

export function SwipeableRecommendationCard({
  item,
  type,
  onSwipe,
}: SwipeableRecommendationCardProps) {
  console.log("SwipeableRecommendationCard - Received item:", JSON.stringify(item, null, 2));
  console.log("Name field:", item.name);
  console.log("Type field:", item.type);

  // Zawsze utwórz tytuł - bezpieczny fallback
  const title = item.name || item?.metadata?.name || "Untitled";
  console.log("Calculated title:", title);

  // Try to parse details if they're a JSON string
  const tryParseDetailsJson = () => {
    let detailsObj = null;
    console.log("Parsing details from item:", item);

    // Case 1: Details in item.metadata.details as string
    if (item.metadata && item.metadata.details && typeof item.metadata.details === "string") {
      try {
        const parsed = JSON.parse(item.metadata.details as string);
        console.log("Parsed JSON details:", parsed);
        detailsObj = parsed;
      } catch (e) {
        console.error("Failed to parse details JSON:", e);
      }
    }
    // Case 2: Details in item.metadata.details as object
    else if (
      item.metadata &&
      typeof item.metadata.details === "object" &&
      item.metadata.details !== null
    ) {
      console.log("Using object details:", item.metadata.details);
      detailsObj = item.metadata.details;
    }
    // Case 3: Details directly in item.details
    else if (item.details && typeof item.details === "object") {
      console.log("Found details directly on item:", item.details);
      detailsObj = item.details;
    }
    // Case 4: Details spread across item.metadata directly
    else if (item.metadata && typeof item.metadata === "object") {
      // Check if metadata contains movie-related fields that indicate it has the details directly
      const movieFields = ["director", "genres", "year", "cast"];
      const hasMovieFields = movieFields.some((field) => field in item.metadata);

      if (hasMovieFields) {
        console.log("Found movie details directly in metadata:", item.metadata);
        detailsObj = item.metadata;
      }
    }

    if (!detailsObj) {
      console.log("No valid details found in item", item);
    }

    return detailsObj;
  };

  // Get parsed details
  const details = tryParseDetailsJson();

  // Check if item is AI-generated based on the metadata
  const isAiGenerated = !!(
    (item.metadata && "source" in item.metadata && item.metadata.source === "ai") ||
    (item.metadata && "ai_generated" in item.metadata && item.metadata.ai_generated === true) ||
    item.ai_generated === true ||
    (details && ("director" in details || "genres" in details || "cast" in details)) ||
    // Check item type for AI recommendations
    (item.type === "film" &&
      item.id &&
      (String(item.id).startsWith("ai_") ||
        String(item.id).match(/^\d{5,}$/) ||
        String(item.id).includes("1234")))
  );

  console.log("Is AI generated:", isAiGenerated, "details:", details);

  const { toast } = useToast();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [swipeState, setSwipeState] = useState<
    "none" | "swiping-left" | "swiping-right" | "swiped-left" | "swiped-right"
  >("none");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Define placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Get image URL with correct path to image from details or direct properties
  const rawImageUrl =
    // Direct image paths
    item.imageUrl ||
    // Check if img exists directly on the item
    (item.img ? String(item.img) : null) ||
    // From direct metadata fields
    (item.metadata && "imageUrl" in item.metadata ? String(item.metadata.imageUrl) : null) ||
    (item.metadata && "img" in item.metadata ? String(item.metadata.img) : null) ||
    // From details section (AI recommendations)
    (details && "imageUrl" in details ? String(details.imageUrl) : null) ||
    (details && "img" in details ? String(details.img) : null) ||
    placeholderImage;

  console.log("Image URL processing: ", {
    rawImageUrl,
    itemImageUrl: item.imageUrl,
    itemImg: item.img,
    metadataImageUrl: item.metadata && "imageUrl" in item.metadata ? item.metadata.imageUrl : null,
    detailsImageUrl: details && "imageUrl" in details ? details.imageUrl : null,
  });

  // Check if the image URL is valid
  const imageUrl = isValidImageUrl(rawImageUrl as string) ? rawImageUrl : placeholderImage;
  const hasValidImage = rawImageUrl !== placeholderImage && !!rawImageUrl;

  // Extract director from details or direct properties
  const director =
    // Try to get from details
    (details && "director" in details ? String(details.director) : null) ||
    // Try to get directly from item
    (item.director ? String(item.director) : null);

  // Extract year from details or direct properties
  const year =
    // Try to get from details
    (details && "year" in details ? String(details.year) : null) ||
    // Try to get directly from item
    (item.year ? String(item.year) : null);

  // Extract genres from details or direct properties
  let genres: string[] = [];
  if (details && "genres" in details && Array.isArray(details.genres)) {
    genres = details.genres as string[];
  } else if (item.genres && Array.isArray(item.genres)) {
    genres = item.genres as string[];
  }

  const primaryGenre = genres.length > 0 ? String(genres[0]) : "";

  // Extract cast from details or direct properties
  let cast: string[] = [];
  if (details && "cast" in details && Array.isArray(details.cast)) {
    cast = details.cast as string[];
  } else if (item.cast && Array.isArray(item.cast)) {
    cast = item.cast as string[];
  }

  // Join genres for display
  const genresDisplay = genres
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

  // Apply different accent colors based on type and source
  const accentColor = isAiGenerated
    ? "from-green-500 to-emerald-600"
    : type === "music"
      ? "from-blue-600 to-indigo-600"
      : "from-purple-600 to-pink-600";

  // Determine display name with fallback
  const displayName = item.name || "";
  console.log("Display name:", displayName);

  // Handle card click to open detail view
  const handleCardClick = () => {
    // Only open details if not swiping
    if (!isDraggingRef.current) {
      setIsDetailOpen(true);
    }
  };

  // Handle close detail view
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  // Handle mouse/touch down event
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDetailOpen) return;

    e.preventDefault();
    isDraggingRef.current = true;

    // Get start position
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = { x: clientX, y: clientY };

    // Add event listeners for drag and end
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchend", handleDragEnd);
  };

  // Handle mouse/touch move event
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();

    // Get current position
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Calculate delta
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Update position
    setPosition({ x: deltaX, y: deltaY });

    // Determine swipe direction based on position
    if (deltaX > 50) {
      setSwipeState("swiping-right");
    } else if (deltaX < -50) {
      setSwipeState("swiping-left");
    } else {
      setSwipeState("none");
    }
  };

  // Handle mouse/touch up event
  const handleDragEnd = async (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();
    isDraggingRef.current = false;

    // Remove event listeners
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);

    // Check if swipe was far enough to register
    if (position.x > 100) {
      // Swipe right (like)
      setSwipeState("swiped-right");

      // Trigger algorithm feedback
      await handleSwipeFeedback("like");
    } else if (position.x < -100) {
      // Swipe left (dislike)
      setSwipeState("swiped-left");

      // Trigger algorithm feedback
      await handleSwipeFeedback("dislike");
    } else {
      // Reset position if swipe wasn't far enough
      setPosition({ x: 0, y: 0 });
      setSwipeState("none");
    }
  };

  // Handle swipe feedback and trigger parent callback
  const handleSwipeFeedback = async (feedbackType: RecommendationFeedbackType) => {
    try {
      toast({
        title: feedbackType === "like" ? "Added to your likes" : "Noted your dislike",
        description: "Your taste profile is being updated",
        variant: feedbackType === "like" ? "default" : "destructive",
      });

      // Pass feedback to parent component
      await onSwipe(item.id, feedbackType, item.metadata);
    } catch (error) {
      console.error("Failed to save feedback:", error);
      // Reset on error
      setPosition({ x: 0, y: 0 });
      setSwipeState("none");

      toast({
        title: "Error",
        description: "Failed to save your preference",
        variant: "destructive",
      });
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  // Determine styles based on swipe state
  const getCardStyles = () => {
    let transform = `translate(${position.x}px, ${position.y}px)`;
    let opacity = 1;

    // Add rotation based on x position
    if (swipeState.includes("swiping") || swipeState.includes("swiped")) {
      const rotation = position.x * 0.1; // Rotation increases with swipe distance
      transform += ` rotate(${rotation}deg)`;
    }

    // Handle swiped states
    if (swipeState === "swiped-left" || swipeState === "swiped-right") {
      opacity = 0;
      transform +=
        swipeState === "swiped-right"
          ? " translate(150%, 0) rotate(40deg)"
          : " translate(-150%, 0) rotate(-40deg)";
    }

    return {
      transform,
      opacity,
      transition: swipeState.includes("swiped") ? "transform 0.5s, opacity 0.5s" : undefined,
    };
  };

  // Determine feedback indicator styles
  const getFeedbackIndicatorStyles = () => {
    if (swipeState === "swiping-right") {
      return "absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10";
    } else if (swipeState === "swiping-left") {
      return "absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10";
    }
    return "hidden";
  };

  return (
    <>
      <Card
        ref={cardRef}
        data-testid="swipe-card"
        className={`overflow-hidden transition-all duration-300 h-full flex flex-col group border shadow-lg rounded-lg cursor-pointer select-none ${
          isAiGenerated
            ? "bg-white border-green-500/30 hover:border-green-400/40"
            : "bg-white border-gray-300 hover:border-gray-400"
        }`}
        onClick={handleCardClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={getCardStyles()}
      >
        {/* TITLE - Displayed at the very top with RED text for maximum visibility */}
        <div className="w-full p-3 text-center border-b-2 border-red-600 bg-black">
          <h2 className="text-xl font-bold text-red-500 truncate">{title}</h2>
        </div>

        {/* Content type indicator */}
        <div className="absolute top-2 right-2 text-xs text-gray-400 px-2 py-1 bg-black/30 rounded z-10">
          {type === "music" ? "Music" : "Film"}
        </div>

        {/* Feedback indicator */}
        <div className={getFeedbackIndicatorStyles()} data-testid="feedback-indicator">
          {swipeState === "swiping-right" && "LIKE"}
          {swipeState === "swiping-left" && "NOPE"}
        </div>

        <div className="flex flex-col h-full p-4">
          {/* Thumbnail image */}
          <div className="relative w-full h-36 overflow-hidden rounded-md mb-3 border border-white/10 bg-gray-800">
            {hasValidImage ? (
              <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-900">
                <div className="text-center p-4">
                  <div className="font-bold text-xl mb-1">No Image</div>
                  <div className="text-xs text-gray-500">
                    <div>Director: {director || "..."}</div>
                    <div>Genre: {primaryGenre || "..."}</div>
                    <div>Year: {year || "..."}</div>
                    <div>Cast: {castString || "..."}</div>
                  </div>
                </div>
              </div>
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
            {/* Display Title removed - now at the top of card */}

            {primaryGenre && (
              <div
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${accentColor} text-white mb-1 mt-2`}
              >
                {primaryGenre}
              </div>
            )}

            {isAiGenerated ? (
              <div className="mt-1">
                {director && (
                  <span className="text-xs text-green-300 block">Director: {director}</span>
                )}
                {year && <span className="text-xs text-green-300 block">Year: {year}</span>}
                {castString && (
                  <span className="text-xs text-green-300 block">Cast: {castString}</span>
                )}
                {genresDisplay && genresDisplay !== primaryGenre && (
                  <span className="text-xs text-green-300 block">Genres: {genresDisplay}</span>
                )}
              </div>
            ) : (
              <div>
                {type === "music" && (
                  <p className="text-xs text-gray-300 line-clamp-1">Artist name</p>
                )}
                {type === "film" && director && (
                  <p className="text-xs text-gray-300 line-clamp-1">Dir: {director}</p>
                )}
              </div>
            )}
          </div>

          {item.description && (
            <div className="mt-2">
              <p className="text-xs text-gray-300 line-clamp-2">{item.description}</p>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Swipe to rate
            </span>
            <div className="flex gap-2">
              <button
                data-testid="button-dislike"
                className="p-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipeFeedback("dislike");
                  setSwipeState("swiped-left");
                }}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button
                data-testid="button-like"
                className="p-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipeFeedback("like");
                  setSwipeState("swiped-right");
                }}
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
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail View */}
      {isDetailOpen && <RecommendationDetail item={item} type={type} onClose={handleCloseDetail} />}
    </>
  );
}
