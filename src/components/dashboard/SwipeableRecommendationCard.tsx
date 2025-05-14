import { useState, useRef } from "react";
import { useToast } from "../ui";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { RecommendationDetail } from "./RecommendationDetail";
import type { RecommendationFeedbackType } from "../../types";
import { extractPosterUrl, isValidImageUrl } from "../../lib/utils/poster-utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";
import type { SwipeState } from "../swipe-animation/EnhancedFeedbackIndicator";
import { EnhancedFeedbackIndicator } from "../swipe-animation/EnhancedFeedbackIndicator";

interface SwipeableRecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  recommendationId: number;
  userId: string;
  onSwipe: (
    itemId: string,
    feedbackType: RecommendationFeedbackType,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
}

export function SwipeableRecommendationCard({
  item,
  type,
  onSwipe,
}: SwipeableRecommendationCardProps) {
  const { toast } = useToast();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>("none");
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for animations - wzmocnione wartości
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-45, 0, 45]);

  // Intensywniejsze reakcje tła
  const likeOpacity = useTransform(x, [0, 50], [0, 0.5]);
  const dislikeOpacity = useTransform(x, [-50, 0], [0.5, 0]);

  // Refs for performance optimization
  const dragStartTimeRef = useRef(0);

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

  // Validate the image URL before using it
  const imageUrl = isValidImageUrl(rawImageUrl as string) ? rawImageUrl : placeholderImage;

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

    // Check for arrays with the key name (like 'genres', 'cast', etc.)
    const pluralKey = key + "s"; // e.g., 'genre' -> 'genres'
    if (Array.isArray(item.metadata[pluralKey]) && item.metadata[pluralKey].length > 0) {
      // Join array elements if there are multiple values
      return Array.isArray(item.metadata[pluralKey])
        ? item.metadata[pluralKey].join(", ")
        : String(item.metadata[pluralKey][0]);
    }

    // Check for arrays with the key name in details
    if (item.metadata.details && typeof item.metadata.details === "object") {
      const details = item.metadata.details as Record<string, unknown>;
      if (Array.isArray(details[pluralKey]) && details[pluralKey].length > 0) {
        return Array.isArray(details[pluralKey])
          ? details[pluralKey].join(", ")
          : String(details[pluralKey][0]);
      }
    }

    // Specjalny przypadek dla klucza 'title' w danych z TMDB
    if (key === "title") {
      // Sprawdź bezpośrednio pole 'title' jeśli istnieje
      if (typeof item.metadata.title === "string") {
        return item.metadata.title;
      }

      // Sprawdź pole original_title
      if (typeof item.metadata.original_title === "string") {
        return item.metadata.original_title;
      }

      // Check name as a fallback
      if (typeof item.name === "string" && item.name !== "Unknown Movie") {
        return item.name;
      }
    }

    // Specjalny przypadek dla klucza 'year' z release_date z TMDB
    if (key === "year") {
      // Try direct year field
      if (item.metadata.year) {
        return String(item.metadata.year);
      }

      // Try release_date
      if ("release_date" in item.metadata) {
        const releaseDate = item.metadata.release_date as string;
        if (releaseDate && releaseDate.length >= 4) {
          return releaseDate.substring(0, 4);
        }
      }

      // Try details.releaseDate
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (
          details.releaseDate &&
          typeof details.releaseDate === "string" &&
          details.releaseDate.length >= 4
        ) {
          return details.releaseDate.substring(0, 4);
        }
      }

      // Return current year as last resort
      return new Date().getFullYear().toString();
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

      // Return "Unknown Director" as last resort for director
      return "Unknown Director";
    }

    // Special case for genre/genres
    if (key === "genre") {
      // Check genres array
      if (Array.isArray(item.metadata.genres) && item.metadata.genres.length > 0) {
        return item.metadata.genres.join(", ");
      }

      // Check details.genres array
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (Array.isArray(details.genres) && details.genres.length > 0) {
          return details.genres.join(", ");
        }
      }

      // Return fallback genre
      return type === "music" ? "Music" : "Film";
    }

    return null;
  };

  // Get safe values for display
  const title = getMetadataValue("title") || item.name || "Unknown Title";
  const director = getMetadataValue("director") || "Unknown Director";
  const year = getMetadataValue("year") || "";
  const itemGenre = getMetadataValue("genre") || genre;

  // Check if this is from TMDB
  const isFromTMDB = item.id ? item.id.toString().includes("tmdb") : false;

  // Handle card click to open detail view
  const handleCardClick = () => {
    // Only open details if not swiping
    if (Math.abs(x.get()) < 10) {
      setIsDetailOpen(true);
    }
  };

  // Handle close detail view
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  // FRAMER MOTION HANDLERS

  // Handle drag start
  const handleDragStart = () => {
    if (isDetailOpen) return;

    dragStartTimeRef.current = Date.now();
    setSwipeState("none");
  };

  // Handle drag move
  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDetailOpen) return;

    const xOffset = info.offset.x;

    if (xOffset > 50) {
      setSwipeState("swiping-right");
    } else if (xOffset < -50) {
      setSwipeState("swiping-left");
    } else {
      setSwipeState("none");
    }
  };

  // Handle drag end
  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDetailOpen) return;

    const xOffset = info.offset.x;
    // Obniżony próg dla łatwiejszego swipowania
    const threshold = 60;

    // Zwiększona czułość na szybkie gesty
    const swipeDuration = Date.now() - dragStartTimeRef.current;
    const isFlick = swipeDuration < 200 && Math.abs(info.velocity.x) > 0.3;

    if (xOffset > threshold || (isFlick && xOffset > 20)) {
      setSwipeState("swiped-right");

      try {
        // Bezpośrednia animacja przesunięcia w prawo
        const targetX = window.innerWidth * 1.5;
        const targetRotate = 60;

        // Animacja karty z użyciem promisa
        const animationPromise = animate(x, targetX, {
          type: "spring",
          duration: 0.6,
          bounce: 0.1,
          stiffness: 300,
          damping: 20,
        });

        // Animacja rotacji
        animate(rotate, targetRotate, {
          type: "spring",
          duration: 0.6,
          bounce: 0.1,
          stiffness: 300,
          damping: 20,
        });

        // Poczekaj na zakończenie animacji przed obsługą feedbacku
        await animationPromise.then(() => new Promise((resolve) => setTimeout(resolve, 200)));
        await handleSwipeFeedback("like");
      } catch {
        animate(x, 0, {
          type: "spring",
          stiffness: 500,
          damping: 30,
        });
        setSwipeState("none");
      }
    } else if (xOffset < -threshold || (isFlick && xOffset < -20)) {
      setSwipeState("swiped-left");

      try {
        // Bezpośrednia animacja przesunięcia w lewo
        const targetX = -window.innerWidth * 1.5;
        const targetRotate = -60;

        // Animacja karty z użyciem promisa
        const animationPromise = animate(x, targetX, {
          type: "spring",
          duration: 0.6,
          bounce: 0.1,
          stiffness: 300,
          damping: 20,
        });

        // Animacja rotacji
        animate(rotate, targetRotate, {
          type: "spring",
          duration: 0.6,
          bounce: 0.1,
          stiffness: 300,
          damping: 20,
        });

        // Poczekaj na zakończenie animacji przed obsługą feedbacku
        await animationPromise.then(() => new Promise((resolve) => setTimeout(resolve, 200)));
        await handleSwipeFeedback("dislike");
      } catch {
        // Reset on error
        animate(x, 0, {
          type: "spring",
          stiffness: 500,
          damping: 30,
        });
        setSwipeState("none");
      }
    } else {
      // Return to center if not swiped far enough - dodana animacja powrotu
      setSwipeState("none");
      // Smooth animation to return to center
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.3,
      });

      animate(rotate, 0, {
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.3,
      });
    }
  };

  // Handle swipe feedback - this calls the parent onSwipe function
  const handleSwipeFeedback = async (feedbackType: RecommendationFeedbackType) => {
    try {
      // Dodajemy animacje bezpośrednio na wartościach x i rotate
      const targetX = feedbackType === "like" ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
      const targetRotate = feedbackType === "like" ? 60 : -60;

      // Animacja wyjściowa - KLUCZOWA część naprawy, działa bezpośrednio na wartościach motion
      const animationPromise = animate(x, targetX, {
        type: "spring",
        duration: 0.6,
        bounce: 0.1,
        stiffness: 300,
        damping: 20,
      });

      // Animujemy również rotację dla lepszego efektu
      animate(rotate, targetRotate, {
        type: "spring",
        duration: 0.6,
        bounce: 0.1,
        stiffness: 300,
        damping: 20,
      });

      toast({
        title: feedbackType === "like" ? "Added to your likes" : "Noted your dislike",
        description: "Your taste profile is being updated",
        variant: feedbackType === "like" ? "default" : "destructive",
      });

      // KLUCZOWE - poczekaj na ZAKOŃCZENIE animacji przed wywołaniem onSwipe
      await animationPromise.then(() => new Promise((resolve) => setTimeout(resolve, 500)));
      await onSwipe(item.id, feedbackType, item.metadata || {});
    } catch {
      toast({
        title: "Error",
        description: "Failed to save your preference",
        variant: "destructive",
      });
      // Reset state - płynna animacja powrotu
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 30,
      });
      animate(rotate, 0, {
        type: "spring",
        stiffness: 500,
        damping: 30,
      });
      setSwipeState("none");
    }
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        data-testid="swipe-card"
        className="overflow-hidden transition-colors duration-300 h-full flex flex-col group border shadow-lg rounded-lg cursor-pointer select-none touch-none w-full relative"
        style={{
          x,
          rotate,
          backgroundColor: "white",
          borderColor: isFromTMDB ? "rgba(59, 130, 246, 0.3)" : "rgba(209, 213, 219, 1)",
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          borderColor: isFromTMDB ? "rgba(59, 130, 246, 0.3)" : "rgba(209, 213, 219, 1)",
        }}
        whileHover={{
          borderColor: isFromTMDB ? "rgba(59, 130, 246, 0.4)" : "rgba(156, 163, 175, 1)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          scale: 1.03,
        }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        whileTap={{ cursor: "grabbing", scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 20,
        }}
      >
        {/* Like indicator background - intensywniejsze kolory */}
        <motion.div
          className="absolute inset-0 bg-green-500/40 rounded-lg"
          style={{ opacity: likeOpacity }}
          initial={{ opacity: 0 }}
        />

        {/* Dislike indicator background - intensywniejsze kolory */}
        <motion.div
          className="absolute inset-0 bg-red-500/40 rounded-lg"
          style={{ opacity: dislikeOpacity }}
          initial={{ opacity: 0 }}
        />

        {/* Enhanced Feedback indicator */}
        <EnhancedFeedbackIndicator swipeState={swipeState} xPosition={x.get()} />

        <div className="flex flex-col h-full relative z-0">
          {/* Thumbnail image */}
          <div className="relative w-full h-36 overflow-hidden rounded-t-lg border-b border-white/10 bg-gray-800">
            {imageUrl !== placeholderImage ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-900">
                <div className="text-center p-4">
                  <div className="font-bold text-sm mb-1 truncate">{title}</div>
                  <div className="text-xs text-gray-500">
                    {type === "film" && <div>{director}</div>}
                    {itemGenre && <div>{itemGenre}</div>}
                    {year && <div>{year}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Source badge overlay */}
            {isFromTMDB && (
              <div className="absolute top-2 left-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                TMDB
              </div>
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex-1 p-3 flex flex-col">
            <h3 className="font-medium text-sm mb-1 truncate">{title}</h3>
            {type === "film" && (
              <p className="text-xs text-gray-500 mb-1 truncate">
                {director !== "Unknown Director" ? director : ""}
              </p>
            )}

            <div className="flex items-center gap-1 mt-auto">
              {itemGenre && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {itemGenre}
                </span>
              )}
              {year && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {year}
                </span>
              )}
            </div>
          </div>

          {/* Footer with swipe instruction */}
          <div className="mt-auto p-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Swipe to rate
            </span>
            <div className="flex gap-2">
              <motion.button
                data-testid="button-dislike"
                className="p-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();

                  // Animacja ruchu przy kliknięciu przycisku dislike
                  const targetX = -window.innerWidth * 1.5;
                  const targetRotate = -60;
                  setSwipeState("swiped-left");

                  // Bardziej profesjonalna animacja
                  const xAnim = animate(x, targetX, {
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.1,
                    stiffness: 300,
                    damping: 20,
                  });

                  // Rotacja dla lepszego efektu
                  animate(rotate, targetRotate, {
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.1,
                    stiffness: 300,
                    damping: 20,
                  });

                  // Poczekaj na zakończenie animacji przed wywołaniem feedbacku
                  xAnim.then(() => {
                    setTimeout(() => {
                      handleSwipeFeedback("dislike");
                    }, 200);
                  });
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
              <motion.button
                data-testid="button-like"
                className="p-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();

                  // Animacja ruchu przy kliknięciu przycisku like
                  const targetX = window.innerWidth * 1.5;
                  const targetRotate = 60;
                  setSwipeState("swiped-right");

                  // Bardziej profesjonalna animacja
                  const xAnim = animate(x, targetX, {
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.1,
                    stiffness: 300,
                    damping: 20,
                  });

                  // Rotacja dla lepszego efektu
                  animate(rotate, targetRotate, {
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.1,
                    stiffness: 300,
                    damping: 20,
                  });

                  // Poczekaj na zakończenie animacji przed wywołaniem feedbacku
                  xAnim.then(() => {
                    setTimeout(() => {
                      handleSwipeFeedback("like");
                    }, 200);
                  });
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detail View */}
      {isDetailOpen && <RecommendationDetail item={item} type={type} onClose={handleCloseDetail} />}
    </>
  );
}
