import { useState, useRef, useEffect } from "react";
import { Card, useToast } from "../ui";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { RecommendationDetail } from "./RecommendationDetail";
import type { RecommendationFeedbackType } from "../../types";

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

export function SwipeableRecommendationCard({ item, type, onSwipe }: SwipeableRecommendationCardProps) {
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
      console.error("Error processing swipe:", error);

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
        swipeState === "swiped-right" ? " translate(150%, 0) rotate(40deg)" : " translate(-150%, 0) rotate(-40deg)";
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
      return "absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold";
    } else if (swipeState === "swiping-left") {
      return "absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold";
    }
    return "hidden";
  };

  return (
    <>
      <Card
        ref={cardRef}
        className="overflow-hidden transition-all duration-300 h-full flex flex-col group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg rounded-lg cursor-pointer select-none"
        onClick={handleCardClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={getCardStyles()}
      >
        {/* Feedback indicator */}
        <div className={getFeedbackIndicatorStyles()}>
          {swipeState === "swiping-right" && "LIKE"}
          {swipeState === "swiping-left" && "NOPE"}
        </div>

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
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Swipe to rate</span>
          <div className="flex gap-2">
            <button
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Detail View */}
      {isDetailOpen && <RecommendationDetail item={item} type={type} onClose={handleCloseDetail} />}
    </>
  );
}
