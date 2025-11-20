import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { Users, TrendingUp } from 'lucide-react';
import { db } from '../../lib/firebase';
import { SubscriberCount as SubscriberCountType } from '../../lib/types';

const SubscriberCount: React.FC = () => {
  const [subscriberData, setSubscriberData] = useState<SubscriberCountType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriberRef = ref(db, 'subscriber_count');
    const unsubscribe = onValue(subscriberRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubscriberData(snapshot.val());
      } else {
        setSubscriberData({ count: 0, updatedAt: Date.now() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-primary-600 dark:to-secondary-600 rounded-xl p-4 text-white kawaii-pulse">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-primary-600 dark:to-secondary-600 rounded-xl p-4 text-white shadow-lg kawaii-float">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 rounded-full p-2 kawaii-bounce">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm opacity-90">Live Subscribers</p>
            <p className="text-2xl font-bold kawaii-wiggle">
              {subscriberData?.count.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        <div className="kawaii-pulse">
          <TrendingUp size={24} className="opacity-80" />
        </div>
      </div>
      <div className="mt-2 text-xs opacity-75">
        Updated: {subscriberData ? new Date(subscriberData.updatedAt).toLocaleDateString() : 'Never'}
      </div>
    </div>
  );
};

export default SubscriberCount;