import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { useCallback, useState } from 'react';

interface UseMobileGesturesProps {
  onSwipeDelete?: () => void;
  onTap?: () => void;
  onPullRefresh?: () => void;
  swipeThreshold?: number;
  pullRefreshThreshold?: number;
}

interface GestureState {
  isDeleting: boolean;
  showUndo: boolean;
  isPulling: boolean;
}

export const useMobileGestures = ({
  onSwipeDelete,
  onTap,
  onPullRefresh,
  swipeThreshold = 100,
  pullRefreshThreshold = 80,
}: UseMobileGesturesProps = {}) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    isDeleting: false,
    showUndo: false,
    isPulling: false,
  });

  // Spring animation for swipe-to-delete
  const [{ x, opacity, scale }, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  // Spring animation for pull-to-refresh
  const [{ pullY }, pullApi] = useSpring(() => ({
    pullY: 0,
    config: { tension: 300, friction: 30 },
  }));

  const resetSwipe = useCallback(() => {
    api.start({ x: 0, opacity: 1, scale: 1 });
    setGestureState((prev) => ({ ...prev, isDeleting: false }));
  }, [api]);

  const resetPull = useCallback(() => {
    pullApi.start({ pullY: 0 });
    setGestureState((prev) => ({ ...prev, isPulling: false }));
  }, [pullApi]);

  // Handle swipe-to-delete gesture
  const swipeGesture = useGesture(
    {
      onDrag: ({
        active,
        movement: [mx],
        direction: [xDir],
        velocity: [vx],
        first,
      }) => {
        // Only handle left swipes (negative x direction)
        if (mx > 0) return;

        // Require minimum movement before starting gesture to avoid interfering with clicks
        if (first && Math.abs(mx) < 10) return;

        const trigger =
          Math.abs(mx) > swipeThreshold || (Math.abs(vx) > 0.5 && xDir < 0);

        if (active) {
          // During drag, show visual feedback
          api.start({
            x: mx,
            opacity: 1 - Math.abs(mx) / (swipeThreshold * 2),
            scale: 1 - Math.abs(mx) / (swipeThreshold * 4),
            immediate: true,
          });
        } else {
          // On release
          if (trigger) {
            // Trigger delete
            api.start({
              x: -window.innerWidth,
              opacity: 0,
              scale: 0.8,
            });
            setGestureState((prev) => ({ ...prev, isDeleting: true }));

            // Call delete callback after animation
            setTimeout(() => {
              onSwipeDelete?.();
              setGestureState((prev) => ({ ...prev, showUndo: true }));
            }, 300);
          } else {
            // Reset to original position
            resetSwipe();
          }
        }
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        rubberband: true,
        threshold: 10, // Require 10px movement before starting gesture
        preventScroll: false, // Don't prevent scroll
      },
    }
  );

  // Handle tap gesture - using a simple click handler since useGesture tap is complex
  const tapGesture = useCallback(
    () => ({
      onClick: (event: React.MouseEvent) => {
        // Prevent tap if we're in the middle of a swipe
        if (gestureState.isDeleting) return;

        // Only trigger on single taps, not double taps
        if (event.detail === 1) {
          onTap?.();
        }
      },
    }),
    [gestureState.isDeleting, onTap]
  );

  // Handle pull-to-refresh gesture (for container)
  const pullRefreshGesture = useGesture(
    {
      onDrag: ({
        active,
        movement: [, my],
        direction: [, yDir],
        velocity: [, vy],
        first,
      }) => {
        // Only handle downward pulls at the top of the container
        if (my < 0 || window.scrollY > 10) return;

        // Require minimum movement before starting gesture to avoid interfering with clicks
        if (first && Math.abs(my) < 15) return;

        const trigger = my > pullRefreshThreshold || (vy > 0.5 && yDir > 0);

        if (active) {
          // During drag, show visual feedback
          pullApi.start({
            pullY: Math.min(my, pullRefreshThreshold * 1.5),
            immediate: true,
          });
          setGestureState((prev) => ({
            ...prev,
            isPulling: my > pullRefreshThreshold,
          }));
        } else {
          // On release
          if (trigger) {
            // Trigger refresh
            setGestureState((prev) => ({ ...prev, isPulling: true }));
            onPullRefresh?.();

            // Reset after refresh completes
            setTimeout(() => {
              resetPull();
            }, 1000);
          } else {
            // Reset to original position
            resetPull();
          }
        }
      },
    },
    {
      drag: {
        axis: 'y',
        filterTaps: true,
        rubberband: true,
        threshold: 15, // Require 15px movement before starting gesture
        preventScroll: false, // Don't prevent scroll
      },
    }
  );

  // Undo functionality
  const handleUndo = useCallback(() => {
    setGestureState((prev) => ({
      ...prev,
      showUndo: false,
      isDeleting: false,
    }));
    api.start({ x: 0, opacity: 1, scale: 1 });
  }, [api]);

  // Hide undo after timeout
  const hideUndo = useCallback(() => {
    setGestureState((prev) => ({ ...prev, showUndo: false }));
  }, []);

  return {
    // Gesture handlers
    swipeGesture,
    tapGesture,
    pullRefreshGesture,

    // Animation styles
    swipeStyle: { x, opacity, scale },
    pullStyle: { pullY },

    // State
    gestureState,

    // Actions
    resetSwipe,
    resetPull,
    handleUndo,
    hideUndo,

    // Animated component
    AnimatedDiv: animated.div,
  };
};

export default useMobileGestures;
