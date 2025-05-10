import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { LightbulbIcon, Sparkles, Shuffle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Idea } from '../../lib/types';

const IdeaDropPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{id: string, name: string, score: number}[]>([]);
  const [randomIdea, setRandomIdea] = useState<Idea | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  useEffect(() => {
    // Fetch ideas
    const ideasRef = ref(db, 'ideas');
    const unsubscribeIdeas = onValue(ideasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ideasList = Object.values(data) as Idea[];
        
        setIdeas(ideasList);
        
        // Check if user has submitted an idea today
        if (currentUser) {
          const userIdeasToday = ideasList.filter(
            idea => idea.authorId === currentUser.uid && idea.date === today
          );
          setHasSubmittedToday(userIdeasToday.length > 0);
        }
        
        // Generate leaderboard
        const authors = new Map<string, {id: string, name: string, score: number}>();
        
        ideasList.forEach(idea => {
          const fireCount = Object.keys(idea.reactions['🔥'] || {}).length;
          const thoughtCount = Object.keys(idea.reactions['💭'] || {}).length;
          const score = fireCount + thoughtCount;
          
          if (authors.has(idea.authorId)) {
            const author = authors.get(idea.authorId)!;
            author.score += score;
          } else {
            authors.set(idea.authorId, {
              id: idea.authorId,
              name: idea.authorName,
              score
            });
          }
        });
        
        // Sort by score and get top 5
        const leaderboardData = Array.from(authors.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
          
        setLeaderboard(leaderboardData);
      } else {
        setIdeas([]);
        setLeaderboard([]);
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribeIdeas();
    };
  }, [currentUser, today]);

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newIdea.trim() || hasSubmittedToday) return;
    
    try {
      const ideaId = uuidv4();
      const ideaData: Idea = {
        id: ideaId,
        text: newIdea.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: Date.now(),
        date: today,
        reactions: {
          '🔥': {},
          '💭': {}
        }
      };
      
      await set(ref(db, `ideas/${ideaId}`), ideaData);
      setNewIdea('');
      setHasSubmittedToday(true);
    } catch (error) {
      console.error('Error submitting idea:', error);
    }
  };

  const handleReaction = async (ideaId: string, reactionType: '🔥' | '💭') => {
    if (!currentUser) return;
    
    try {
      const idea = ideas.find(i => i.id === ideaId);
      if (!idea) return;
      
      const reactionPath = `ideas/${ideaId}/reactions/${reactionType}/${currentUser.uid}`;
      const hasReacted = idea.reactions[reactionType][currentUser.uid];
      
      await set(ref(db, reactionPath), hasReacted ? null : true);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const getRandomIdea = () => {
    if (ideas.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * ideas.length);
    setRandomIdea(ideas[randomIndex]);
  };

  const getSortedIdeas = () => {
    if (sortBy === 'latest') {
      return [...ideas].sort((a, b) => b.createdAt - a.createdAt);
    } else { // popular
      return [...ideas].sort((a, b) => {
        const aReactions = Object.keys(a.reactions['🔥'] || {}).length + Object.keys(a.reactions['💭'] || {}).length;
        const bReactions = Object.keys(b.reactions['🔥'] || {}).length + Object.keys(b.reactions['💭'] || {}).length;
        return bReactions - aReactions;
      });
    }
  };
  
  return (
    <div>
      <PageHeader
        title="Daily Idea Drop"
        description="Share one creative idea per day and get feedback from the community."
        icon={<LightbulbIcon className="h-6 w-6 text-accent-600" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Idea Submission */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Share Your Daily Idea</h2>
            {!currentUser ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">Sign in to share your idea</p>
                <a href="/login" className="text-accent-600 font-medium">
                  Sign In
                </a>
              </div>
            ) : hasSubmittedToday ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">You've already shared your idea today!</p>
                <p className="text-gray-500 text-sm mt-2">Come back tomorrow for a new idea.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitIdea}>
                <div className="mb-4">
                  <label htmlFor="idea" className="label">
                    Your Idea
                  </label>
                  <textarea
                    id="idea"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="Share an innovative idea or creative thought..."
                    className="input h-24"
                  />
                  <p className="text-sm text-gray-500 mt-1">You can submit one idea per day.</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newIdea.trim()}
                    className="btn btn-accent"
                  >
                    <Sparkles size={18} className="mr-2" />
                    Submit Idea
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="md:col-span-1">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Creativity Leaders</h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="ml-2 font-medium">{user.name}</span>
                    </div>
                    <div className="bg-accent-50 text-accent-700 px-2 py-1 rounded-md text-sm">
                      {user.score} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No creativity leaders yet. Be the first to share ideas!
              </p>
            )}
          </div>

          {/* Random Idea Generator */}
          <div className="card p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Surprise Me!</h2>
              <button
                onClick={getRandomIdea}
                disabled={ideas.length === 0}
                className="text-accent-600 hover:text-accent-700"
              >
                <Shuffle size={18} />
              </button>
            </div>
            {randomIdea ? (
              <div className="bg-accent-50 p-3 rounded-lg">
                <p className="italic text-gray-700">{randomIdea.text}</p>
                <p className="text-sm text-gray-500 mt-2">
                  — {randomIdea.authorName}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2 text-sm">
                Click shuffle to see a random idea
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ideas Feed */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Community Ideas</h2>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
              className="bg-white border border-gray-300 rounded-md py-1 px-3 text-sm"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <LoadingSpinner text="Loading ideas..." />
        ) : ideas.length === 0 ? (
          <EmptyState
            title="No ideas yet"
            description="Be the first to share an idea!"
            icon={<LightbulbIcon className="h-12 w-12 text-gray-400" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSortedIdeas().map((idea) => {
              const fireCount = Object.keys(idea.reactions['🔥'] || {}).length;
              const thoughtCount = Object.keys(idea.reactions['💭'] || {}).length;
              const userFired = currentUser && idea.reactions['🔥'][currentUser.uid];
              const userThought = currentUser && idea.reactions['💭'][currentUser.uid];
              
              return (
                <div key={idea.id} className="card p-4">
                  <p className="text-lg">{idea.text}</p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-600">
                      {idea.authorName} • {new Date(idea.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleReaction(idea.id, '🔥')}
                        className={`flex items-center space-x-1 text-sm ${
                          userFired ? 'text-orange-500' : 'text-gray-500'
                        }`}
                        disabled={!currentUser}
                        title="Fire idea"
                      >
                        <span>🔥</span>
                        <span>{fireCount}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(idea.id, '💭')}
                        className={`flex items-center space-x-1 text-sm ${
                          userThought ? 'text-blue-500' : 'text-gray-500'
                        }`}
                        disabled={!currentUser}
                        title="Thought-provoking"
                      >
                        <span>💭</span>
                        <span>{thoughtCount}</span>
                      </button>
                    </div>
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

export default IdeaDropPage;