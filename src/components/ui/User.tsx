import React from 'react';
import { UserIcon } from 'lucide-react';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const User: React.FC<UserAvatarProps> = ({ photoURL, displayName, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (photoURL) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200`}>
        <img src={photoURL} alt={displayName || 'User'} className="h-full w-full object-cover" />
      </div>
    );
  }

  // If no photo URL, use initials or user icon
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  return (
    <div
      className={`${
        sizeClasses[size]
      } rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium`}
    >
      {initials || <UserIcon className="h-1/2 w-1/2" />}
    </div>
  );
};

export default User;