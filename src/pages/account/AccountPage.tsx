import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { MessageSquare, BarChart, LightbulbIcon, Scale, Trash2, User } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import AuthRequired from '../../components/ui/AuthRequired';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Question, Poll, Idea, WouldYouRather } from '../../lib/types';

const AccountPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [wyrQuestions, setWyrQuestions] = useState<WouldYouRather[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = () => {
      setLoading(true);

      // Fetch user's questions
      const questionsRef = ref(db, 'questions');
      onValue(questionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userQuestions = Object.values(data)
            .filter((question: any) => question.authorId === currentUser.uid)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);
          setQuestions(userQuestions as Question[]);
        } else {
          setQuestions([]);
        }
      });

      // Fetch user's polls
      const pollsRef = ref(db, 'polls');
      onValue(pollsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userPolls = Object.values(data)
            .filter((poll: any) => poll.authorId === currentUser.uid)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);
          setPolls(userPolls as Poll[]);
        } else {
          setPolls([]);
        }
      });

      // Fetch user's ideas
      const ideasRef = ref(db, 'ideas');
      onValue(ideasRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userIdeas = Object.values(data)
            .filter((idea: any) => idea.authorId === currentUser.uid)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);
          setIdeas(userIdeas as Idea[]);
        } else {
          setIdeas([]);
        }
      });

      // Fetch user's would you rather questions
      const wyrRef = ref(db, 'wyr_questions');
      onValue(wyrRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userWyr = Object.values(data)
            .filter((wyr: any) => wyr.authorId === currentUser.uid)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);
          setWyrQuestions(userWyr as WouldYouRather[]);
        } else {
          setWyrQuestions([]);
        }
      });

      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  const handleDelete = async (type: string, id: string) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      let path = '';
      switch (type) {
        case 'question':
          path = `questions/${id}`;
          break;
        case 'poll':
          path = `polls/${id}`;
          break;
        case 'idea':
          path = `ideas/${id}`;
          break;
        case 'wyr':
          path = `wyr_questions/${id}`;
          break;
        default:
          return;
      }
      
      await remove(ref(db, path));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <AuthRequired>
      <PageHeader
        title="My Account"
        description="View and manage all your content"
        icon={<User className="h-6 w-6 text-primary-600" />}
      />

      {loading ? (
        <LoadingSpinner text="Loading your content..." />
      ) : (
        <div>
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'questions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Questions
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {questions.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('polls')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'polls'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart className="mr-2 h-5 w-5" />
                Polls
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {polls.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('ideas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'ideas'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LightbulbIcon className="mr-2 h-5 w-5" />
                Ideas
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {ideas.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('wyr')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'wyr'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Scale className="mr-2 h-5 w-5" />
                Would You Rather
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {wyrQuestions.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            {activeTab === 'questions' && (
              <>
                {questions.length === 0 ? (
                  <EmptyState
                    title="No questions yet"
                    description="You haven't asked any questions yet."
                    icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="card p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{question.text}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(question.createdAt).toLocaleDateString()} • {question.answerCount} answers
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete('question', question.id)}
                            className="text-gray-400 hover:text-error-600"
                            title="Delete question"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'polls' && (
              <>
                {polls.length === 0 ? (
                  <EmptyState
                    title="No polls yet"
                    description="You haven't created any polls yet."
                    icon={<BarChart className="h-12 w-12 text-gray-400" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => (
                      <div key={poll.id} className="card p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{poll.question}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(poll.createdAt).toLocaleDateString()} • {poll.voteCount} votes
                            </p>
                            <div className="mt-2 space-y-1">
                              {poll.options.map((option) => (
                                <div key={option.id} className="text-sm">
                                  {option.text} ({option.voteCount} votes)
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete('poll', poll.id)}
                            className="text-gray-400 hover:text-error-600"
                            title="Delete poll"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'ideas' && (
              <>
                {ideas.length === 0 ? (
                  <EmptyState
                    title="No ideas yet"
                    description="You haven't shared any ideas yet."
                    icon={<LightbulbIcon className="h-12 w-12 text-gray-400" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {ideas.map((idea) => (
                      <div key={idea.id} className="card p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{idea.text}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(idea.createdAt).toLocaleDateString()}
                            </p>
                            <div className="mt-2 flex space-x-4">
                              <span className="text-sm flex items-center">
                                🔥 {Object.keys(idea.reactions['🔥'] || {}).length}
                              </span>
                              <span className="text-sm flex items-center">
                                💭 {Object.keys(idea.reactions['💭'] || {}).length}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete('idea', idea.id)}
                            className="text-gray-400 hover:text-error-600"
                            title="Delete idea"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'wyr' && (
              <>
                {wyrQuestions.length === 0 ? (
                  <EmptyState
                    title="No 'Would You Rather' questions yet"
                    description="You haven't created any 'Would You Rather' questions yet."
                    icon={<Scale className="h-12 w-12 text-gray-400" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {wyrQuestions.map((wyr) => (
                      <div key={wyr.id} className="card p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">Would you rather...</h3>
                            <div className="mt-2 space-y-2">
                              <p>A: {wyr.optionA} ({wyr.votesA} votes)</p>
                              <p>B: {wyr.optionB} ({wyr.votesB} votes)</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(wyr.createdAt).toLocaleDateString()} • {wyr.comments?.length || 0} comments
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete('wyr', wyr.id)}
                            className="text-gray-400 hover:text-error-600"
                            title="Delete question"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AuthRequired>
  );
};

export default AccountPage;
