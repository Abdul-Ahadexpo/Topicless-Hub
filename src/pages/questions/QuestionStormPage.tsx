import React, { useState, useEffect } from 'react';
import { ref, push, onValue, set, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare, Send, ThumbsUp } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Question, Answer, ReactionType } from '../../lib/types';

const QuestionStormPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: Answer[] }>({});
  const [newQuestion, setNewQuestion] = useState('');
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const [anonymous, setAnonymous] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    // Fetch questions
    const questionsRef = ref(db, 'questions');
    const unsubscribeQuestions = onValue(questionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const questionsList = Object.values(data) as Question[];
        setQuestions(questionsList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setQuestions([]);
      }
      setLoading(false);
    });

    // Fetch answers
    const answersRef = ref(db, 'answers');
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const answersMap: { [key: string]: Answer[] } = {};
        
        Object.values(data).forEach((answer: any) => {
          if (!answersMap[answer.questionId]) {
            answersMap[answer.questionId] = [];
          }
          answersMap[answer.questionId].push(answer as Answer);
        });
        
        // Sort answers by createdAt
        Object.keys(answersMap).forEach(questionId => {
          answersMap[questionId].sort((a, b) => b.createdAt - a.createdAt);
        });
        
        setAnswers(answersMap);
      } else {
        setAnswers({});
      }
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeAnswers();
    };
  }, []);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newQuestion.trim()) return;
    
    try {
      const questionId = uuidv4();
      const questionData: Question = {
        id: questionId,
        text: newQuestion.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: Date.now(),
        answerCount: 0,
      };
      
      await set(ref(db, `questions/${questionId}`), questionData);
      setNewQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!currentUser || !answerTexts[questionId]?.trim()) return;
    
    try {
      const answerId = uuidv4();
      const answerData: Answer = {
        id: answerId,
        questionId,
        text: answerTexts[questionId].trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        anonymous: !!anonymous[questionId],
        createdAt: Date.now(),
        reactions: {},
      };
      
      // Update answer in Firebase
      await set(ref(db, `answers/${answerId}`), answerData);
      
      // Update question's answer count
      const question = questions.find(q => q.id === questionId);
      if (question) {
        await update(ref(db, `questions/${questionId}`), {
          answerCount: (question.answerCount || 0) + 1,
        });
      }
      
      // Clear the answer text
      setAnswerTexts(prev => ({ ...prev, [questionId]: '' }));
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleReaction = async (answerId: string, reactionType: ReactionType) => {
    if (!currentUser) return;
    
    try {
      const answerRef = ref(db, `answers/${answerId}/reactions/${reactionType}/${currentUser.uid}`);
      const allAnswers = Object.values(answers).flat();
      const targetAnswer = allAnswers.find(a => a.id === answerId);
      
      if (targetAnswer) {
        const hasReacted = targetAnswer.reactions?.[reactionType]?.[currentUser.uid];
        
        if (hasReacted) {
          // Remove reaction
          await set(answerRef, null);
        } else {
          // Add reaction
          await set(answerRef, true);
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const toggleExpandQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const countReactions = (answer: Answer, type: ReactionType) => {
    if (!answer.reactions || !answer.reactions[type]) {
      return 0;
    }
    return Object.keys(answer.reactions[type]).length;
  };

  const hasUserReacted = (answer: Answer, type: ReactionType) => {
    if (!currentUser || !answer.reactions || !answer.reactions[type]) {
      return false;
    }
    return !!answer.reactions[type][currentUser.uid];
  };

  return (
    <div>
      <PageHeader
        title="Question Storm"
        description="Ask or answer questions, and see responses in real-time."
        icon={<MessageSquare className="h-6 w-6 text-primary-600" />}
      />

      {/* Ask a question form */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
        <form onSubmit={handleSubmitQuestion}>
          <div className="mb-4">
            <label htmlFor="question" className="label">
              Your Question
            </label>
            <textarea
              id="question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={currentUser ? "What's on your mind?" : "Sign in to ask a question"}
              className="input h-24"
              disabled={!currentUser}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!currentUser || !newQuestion.trim()}
              className="btn btn-primary"
            >
              Ask Question
            </button>
          </div>
        </form>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Recent Questions</h2>
        
        {loading ? (
          <LoadingSpinner text="Loading questions..." />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions yet"
            description="Be the first to ask a question!"
            icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="card overflow-visible">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpandQuestion(question.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{question.text}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Asked by {question.authorName} • {new Date(question.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm">
                      {question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}
                    </div>
                  </div>
                </div>

                {expandedQuestion === question.id && (
                  <div className="border-t border-gray-200 p-4">
                    {/* Answers list */}
                    <div className="space-y-4 mb-4">
                      {answers[question.id]?.length > 0 ? (
                        answers[question.id].map((answer) => (
                          <div key={answer.id} className="bg-gray-50 rounded-lg p-3">
                            <p>{answer.text}</p>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-sm text-gray-500">
                                {answer.anonymous ? 'Anonymous' : answer.authorName} • {new Date(answer.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleReaction(answer.id, '🔥')}
                                  className={`flex items-center space-x-1 text-sm ${
                                    hasUserReacted(answer, '🔥') ? 'text-orange-500' : 'text-gray-500'
                                  }`}
                                  disabled={!currentUser}
                                >
                                  <span>🔥</span>
                                  <span>{countReactions(answer, '🔥')}</span>
                                </button>
                                <button
                                  onClick={() => handleReaction(answer.id, '❤️')}
                                  className={`flex items-center space-x-1 text-sm ${
                                    hasUserReacted(answer, '❤️') ? 'text-red-500' : 'text-gray-500'
                                  }`}
                                  disabled={!currentUser}
                                >
                                  <span>❤️</span>
                                  <span>{countReactions(answer, '❤️')}</span>
                                </button>
                                <button
                                  onClick={() => handleReaction(answer.id, '😆')}
                                  className={`flex items-center space-x-1 text-sm ${
                                    hasUserReacted(answer, '😆') ? 'text-yellow-500' : 'text-gray-500'
                                  }`}
                                  disabled={!currentUser}
                                >
                                  <span>😆</span>
                                  <span>{countReactions(answer, '😆')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No answers yet. Be the first to answer!</p>
                      )}
                    </div>

                    {/* Answer form */}
                    {currentUser ? (
                      <div>
                        <div className="flex items-start mt-4">
                          <div className="flex-grow">
                            <textarea
                              value={answerTexts[question.id] || ''}
                              onChange={(e) =>
                                setAnswerTexts((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              placeholder="Share your answer..."
                              className="input h-20"
                            />
                            <div className="flex items-center mt-2">
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                  checked={!!anonymous[question.id]}
                                  onChange={(e) =>
                                    setAnonymous((prev) => ({
                                      ...prev,
                                      [question.id]: e.target.checked,
                                    }))
                                  }
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                  Answer anonymously
                                </span>
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSubmitAnswer(question.id)}
                            disabled={!answerTexts[question.id]?.trim()}
                            className="btn btn-primary ml-3 mt-1"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-2">Sign in to answer this question</p>
                        <a href="/login" className="text-primary-600 font-medium">
                          Sign In
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionStormPage;