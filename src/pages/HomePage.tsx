import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart, LightbulbIcon, Scale, Play, BookOpen } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AdminPost } from '../lib/types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [adminPosts, setAdminPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch admin posts
    const adminPostsRef = ref(db, 'admin_posts');
    const unsubscribe = onValue(adminPostsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const postsList = Object.values(data) as AdminPost[];
        setAdminPosts(postsList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)); // Show only latest 3
      } else {
        setAdminPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const features = [
    {
      name: 'Question Storm',
      description: 'Ask questions and share answers in real-time with our community.',
      icon: <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      path: '/questions',
      color: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
    },
    {
      name: 'Poll War',
      description: 'Create polls and see results update instantly. Add images for extra fun!',
      icon: <BarChart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />,
      path: '/polls',
      color: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
    },
    {
      name: 'Daily Idea Drop',
      description: 'Share one creative idea daily and get reactions from others.',
      icon: <LightbulbIcon className="h-6 w-6 text-accent-600 dark:text-accent-400" />,
      path: '/ideas',
      color: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
    },
    {
      name: 'Would You Rather',
      description: 'Create impossible choices and see how others would decide.',
      icon: <Scale className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      path: '/wyr',
      color: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
    },
  ];

  return (
    <div className="space-y-8 md:space-y-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section - Only show if user is not logged in */}
      {!currentUser && (
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-6 md:p-12 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Topicless Hub: Share, Vote & Connect
            </h1>
            <p className="text-base md:text-xl opacity-90 mb-6 md:mb-8">
              A real-time platform for questions, polls, ideas, and impossible choices.
            </p>
            <Link
              to="/login"
              className="btn bg-white text-primary-700 hover:bg-gray-100 px-4 md:px-6 py-2 md:py-3 text-base md:text-lg"
            >
              Get Started
            </Link>
          </div>
        </section>
      )}

      {/* Admin Posts Section */}
      {adminPosts.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 dark:text-white">
              Latest Updates
            </h2>
            <Link 
              to="/blog" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center text-sm md:text-base"
            >
              <BookOpen size={16} className="mr-1" />
              View All Posts
            </Link>
          </div>
          
          {loading ? (
            <LoadingSpinner text="Loading updates..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {adminPosts.map((post) => {
                const youtubeId = post.youtubeUrl ? extractYouTubeId(post.youtubeUrl) : null;
                
                return (
                  <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 dark:text-white line-clamp-2">{post.title}</h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          By {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {post.featured && (
                        <span className="bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="prose prose-sm md:prose max-w-none mb-4">
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 line-clamp-3">{post.content}</p>
                    </div>
                    
                    {youtubeId && (
                      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&iv_load_policy=3&modestbranding=1&rel=0`}
                          title={post.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section>
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4 dark:text-white">
            Our Interactive Features
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Explore our diverse range of tools designed for real-time interaction and engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.path}
              className={`p-4 md:p-6 rounded-lg border ${feature.borderColor} ${feature.color} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start">
                <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg mr-3 md:mr-4 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2 dark:text-white">{feature.name}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section - Only show if user is not logged in */}
      {!currentUser && (
        <section className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 dark:text-white">Ready to Join the Conversation?</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-2xl mx-auto px-4">
            Sign up now to start asking questions, creating polls, sharing ideas, and engaging with our community.
          </p>
          <Link to="/login" className="btn btn-primary px-4 md:px-6 py-2 md:py-3">
            Sign Up Now
          </Link>
        </section>
      )}

      {/* Welcome back section for logged in users */}
      {currentUser && (
        <section className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6 md:p-8 text-center border border-primary-200 dark:border-primary-700">
          <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 dark:text-white">
            Welcome back, {currentUser.displayName || 'User'}!
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
            Ready to continue exploring and sharing with the community?
          </p>
          <Link to="/questions" className="btn btn-primary px-4 md:px-6 py-2 md:py-3">
            Start Exploring
          </Link>
        </section>
      )}
    </div>
  );
};

export default HomePage;