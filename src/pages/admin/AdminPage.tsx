import React, { useState, useEffect } from 'react';
import { ref, set, onValue, remove, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Shield, Plus, X, Trash2, Star, Youtube, Upload, Image as ImageIcon, Edit, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { AdminPost, SubscriberCount } from '../../lib/types';

const AdminPage: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<SubscriberCount>({ count: 0, updatedAt: Date.now() });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'youtube' | 'image'>('youtube');
  const [newSubscriberCount, setNewSubscriberCount] = useState('');

  const IMGBB_API_KEY = '2a78816b4b5cc1c4c3b18f8f258eda60';

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

    // Fetch subscriber count
    const subscriberRef = ref(db, 'subscriber_count');
    onValue(subscriberRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubscriberCount(snapshot.val());
        setNewSubscriberCount(snapshot.val().count.toString());
      } else {
        const defaultCount = { count: 0, updatedAt: Date.now() };
        setSubscriberCount(defaultCount);
        setNewSubscriberCount('0');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 32 * 1024 * 1024) { // 32MB limit
        alert('Image size must be less than 32MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.data.url;
  };

  const handleEditPost = (post: AdminPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setYoutubeUrl(post.youtubeUrl || '');
    setFeatured(post.featured);
    setUploadType(post.youtubeUrl ? 'youtube' : 'image');
    if (post.imageUrl) {
      setImagePreview(post.imageUrl);
    }
    setShowCreateForm(true);
  };

  const handleUpdateSubscriberCount = async () => {
    try {
      const count = parseInt(newSubscriberCount);
      if (isNaN(count) || count < 0) {
        alert('Please enter a valid number');
        return;
      }
      
      const subscriberData: SubscriberCount = {
        count,
        updatedAt: Date.now(),
      };
      
      await set(ref(db, 'subscriber_count'), subscriberData);
      alert('Subscriber count updated successfully!');
    } catch (error) {
      console.error('Error updating subscriber count:', error);
      alert('Failed to update subscriber count');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;
    
    try {
      setUploading(true);
      
      const postId = editingPost ? editingPost.id : uuidv4();
      let postData: Partial<AdminPost> = {
        title: title.trim(),
        content: content.trim(),
        featured,
      };
      
      if (!editingPost) {
        postData = {
          ...postData,
          id: postId,
          authorId: 'admin',
          authorName: 'Admin',
          createdAt: Date.now(),
        };
      }

      // Handle media upload based on type
      if (uploadType === 'youtube' && youtubeUrl.trim()) {
        (postData as AdminPost).youtubeUrl = youtubeUrl.trim();
        // Remove imageUrl if switching to YouTube
        if (editingPost && editingPost.imageUrl) {
          (postData as any).imageUrl = null;
        }
      } else if (uploadType === 'image' && selectedImage) {
        const imageUrl = await uploadImageToImgBB(selectedImage);
        (postData as AdminPost).imageUrl = imageUrl;
        // Remove youtubeUrl if switching to image
        if (editingPost && editingPost.youtubeUrl) {
          (postData as any).youtubeUrl = null;
        }
      } else if (uploadType === 'image' && imagePreview && editingPost) {
        // Keep existing image
        (postData as AdminPost).imageUrl = editingPost.imageUrl;
      }
      
      if (editingPost) {
        await update(ref(db, `admin_posts/${postId}`), postData);
      } else {
        await set(ref(db, `admin_posts/${postId}`), postData);
      }
      
      // Reset form
      setEditingPost(null);
      setTitle('');
      setContent('');
      setYoutubeUrl('');
      setSelectedImage(null);
      setImagePreview('');
      setFeatured(false);
      setUploadType('youtube');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setUploading(false);
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
        title="Admin Panel 🎀"
        description="Manage admin posts, subscriber count, and announcements"
        icon={<Shield className="h-6 w-6 text-accent-600 dark:text-accent-400" />}
      />

      {/* Subscriber Count Management */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 kawaii-card">
        <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center kawaii-wiggle">
          <Users className="mr-2" size={20} />
          Subscriber Count Management
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="subscriberCount" className="label">
              Current Count: {subscriberCount.count.toLocaleString()}
            </label>
            <input
              id="subscriberCount"
              type="number"
              value={newSubscriberCount}
              onChange={(e) => setNewSubscriberCount(e.target.value)}
              placeholder="Enter new subscriber count"
              className="input"
              min="0"
            />
          </div>
          <button
            onClick={handleUpdateSubscriberCount}
            className="btn btn-secondary kawaii-bounce"
          >
            Update Count
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Last updated: {new Date(subscriberCount.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* Create post button/form */}
      <div className="mb-8">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center kawaii-bounce"
          >
            <Plus size={18} className="mr-2" /> 
            Create New Post ✨
          </button>
        ) : (
          <div className="card p-6 animate-fade-in kawaii-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white kawaii-wiggle">
                {editingPost ? 'Edit Admin Post 📝' : 'Create New Admin Post ✨'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPost(null);
                  setTitle('');
                  setContent('');
                  setYoutubeUrl('');
                  setSelectedImage(null);
                  setImagePreview('');
                  setFeatured(false);
                  setUploadType('youtube');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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

              {/* Media Type Selection */}
              <div className="mb-4">
                <label className="label">Media Type</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-600 dark:bg-gray-700 dark:border-gray-600"
                      name="uploadType"
                      value="youtube"
                      checked={uploadType === 'youtube'}
                      onChange={(e) => setUploadType(e.target.value as 'youtube' | 'image')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                      <Youtube size={16} className="mr-1" />
                      YouTube Video
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-600 dark:bg-gray-700 dark:border-gray-600"
                      name="uploadType"
                      value="image"
                      checked={uploadType === 'image'}
                      onChange={(e) => setUploadType(e.target.value as 'youtube' | 'image')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                      <ImageIcon size={16} className="mr-1" />
                      Image/GIF
                    </span>
                  </label>
                </div>
              </div>

              {/* YouTube URL Input */}
              {uploadType === 'youtube' && (
                <div className="mb-4">
                  <label htmlFor="youtubeUrl" className="label">
                    YouTube URL
                  </label>
                  <input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="input"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Add a YouTube video to embed in the post
                  </p>
                </div>
              )}

              {/* Image Upload */}
              {uploadType === 'image' && (
                <div className="mb-4">
                  <label className="label">Upload Image/GIF</label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Upload size={16} className="mr-2" />
                      Choose Image/GIF
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload an image or GIF to display in the post (max 32MB)
                    </p>
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview('');
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-accent-600 shadow-sm focus:border-accent-300 focus:ring focus:ring-accent-200 focus:ring-opacity-50 dark:bg-gray-700"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Mark as featured post
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPost(null);
                    setTitle('');
                    setContent('');
                    setYoutubeUrl('');
                    setSelectedImage(null);
                    setImagePreview('');
                    setFeatured(false);
                    setUploadType('youtube');
                  }}
                  className="btn btn-outline"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary kawaii-bounce"
                  disabled={!title.trim() || !content.trim() || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editingPost ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingPost ? 'Update Post' : 'Create Post'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Posts list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white kawaii-wiggle">Admin Posts 📚</h2>
        
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
                <div key={post.id} className="card p-6 kawaii-card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-lg mr-2 dark:text-white">{post.title}</h3>
                        {post.featured && (
                          <span className="bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Star size={12} className="mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                      
                      {/* YouTube Video */}
                      {post.youtubeUrl && youtubeId && (
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Youtube size={16} className="mr-1" />
                            YouTube Video Attached
                          </div>
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
                        </div>
                      )}

                      {/* Image/GIF */}
                      {post.imageUrl && (
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <ImageIcon size={16} className="mr-1" />
                            Image Attached
                          </div>
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 ml-2 kawaii-bounce"
                      title="Edit post"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-gray-400 hover:text-error-600 dark:hover:text-error-400 ml-2"
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