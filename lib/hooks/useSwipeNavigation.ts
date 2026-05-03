'use client';

import { useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════
// useSwipeNavigation — Mobile swipe for prev/next
// ═══════════════════════════════════════════════════════

export function useSwipeNavigation(
  onSwipeLeft: () => void,  // next question
  onSwipeRight: () => void, // previous question
  enabled: boolean = true
) {
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!enabled) return;
    const touch = 'touches' in e ? e.touches[0] : (e as any).originalEvent.touches[0];
    dragStartX.current = touch.clientX;
    dragStartY.current = touch.clientY;
    isDragging.current = true;
  }, [enabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!enabled || !isDragging.current) return;
    
    const touch = 'changedTouches' in e ? e.changedTouches[0] : (e as any).originalEvent.changedTouches[0];
    const deltaX = touch.clientX - dragStartX.current;
    const deltaY = Math.abs(touch.clientY - dragStartY.current);
    
    isDragging.current = false;

    // Only trigger if horizontal swipe (not vertical scroll)
    // Threshold: 60px horizontal, max 40px vertical deviation
    if (Math.abs(deltaX) < 60 || deltaY > 40) return;

    if (deltaX < -60) onSwipeLeft();  // swipe left = next
    if (deltaX > 60) onSwipeRight(); // swipe right = previous
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return { handleTouchStart, handleTouchEnd };
}
