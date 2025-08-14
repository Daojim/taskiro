import React, { useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface UndoToastProps {
  show: boolean;
  message: string;
  onUndo: () => void;
  onHide: () => void;
  duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({
  show,
  message,
  onUndo,
  onHide,
  duration = 4000,
}) => {
  const [styles, api] = useSpring(() => ({
    opacity: 0,
    transform: 'translateY(100%)',
    config: { tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (show) {
      api.start({
        opacity: 1,
        transform: 'translateY(0%)',
      });

      // Auto-hide after duration
      const timer = setTimeout(() => {
        api.start({
          opacity: 0,
          transform: 'translateY(100%)',
        });
        setTimeout(onHide, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    } else {
      api.start({
        opacity: 0,
        transform: 'translateY(100%)',
      });
    }
  }, [show, api, onHide, duration]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <animated.div
        style={styles}
        className="mx-auto max-w-sm bg-gray-900 dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-700/50 backdrop-blur-sm"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-success-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-body text-white font-medium">{message}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onUndo}
                className="button button--ghost button--small text-primary-400 hover:text-primary-300"
              >
                Undo
              </button>
              <button
                onClick={() => {
                  api.start({
                    opacity: 0,
                    transform: 'translateY(100%)',
                  });
                  setTimeout(onHide, 300);
                }}
                className="p-1 text-gray-400 hover:text-gray-300 button--focus rounded-lg transition-colors duration-250 hover-scale"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
};

export default UndoToast;
