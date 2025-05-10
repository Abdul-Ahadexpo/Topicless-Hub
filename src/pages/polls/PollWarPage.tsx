import React, { useState, useEffect } from 'react';
import { ref, push, onValue, set, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { BarChart, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [gifUrl, setGifUrl] = useState('');
  
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
      
      // Add GIF URL if provided
      if (gifUrl.trim()) {
        pollData.gifUrl = gifUrl.trim();
      }
      
      await set(ref(db, `polls/${pollId}`), pollData);
      
      // Reset form
      setPollQuestion('');
      setPollOptions(['', '']);
      setGifUrl('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating poll:', error);
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
    <div>
      <PageHeader
        title="Poll War"
        description="Create polls, vote, and see results update in real-time."
        icon={<BarChart className="h-6 w-6 text-secondary-600" />}
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
          <div className="card p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Poll</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
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
                <label htmlFor="gifUrl" className="label">
                  GIF URL (optional)
                </label>
                <input
                  id="gifUrl"
                  type="url"
                  value={gifUrl}
                  onChange={(e) => setGifUrl(e.target.value)}
                  placeholder="https://example.com/gif.gif"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a GIF to make your poll more engaging
                </p>
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
                  disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Polls list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Latest Polls</h2>
        
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
              <div key={poll.id} className="card overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{poll.question}</h3>
                      <p className="text-sm text-gray-500">
                        Created by {poll.authorName} • {new Date(poll.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-secondary-50 text-secondary-700 rounded-full px-3 py-1 text-sm">
                      {poll.voteCount} {poll.voteCount === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>

                  {poll.gifUrl && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={poll.gifUrl} 
                        alt="Poll GIF" 
                        className="max-h-64 rounded-lg"
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
                              className={`flex-grow text-left px-3 py-2 rounded-md ${
                                isVoted ? 'bg-secondary-50 text-secondary-800 font-medium' : 'hover:bg-gray-50'
                              }`}
                            >
                              {option.text} {isVoted && '✓'}
                            </button>
                            <span className="text-sm text-gray-600 ml-2 min-w-[40px] text-right">
                              {percentage}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!currentUser && (
                    <div className="mt-4 text-center py-2 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        <a href="/login" className="text-primary-600 font-medium">
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