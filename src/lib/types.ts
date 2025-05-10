// User related types
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  streakCount?: number;
  lastActiveDate?: string;
}

// Question Storm types
export interface Question {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  answerCount: number;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  authorId: string;
  authorName: string;
  anonymous: boolean;
  createdAt: number;
  reactions: {
    [key: string]: boolean; // userId: hasReacted
  };
}

export type ReactionType = '🔥' | '❤️' | '😆';

// Poll War types
export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  authorId: string;
  authorName: string;
  createdAt: number;
  voteCount: number;
  gifUrl?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Vote {
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: number;
}

// Daily Idea types
export interface Idea {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  date: string; // YYYY-MM-DD format
  reactions: {
    '🔥': { [userId: string]: boolean };
    '💭': { [userId: string]: boolean };
  };
}

// Would You Rather types
export interface WouldYouRather {
  id: string;
  optionA: string;
  optionB: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  votesA: number;
  votesB: number;
  comments: Comment[];
}

export interface WyrVote {
  questionId: string;
  choice: 'A' | 'B';
  userId: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  questionId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  choice: 'A' | 'B';
}