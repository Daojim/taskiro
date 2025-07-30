import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'avatar' | 'button' | 'card' | 'task';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const getSkeletonClasses = () => {
    const baseClasses = 'skeleton animate-pulse';

    switch (variant) {
      case 'text':
        return `${baseClasses} skeleton-text ${className}`;
      case 'avatar':
        return `${baseClasses} skeleton-avatar ${className}`;
      case 'button':
        return `${baseClasses} skeleton-button ${className}`;
      case 'card':
        return `${baseClasses} h-32 rounded-xl ${className}`;
      case 'task':
        return `${baseClasses} h-24 rounded-xl ${className}`;
      default:
        return `${baseClasses} ${className}`;
    }
  };

  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };

  if (count === 1) {
    return <div className={getSkeletonClasses()} style={style} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={getSkeletonClasses()} style={style} />
      ))}
    </div>
  );
};

// Specific skeleton components for common use cases
export const TaskSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="card animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="skeleton w-5 h-5 rounded mt-1"></div>
          <div className="flex-1 space-y-3">
            <div className="skeleton skeleton-text w-3/4"></div>
            <div className="skeleton skeleton-text w-1/2"></div>
            <div className="flex space-x-2">
              <div className="skeleton w-16 h-6 rounded-full"></div>
              <div className="skeleton w-20 h-6 rounded-full"></div>
            </div>
          </div>
          <div className="skeleton w-8 h-8 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

export const CalendarSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex justify-between items-center">
        <div className="skeleton skeleton-text w-32"></div>
        <div className="flex space-x-2">
          <div className="skeleton w-8 h-8 rounded-lg"></div>
          <div className="skeleton w-8 h-8 rounded-lg"></div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, index) => (
          <div key={index} className="skeleton h-20 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="space-y-5">
      <div className="skeleton skeleton-text w-24"></div>
      <div className="skeleton h-12 rounded-lg"></div>
      <div className="skeleton skeleton-text w-20"></div>
      <div className="skeleton h-20 rounded-lg"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="skeleton skeleton-text w-16"></div>
          <div className="skeleton h-10 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="skeleton skeleton-text w-12"></div>
          <div className="skeleton h-10 rounded-lg"></div>
        </div>
      </div>
      <div className="skeleton skeleton-button w-32"></div>
    </div>
  </div>
);

export default SkeletonLoader;
