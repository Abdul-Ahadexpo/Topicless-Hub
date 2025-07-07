import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon }) => {
  return (
    <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-5">
      <div className="flex items-center">
        {icon && (
          <div className="mr-4 flex-shrink-0 bg-primary-100 dark:bg-primary-900/20 p-2 rounded-full">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl sm:tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-4xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;