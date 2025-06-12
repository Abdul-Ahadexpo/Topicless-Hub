import React, { useState, useEffect } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Shield, Plus, X, Trash2, Star, Youtube } from 'lucide-react';
import { db } from '../../lib/firebase';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { AdminPost } from '../../lib/types';

const AdminPage: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [featured, setFeatured] = useState(false);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;
    
    try {
      const postId = uuidv4();
      const postData: AdminPost = {
        id: postId,
        title: title.trim(),
        content: content.trim(),
        youtubeUrl: youtubeUrl.trim() || undefined,
        authorId: 'admin',
        authorName: 'Admin',
        createdAt: Date.now(),
        featured,
      };
      
      await set(ref(db, `admin_posts/${postId}`), postData);
      
      // Reset form
      setTitle('');
      setContent('');
      setYoutubeUrl('');
      setFeatured(false);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await remove(ref(db, `admin_posts/${postId}`));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Manage admin posts and announcements"
        icon={<Shield className="h-6 w-6 text-accent-600" />}
      />

      {/* Create post button/form */}
      <div className="mb-8">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={18} className="mr-2" /> 
            Create New Post
          </button>
        ) : (
          <div className="card p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Admin Post</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <label htmlFor="title" className="label">
                  Post Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  className="input"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="content" className="label">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content..."
                  className="input h-32"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="youtubeUrl" className="label">
                  YouTube URL (optional)
                </label>
                <input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a YouTube video to embed in the post
                </p>
              </div>
              
              <div className="mb-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-accent-600 shadow-sm focus:border-accent-300 focus:ring focus:ring-accent-200 focus:ring-opacity-50"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Mark as featured post
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!title.trim() || !content.trim()}
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Posts list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Admin Posts</h2>
        
        {loading ? (
          <LoadingSpinner text="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="Create your first admin post to get started."
            icon={<Shield className="h-12 w-12 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const youtubeId = post.youtubeUrl ? extractYouTubeId(post.youtubeUrl) : null;
              
              return (
                <div key={post.id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-lg mr-2">{post.title}</h3>
                        {post.featured && (
                          <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Star size={12} className="mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-700 mb-4">{post.content}</p>
                      
                      {post.youtubeUrl && (
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Youtube size={16} className="mr-1" />
                            YouTube Video Attached
                          </div>
                          {youtubeId && (
                            <div className="relative w-full max-w-md" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
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
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-gray-400 hover:text-error-600 ml-4"
                      title="Delete post"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;