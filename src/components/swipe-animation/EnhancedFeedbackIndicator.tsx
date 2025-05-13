import { motion } from "framer-motion";

export type SwipeState = "none" | "swiping-left" | "swiping-right" | "swiped-left" | "swiped-right";

interface EnhancedFeedbackIndicatorProps {
  swipeState: SwipeState;
  xPosition: number;
}

export function EnhancedFeedbackIndicator({
  swipeState,
  xPosition,
}: EnhancedFeedbackIndicatorProps) {
  if (swipeState === "none") {
    return null;
  }

  const isRight = swipeState.includes("right");
  const isSwiping = swipeState.includes("swiping");
  const isSwiped = swipeState.includes("swiped");

  // Zwiększona czułość wskaźnika
  const opacity = Math.min(Math.abs(xPosition) / 40, 1);

  // Bardziej wyraziste kolory i efekt glow
  const colorClass = isRight
    ? "bg-green-600/95 border-green-400 shadow-green-500/80 shadow-lg"
    : "bg-red-600/95 border-red-400 shadow-red-500/80 shadow-lg";

  // Icon based on direction
  const Icon = isRight ? HeartIcon : XIcon;

  // Bardziej wyraziste animacje
  const animationVariants = {
    swiping: {
      opacity: isSwiping ? opacity : 0,
      scale: isSwiping ? 0.9 + opacity * 0.6 : 1,
      x: isRight ? opacity * 20 : -opacity * 20,
      rotate: isRight ? opacity * 12 : -opacity * 12,
    },
    swiped: {
      opacity: 1,
      scale: 1.5,
      x: isRight ? 25 : -25,
      rotate: isRight ? 15 : -15,
    },
  };

  return (
    <motion.div
      className={`absolute ${isRight ? "left-6" : "right-6"} top-6 rounded-full ${colorClass} 
        border-2 px-4 py-2.5 flex items-center z-30 shadow-xl`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isSwiped ? animationVariants.swiped : animationVariants.swiping}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      data-testid="feedback-indicator"
    >
      <Icon className={`w-7 h-7 mr-2 ${isRight ? "text-white" : "text-white"}`} />
      <span className="text-white font-bold text-md tracking-wider">
        {isRight ? "LIKE" : "NOPE"}
      </span>
    </motion.div>
  );
}

const HeartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
