import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock } from 'lucide-react';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-pulse-slow">
          <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
            <div className="h-6 w-6 bg-white rounded-full"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
            <Lock className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-6">
            You need to be logged in to access this content.
          </p>
          <Navigate to="/login" state={{ from: location }} replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRequired;