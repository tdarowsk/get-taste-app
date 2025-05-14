import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { RecommendationCard } from "./RecommendationCard";
import { Button } from "@/components/ui/button";
import type { RecommendationDTO, RecommendationItem } from "../types";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";

interface SwipeableRecommendationsProps {
  recommendations: RecommendationDTO | null;
  onLike: (item: RecommendationItem) => Promise<void>;
  onDislike: (item: RecommendationItem) => Promise<void>;
  onEmpty: () => void;
  loading?: boolean;
}

// Helper function to convert RecommendationItem to EnhancedRecommendationViewModel
const convertToViewModel = (item: RecommendationItem): EnhancedRecommendationViewModel => {
  return {
    recommendation: {
      id: parseInt(item.id) || 0,
      user_id: "",
      data: {
        title: item.name,
        description: item.explanation || "",
        items: [],
      },
      type:
        item.type.toLowerCase() === "film" || item.type.toLowerCase() === "music"
          ? (item.type.toLowerCase() as "music" | "film")
          : "music",
      created_at: new Date().toISOString(),
    },
    reason: {
      primaryReason: item.explanation || "No explanation provided",
      detailedReasons: [],
      relatedItems: [],
    },
    metadataInsight: {
      recommendationId: parseInt(item.id) || 0,
      primaryFactors: [],
      secondaryFactors: [],
      uniqueFactors: [],
    },
    isNew: true,
  };
};

export const SwipeableRecommendations = ({
  recommendations,
  onLike,
  onDislike,
  onEmpty,
  loading = false,
}: SwipeableRecommendationsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [animating, setAnimating] = useState(false);

  // Motion values for animation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, -100, 0, 100, 200], [0.8, 0.9, 1, 0.9, 0.8]);

  const cardRef = useRef<HTMLDivElement>(null);

  // Update items when recommendations change
  useEffect(() => {
    if (recommendations?.data?.items) {
      setItems(recommendations.data.items);
      setCurrentIndex(0);
      x.set(0);
    } else {
      setItems([]);
    }
  }, [recommendations, x]);

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (animating) return;

    const threshold = 100;

    if (info.offset.x > threshold) {
      await handleLike();
    } else if (info.offset.x < -threshold) {
      await handleDislike();
    } else {
      // Reset position if not swiped far enough
      x.set(0);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= items.length || animating) return;

    setAnimating(true);
    x.set(400); // Animate off screen

    try {
      await onLike(items[currentIndex]);
    } finally {
      moveToNextCard();
    }
  };

  const handleDislike = async () => {
    if (currentIndex >= items.length || animating) return;

    setAnimating(true);
    x.set(-400); // Animate off screen

    try {
      await onDislike(items[currentIndex]);
    } finally {
      moveToNextCard();
    }
  };

  const moveToNextCard = () => {
    setTimeout(() => {
      x.set(0); // Reset position for next card

      if (currentIndex >= items.length - 1) {
        onEmpty();
        setAnimating(false);
      } else {
        setCurrentIndex((prevIndex) => prevIndex + 1);
        setAnimating(false);
      }
    }, 300); // Wait for animation to complete
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Wczytywanie rekomendacji...</p>
      </div>
    );
  }

  if (!recommendations || !items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-4">
        <p className="text-gray-500 mb-4 text-center">Brak rekomendacji do wyświetlenia.</p>
        <Button onClick={() => onEmpty()}>Wygeneruj nowe rekomendacje</Button>
      </div>
    );
  }

  if (currentIndex >= items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-4">
        <p className="text-gray-500 mb-4 text-center">Oceniłeś wszystkie rekomendacje!</p>
        <Button onClick={() => onEmpty()}>Wygeneruj więcej rekomendacji</Button>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  const currentViewModel = convertToViewModel(currentItem);
  const nextViewModel = nextItem ? convertToViewModel(nextItem) : null;

  return (
    <div className="relative h-[450px] w-full max-w-sm mx-auto">
      {/* Instruction for first-time users */}
      {currentIndex === 0 && (
        <div className="absolute -top-10 left-0 right-0 text-center text-sm text-gray-500">
          Przesuń w prawo, aby polubić, lub w lewo, aby odrzucić
        </div>
      )}

      {/* Next card (shown behind current card) */}
      {nextViewModel && (
        <div className="absolute top-4 left-0 right-0 z-0 opacity-70">
          <RecommendationCard recommendation={nextViewModel} showActions={false} isActive={false} />
        </div>
      )}

      {/* Current swipeable card */}
      <motion.div
        ref={cardRef}
        style={{
          x,
          rotate,
          opacity,
          scale,
          zIndex: 10,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute w-full top-0 left-0 touch-none"
      >
        <RecommendationCard
          recommendation={currentViewModel}
          onFeedback={(_, type) => (type === "like" ? handleLike() : handleDislike())}
          showActions={true}
          isActive={!animating}
        />
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute bottom-[-30px] left-0 right-0 flex justify-center items-center">
        <div className="flex space-x-1">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full 
                ${i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-2 bg-primary/60" : "w-2 bg-gray-200"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
