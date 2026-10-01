import { UserRole } from './education.model';

export type InteractionType =
  | 'rating'
  | 'comment'
  | 'reply'
  | 'question'
  | 'answer'
  | 'accept'
  | 'vote'
  | 'follow'
  | 'favorite'
  | 'publish'
  | 'report';

export type TargetType =
  | 'resource'
  | 'comment'
  | 'question'
  | 'answer'
  | 'user'
  | 'course'
  | 'exercise'
  | 'blog';

export interface InteractionPayload {
  stars?: 1 | 2 | 3 | 4 | 5;
  text?: string;
  reason?: string;
  parentCommentId?: string;
  // accept-specific (replaces text/reason abuse)
  threadId?: string;
  answerAuthorId?: string;
}

export interface Interaction {
  id: string;
  type: InteractionType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorAvatar?: string;
  targetType: TargetType;
  targetId: string;
  payload?: InteractionPayload;
  createdAt: string;
}

export interface ResourceInteractionSummary {
  ratingAvg: number;
  ratingCount: number;
  ratingBreakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  favoritesCount: number;
  commentsCount: number;
  votesCount: number;
  isFavorited?: boolean;
  userRating?: number;
}

export interface UserReputationLedger {
  userId: string;
  score: number;
  level: 'Bronze' | 'مساهم نشيط' | 'Expert Certifié';
  acceptedAnswersCount: number;
  usefulVotesCount: number;
  publicationsCount: number;
  followersCount: number;
  badges: string[];
}
