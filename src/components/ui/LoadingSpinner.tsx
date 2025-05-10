import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className={`${sizeClasses[size]} rounded-full border-t-primary-500 border-r-primary-200 border-b-primary-200 border-l-primary-200 animate-spin`}
      ></div>
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;