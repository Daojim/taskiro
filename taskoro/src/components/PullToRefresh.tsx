import React from 'react';
import { useSpring, animated } from '@react-spring/web';

interface PullToRefreshProps {
  pullY: number;
  isPulling: boolean;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  pullY,
  isPulling,
  threshold = 80,
}) => {
  const progress = Math.min(pullY / threshold, 1);
  const isTriggered = pullY >= threshold;

  const [iconStyles] = useSpring(() => ({
    transform: `rotate(${progress * 180}deg)`,
    config: { tension: 300, friction: 30 },
  }));

  const [containerStyles] = useSpring(() => ({
    opacity: Math.min(progress, 1),
    transform: `translateY(${Math.min(pullY - 20, 60)}px)`,
    config: { tension: 300, friction: 30 },
  }));

  return (
    <animated.div
      style={containerStyles}
      className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
    >
      <div className="flex flex-col items-center justify-center p-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
            isTriggered
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
        >
          {isPulling && isTriggered ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <animated.div style={iconStyles}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </animated.div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isPulling && isTriggered
            ? 'Refreshing...'
            : isTriggered
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </p>
      </div>
    </animated.div>
  );
};

export default PullToRefresh;
