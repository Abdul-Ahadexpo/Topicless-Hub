import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { BookOpen, Youtube, Star, Calendar, User } from 'lucide-react';
import { db } from '../../lib/firebase';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { AdminPost } from '../../lib/types';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    // Fetch admin posts
    const postsRef = ref(db, 'admin_posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const postsList = Object.values(data) as AdminPost[];
        setPosts(postsList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setPosts([]);
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

  const filteredPosts = filter === 'featured' 
    ? posts.filter(post => post.featured)
    : posts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <PageHeader
        title="Blog"
        description="Latest updates, announcements, and featured content from our team."
        icon={<BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
      />

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              filter === 'featured'
                ? 'bg-accent-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <Star size={16} className="mr-1" />
            Featured ({posts.filter(p => p.featured).length})
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <LoadingSpinner text="Loading blog posts..." />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title={filter === 'featured' ? "No featured posts yet" : "No blog posts yet"}
          description={filter === 'featured' ? "Check back later for featured content." : "Check back later for updates and announcements."}
          icon={<BookOpen className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPosts.map((post) => {
            const youtubeId = post.youtubeUrl ? extractYouTubeId(post.youtubeUrl) : null;
            
            return (
              <article 
                key={post.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Featured Badge */}
                {post.featured && (
                  <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2">
                    <div className="flex items-center text-white text-sm font-medium">
                      <Star size={16} className="mr-2" />
                      Featured Post
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Post Header */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <User size={16} className="mr-1" />
                        {post.authorName}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* YouTube Video */}
                  {post.youtubeUrl && (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Youtube size={16} className="mr-2 text-red-500" />
                        Featured Video
                      </div>
                      {youtubeId && (
                        <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700" style={{ paddingBottom: '56.25%' }}>
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
                  )}

                  {/* Post Footer */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Published {new Date(post.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      {post.youtubeUrl && (
                        <a
                          href={post.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center transition-colors"
                        >
                          <Youtube size={16} className="mr-1" />
                          Watch on YouTube
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlogPage;