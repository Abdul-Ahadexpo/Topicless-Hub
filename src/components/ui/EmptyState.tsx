import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = <Inbox className="h-12 w-12 text-gray-400" />,
}) => {
  return (
    <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
      <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;