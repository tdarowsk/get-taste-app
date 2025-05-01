import { useRef } from "react";

interface SwipeState {
  startX: number;
  startY: number;
  isDragging: boolean;
}

export function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    isDragging: false,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: true,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeState.current.isDragging) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeState.current.isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;

    // Upewnij się, że to gest poziomy
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    swipeState.current.isDragging = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    swipeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipeState.current.isDragging) return;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!swipeState.current.isDragging) return;

    const deltaX = e.clientX - swipeState.current.startX;
    const deltaY = e.clientY - swipeState.current.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    swipeState.current.isDragging = false;
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}
