import React from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";
import { useAnimationSettings } from "./AnimationSettingsContext";

interface CardTransitionWrapperProps {
  children: ReactNode;
  index: number;
  activeIndex: number;
  direction: "enter" | "exit" | "center";
  swipeDirection?: "left" | "right" | "none";
}

export function CardTransitionWrapper({
  children,
  index,
  activeIndex,
  direction,
  swipeDirection = "none",
}: CardTransitionWrapperProps) {
  const { settings } = useAnimationSettings();

  // Adjust animation duration based on settings - szybsze czasy dla lepszej responsywności
  const getDuration = () => {
    switch (settings.animationSpeed) {
      case "slow":
        return 0.8;
      case "fast":
        return 0.3;
      default:
        return 0.45;
    }
  };

  // Card animation variants - bardziej dramatyczne przejścia
  const cardVariants: Variants = {
    enter: {
      scale: 0.7,
      y: 150,
      opacity: 0,
      transition: {
        duration: getDuration(),
        ease: "easeOut",
      },
    },
    center: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
        duration: getDuration(),
      },
    },
    exit: {
      x:
        swipeDirection === "right"
          ? window.innerWidth * 1.5
          : swipeDirection === "left"
            ? -window.innerWidth * 1.5
            : 0,
      opacity: 0,
      rotate: swipeDirection === "right" ? 60 : swipeDirection === "left" ? -60 : 0,
      scale: 0.9,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: getDuration() * 1.2,
      },
    },
  };

  // If animations are disabled or reduce motion is enabled, simplify animations
  const getVariants = () => {
    if (!settings.animationsEnabled || settings.reduceMotion) {
      return {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return cardVariants;
  };

  return (
    <motion.div
      initial="enter"
      animate={direction}
      variants={getVariants()}
      className={`absolute top-0 left-0 w-full ${index !== activeIndex ? "pointer-events-none" : ""}`}
      style={{
        zIndex: index === activeIndex ? 10 : 5,
        transformOrigin: swipeDirection === "right" ? "bottom left" : "bottom right",
      }}
    >
      <div className={direction === "center" ? "shadow-xl" : ""}>{children}</div>
    </motion.div>
  );
}
