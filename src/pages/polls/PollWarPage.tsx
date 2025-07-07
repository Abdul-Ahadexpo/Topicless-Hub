import React, { useState, useEffect } from 'react';
import { ref, push, onValue, set, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { BarChart, Plus, X, ChevronUp, ChevronDown, Upload, Image as ImageIcon } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Poll, PollOption, Vote } from '../../lib/types';

const PollWarPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  
  // Create new poll state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const IMGBB_API_KEY = '80e36fc64660321209fefca92146c6f0';

  useEffect(() => {
    // Fetch polls
    const pollsRef = ref(db, 'polls');
    const unsubscribePolls = onValue(pollsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pollsList = Object.values(data) as Poll[];
        setPolls(pollsList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setPolls([]);
      }
      setLoading(false);
    });

    // Fetch user votes if user is logged in
    const fetchUserVotes = () => {
      if (!currentUser) {
        setUserVotes({});
        return;
      }
      
      const votesRef = ref(db, 'votes');
      onValue(votesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userVoteMap: { [key: string]: string } = {};
          
          Object.values(data).forEach((vote: any) => {
            if (vote.userId === currentUser.uid) {
              userVoteMap[vote.pollId] = vote.optionId;
            }
          });
          
          setUserVotes(userVoteMap);
        }
      });
    };

    fetchUserVotes();
    
    return () => {
      unsubscribePolls();
    };
  }, [currentUser]);

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

  const handleAddOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !pollQuestion.trim()) return;
    
    // Filter out empty options
    const validOptions = pollOptions.filter(option => option.trim());
    
    if (validOptions.length < 2) {
      alert('Please add at least 2 options');
      return;
    }
    
    try {
      setUploading(true);
      
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImageToImgBB(selectedImage);
      }
      
      const pollId = uuidv4();
      const optionsData: PollOption[] = validOptions.map(option => ({
        id: uuidv4(),
        text: option.trim(),
        voteCount: 0,
      }));
      
      const pollData: Poll = {
        id: pollId,
        question: pollQuestion.trim(),
        options: optionsData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: Date.now(),
        voteCount: 0,
      };
      
      // Add image URL if uploaded
      if (imageUrl) {
        pollData.gifUrl = imageUrl;
      }
      
      await set(ref(db, `polls/${pollId}`), pollData);
      
      // Reset form
      setPollQuestion('');
      setPollOptions(['', '']);
      setSelectedImage(null);
      setImagePreview('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;
      
      const previousVote = userVotes[pollId];
      const voteId = `${pollId}_${currentUser.uid}`;
      
      // Create vote data
      const voteData: Vote = {
        pollId,
        optionId,
        userId: currentUser.uid,
        createdAt: Date.now(),
      };
      
      // Update the vote in Firebase
      await set(ref(db, `votes/${voteId}`), voteData);
      
      // Update poll vote counts
      const updatedOptions = [...poll.options];
      
      // If user already voted for a different option, decrement that count
      if (previousVote && previousVote !== optionId) {
        const prevOptionIndex = updatedOptions.findIndex(o => o.id === previousVote);
        if (prevOptionIndex !== -1) {
          updatedOptions[prevOptionIndex] = {
            ...updatedOptions[prevOptionIndex],
            voteCount: Math.max(0, (updatedOptions[prevOptionIndex].voteCount || 0) - 1),
          };
        }
      }
      
      // Increment the count for the selected option
      const optionIndex = updatedOptions.findIndex(o => o.id === optionId);
      if (optionIndex !== -1) {
        // If this is a new vote or changing vote
        if (!previousVote || previousVote !== optionId) {
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            voteCount: (updatedOptions[optionIndex].voteCount || 0) + 1,
          };
        }
      }
      
      // Update total vote count
      const totalVotes = !previousVote 
        ? (poll.voteCount || 0) + 1 
        : poll.voteCount || 0;
      
      // Update poll in Firebase
      await update(ref(db, `polls/${pollId}`), {
        options: updatedOptions,
        voteCount: totalVotes,
      });
      
      // Update local state
      setUserVotes({ ...userVotes, [pollId]: optionId });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const calculatePercentage = (optionVotes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <PageHeader
        title="Poll War"
        description="Create polls, vote, and see results update in real-time."
        icon={<BarChart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />}
      />

      {/* Create poll button/form */}
      <div className="mb-8">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
            disabled={!currentUser}
          >
            <Plus size={18} className="mr-2" /> 
            Create New Poll
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Create New Poll</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePoll}>
              <div className="mb-4">
                <label htmlFor="pollQuestion" className="label">
                  Poll Question
                </label>
                <input
                  id="pollQuestion"
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="What do you want to ask?"
                  className="input"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="label">Options</label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="input mr-2"
                      required
                    />
                    {index >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-gray-500 hover:text-error-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center mt-2"
                >
                  <Plus size={16} className="mr-1" /> Add Option
                </button>
              </div>
              
              <div className="mb-6">
                <label className="label">
                  Poll Image (optional)
                </label>
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
                    Choose Image
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload an image to make your poll more engaging (max 32MB)
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
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-outline"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2 || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Poll'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Polls list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Latest Polls</h2>
        
        {loading ? (
          <LoadingSpinner text="Loading polls..." />
        ) : polls.length === 0 ? (
          <EmptyState
            title="No polls yet"
            description="Be the first to create a poll!"
            icon={<BarChart className="h-12 w-12 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-4xl">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg dark:text-white">{poll.question}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created by {poll.authorName} • {new Date(poll.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 rounded-full px-3 py-1 text-sm">
                      {poll.voteCount} {poll.voteCount === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>

                  {poll.gifUrl && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={poll.gifUrl} 
                        alt="Poll Image" 
                        className="max-h-64 max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = calculatePercentage(option.voteCount || 0, poll.voteCount || 0);
                      const isVoted = userVotes[poll.id] === option.id;
                      
                      return (
                        <div key={option.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => handleVote(poll.id, option.id)}
                              disabled={!currentUser}
                              className={`flex-grow text-left px-3 py-2 rounded-md transition-colors ${
                                isVoted 
                                  ? 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-200 font-medium' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {option.text} {isVoted && '✓'}
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 min-w-[40px] text-right">
                              {percentage}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary-500 dark:bg-secondary-400 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!currentUser && (
                    <div className="mt-4 text-center py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <a href="/login" className="text-primary-600 dark:text-primary-400 font-medium">
                          Sign in
                        </a> to vote on this poll
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollWarPage;