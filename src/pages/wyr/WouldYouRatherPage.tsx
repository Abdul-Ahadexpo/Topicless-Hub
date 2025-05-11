import React, { useState, useEffect } from 'react';
import { ref, push, onValue, set, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Scale, MessageSquare, Send, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { WouldYouRather, WyrVote, Comment } from '../../lib/types';

const WouldYouRatherPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<WouldYouRather[]>([]);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'A' | 'B' }>({});
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});
  
  // Create new question state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  useEffect(() => {
    // Fetch questions
    const questionsRef = ref(db, 'wyr_questions');
    const unsubscribeQuestions = onValue(questionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const questionsList = Object.values(data) as WouldYouRather[];
        setQuestions(questionsList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setQuestions([]);
      }
      setLoading(false);
    });

    // Fetch user votes if user is logged in
    const fetchUserVotes = () => {
      if (!currentUser) {
        setUserVotes({});
        return;
      }
      
      const votesRef = ref(db, 'wyr_votes');
      onValue(votesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userVoteMap: { [key: string]: 'A' | 'B' } = {};
          
          Object.values(data).forEach((vote: any) => {
            if (vote.userId === currentUser.uid) {
              userVoteMap[vote.questionId] = vote.choice;
            }
          });
          
          setUserVotes(userVoteMap);
        }
      });
    };

    fetchUserVotes();
    
    return () => {
      unsubscribeQuestions();
    };
  }, [currentUser]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !optionA.trim() || !optionB.trim()) return;
    
    try {
      const questionId = uuidv4();
      const questionData: WouldYouRather = {
        id: questionId,
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: Date.now(),
        votesA: 0,
        votesB: 0,
        comments: [],
      };
      
      await set(ref(db, `wyr_questions/${questionId}`), questionData);
      
      // Reset form
      setOptionA('');
      setOptionB('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleVote = async (questionId: string, choice: 'A' | 'B') => {
    if (!currentUser) return;
    
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const previousVote = userVotes[questionId];
      const voteId = `${questionId}_${currentUser.uid}`;
      
      // Create vote data
      const voteData: WyrVote = {
        questionId,
        choice,
        userId: currentUser.uid,
        createdAt: Date.now(),
      };
      
      // Update the vote in Firebase
      await set(ref(db, `wyr_votes/${voteId}`), voteData);
      
      // Update vote counts in the question
      let updatedVotesA = question.votesA;
      let updatedVotesB = question.votesB;
      
      if (!previousVote) {
        // First vote
        if (choice === 'A') updatedVotesA++;
        else updatedVotesB++;
      } else if (previousVote !== choice) {
        // Changed vote
        if (choice === 'A') {
          updatedVotesA++;
          updatedVotesB = Math.max(0, updatedVotesB - 1);
        } else {
          updatedVotesB++;
          updatedVotesA = Math.max(0, updatedVotesA - 1);
        }
      }
      
      // Update question in Firebase
      await update(ref(db, `wyr_questions/${questionId}`), {
        votesA: updatedVotesA,
        votesB: updatedVotesB,
      });
      
      // Update local state
      setUserVotes({ ...userVotes, [questionId]: choice });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitComment = async (questionId: string) => {
    if (!currentUser || !commentTexts[questionId]?.trim() || !userVotes[questionId]) return;
    
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const commentId = uuidv4();
      const commentData: Comment = {
        id: commentId,
        questionId,
        text: commentTexts[questionId].trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: Date.now(),
        choice: userVotes[questionId],
      };
      
      // Add comment to the question's comments array
      const updatedComments = [...(question.comments || []), commentData];
      
      // Update question in Firebase
      await update(ref(db, `wyr_questions/${questionId}/comments`), updatedComments);
      
      // Clear the comment text
      setCommentTexts(prev => ({ ...prev, [questionId]: '' }));
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const toggleExpandQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div>
      <PageHeader
        title="Would You Rather"
        description="Create and vote on difficult choices, then explain your reasoning."
        icon={<Scale className="h-6 w-6 text-primary-600" />}
      />

      {/* Create question button/form */}
      <div className="mb-8">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
            disabled={!currentUser}
          >
            <Plus size={18} className="mr-2" /> 
            Create New Question
          </button>
        ) : (
          <div className="card p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create "Would You Rather" Question</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateQuestion}>
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Would you rather...</h3>
              </div>
              
              <div className="mb-4">
                <label htmlFor="optionA" className="label">
                  Option A
                </label>
                <input
                  id="optionA"
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="First option"
                  className="input"
                  required
                />
              </div>
              
              <div className="text-center my-2">
                <span className="text-gray-500">OR</span>
              </div>
              
              <div className="mb-6">
                <label htmlFor="optionB" className="label">
                  Option B
                </label>
                <input
                  id="optionB"
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Second option"
                  className="input"
                  required
                />
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
                  disabled={!optionA.trim() || !optionB.trim()}
                >
                  Create Question
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Choose Wisely</h2>
        
        {loading ? (
          <LoadingSpinner text="Loading questions..." />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions yet"
            description="Be the first to create a 'Would You Rather' question!"
            icon={<Scale className="h-12 w-12 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {questions.map((question) => {
              const totalVotes = question.votesA + question.votesB;
              const percentA = calculatePercentage(question.votesA, totalVotes);
              const percentB = calculatePercentage(question.votesB, totalVotes);
              const userVote = userVotes[question.id];
              
              return (
                <div key={question.id} className="card overflow-visible">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-medium text-lg">Would you rather...</h3>
                        <p className="text-sm text-gray-500">
                          Created by {question.authorName} • {new Date(question.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm">
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Option A */}
                      <button
                        onClick={() => handleVote(question.id, 'A')}
                        disabled={!currentUser}
                        className={`p-4 rounded-lg text-center transition-all ${
                          userVote === 'A'
                            ? 'bg-primary-100 border-2 border-primary-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium mb-2">{question.optionA}</p>
                        {userVote && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary-600 h-2.5 rounded-full"
                                style={{ width: `${percentA}%` }}
                              ></div>
                            </div>
                            <p className="text-sm mt-1">
                              {percentA}% ({question.votesA} votes)
                            </p>
                          </div>
                        )}
                      </button>

                      {/* Option B */}
                      <button
                        onClick={() => handleVote(question.id, 'B')}
                        disabled={!currentUser}
                        className={`p-4 rounded-lg text-center transition-all ${
                          userVote === 'B'
                            ? 'bg-primary-100 border-2 border-primary-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium mb-2">{question.optionB}</p>
                        {userVote && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary-600 h-2.5 rounded-full"
                                style={{ width: `${percentB}%` }}
                              ></div>
                            </div>
                            <p className="text-sm mt-1">
                              {percentB}% ({question.votesB} votes)
                            </p>
                          </div>
                        )}
                      </button>
                    </div>

                    {!currentUser ? (
                      <div className="text-center py-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">
                          <a href="/login" className="text-primary-600 font-medium">
                            Sign in
                          </a> to vote and comment
                        </p>
                      </div>
                    ) : !userVote ? (
                      <p className="text-center text-sm text-gray-600">
                        Vote to see results and leave a comment
                      </p>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleExpandQuestion(question.id)}
                          className="flex items-center justify-center w-full py-2 text-primary-600 hover:text-primary-700"
                        >
                          <MessageSquare size={18} className="mr-2" />
                          {question.comments?.length || 0} comments
                          {expandedQuestion === question.id ? (
                            <ChevronUp size={18} className="ml-2" />
                          ) : (
                            <ChevronDown size={18} className="ml-2" />
                          )}
                        </button>

                        {expandedQuestion === question.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Comments list */}
                            {question.comments && question.comments.length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {question.comments.map((comment) => (
                                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                    <p>{comment.text}</p>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-500">
                                        {comment.authorName} • {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        comment.choice === 'A'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        Chose {comment.choice === 'A' ? 'First' : 'Second'} Option
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
                            )}

                            {/* Comment form */}
                            <div className="flex items-start mt-4">
                              <div className="flex-grow">
                                <textarea
                                  value={commentTexts[question.id] || ''}
                                  onChange={(e) =>
                                    setCommentTexts((prev) => ({
                                      ...prev,
                                      [question.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Share why you chose this option..."
                                  className="input h-20"
                                />
                              </div>
                              <button
                                onClick={() => handleSubmitComment(question.id)}
                                disabled={!commentTexts[question.id]?.trim()}
                                className="btn btn-primary ml-3 mt-1"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

export default WouldYouRatherPage;
