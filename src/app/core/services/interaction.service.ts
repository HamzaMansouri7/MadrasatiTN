import { Injectable, signal, computed } from '@angular/core';
import {
  Interaction,
  InteractionType,
  TargetType,
  ResourceInteractionSummary,
  UserReputationLedger,
} from '../models/interaction.model';
import { UserRole } from '../models/education.model';

const FAVORITES_STORAGE_KEY = 'madrasati_favorites_v1';
const FOLLOWS_STORAGE_KEY = 'madrasati_follows_v1';
const RATINGS_STORAGE_KEY = 'madrasati_ratings_v1';

@Injectable({
  providedIn: 'root',
})
export class InteractionService {
  // Master log of all local + loaded interactions
  readonly interactions = signal<Interaction[]>([]);

  // Derived sets for instant local UI reactivity
  readonly favoritesSet = signal<Set<string>>(new Set());
  readonly followingSet = signal<Set<string>>(new Set());
  readonly ratingsMap = signal<Map<string, number>>(new Map());

  // Current active user identity placeholder for ledger actor metadata
  readonly currentUserId = signal<string>('usr-current');
  readonly currentUserName = signal<string>('Hamza Mansouri');
  readonly currentUserRole = signal<UserRole>('teacher');

  constructor() {
    this.loadInitialState();
  }

  private loadInitialState() {
    if (typeof localStorage === 'undefined') return;

    try {
      // 1. Load favorites (migrating legacy watchlist if found)
      const storedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        this.favoritesSet.set(new Set(parsed));
      } else {
        const legacyWatchlist = localStorage.getItem('madrasati_watchlist');
        if (legacyWatchlist) {
          const parsed = JSON.parse(legacyWatchlist);
          const legacyItems = [
            ...(parsed.courses || []),
            ...(parsed.exercises || []),
            ...(parsed.teachers || []),
          ];
          this.favoritesSet.set(new Set(legacyItems));
          this.persistFavorites();
        } else {
          // Default demo items
          this.favoritesSet.set(new Set(['c-1', 'c-3', 'ex-1', 't-1']));
        }
      }

      // 2. Load follows
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY);
      if (storedFollows) {
        this.followingSet.set(new Set(JSON.parse(storedFollows)));
      } else {
        this.followingSet.set(new Set(['t-1']));
      }

      // 3. Load ratings
      const storedRatings = localStorage.getItem(RATINGS_STORAGE_KEY);
      if (storedRatings) {
        const entries: [string, number][] = JSON.parse(storedRatings);
        this.ratingsMap.set(new Map(entries));
      }
    } catch (err) {
      console.warn('Failed to load interaction state from localStorage:', err);
    }
  }

  private persistFavorites() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(Array.from(this.favoritesSet()))
    );
  }

  private persistFollows() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      FOLLOWS_STORAGE_KEY,
      JSON.stringify(Array.from(this.followingSet()))
    );
  }

  private persistRatings() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      RATINGS_STORAGE_KEY,
      JSON.stringify(Array.from(this.ratingsMap().entries()))
    );
  }

  // --- ACTIONS ---

  toggleFavorite(targetType: TargetType, targetId: string) {
    const nextFavs = new Set(this.favoritesSet());
    const isAdding = !nextFavs.has(targetId);

    if (isAdding) {
      nextFavs.add(targetId);
    } else {
      nextFavs.delete(targetId);
    }
    this.favoritesSet.set(nextFavs);
    this.persistFavorites();

    this.recordInteraction({
      type: 'favorite',
      targetType,
      targetId,
      payload: { text: isAdding ? 'add' : 'remove' },
    });
  }

  isFavorited(targetId: string): boolean {
    return this.favoritesSet().has(targetId);
  }

  toggleFollow(teacherId: string) {
    const nextFollows = new Set(this.followingSet());
    const isFollowing = !nextFollows.has(teacherId);

    if (isFollowing) {
      nextFollows.add(teacherId);
    } else {
      nextFollows.delete(teacherId);
    }
    this.followingSet.set(nextFollows);
    this.persistFollows();

    this.recordInteraction({
      type: 'follow',
      targetType: 'user',
      targetId: teacherId,
      payload: { text: isFollowing ? 'follow' : 'unfollow' },
    });
  }

  isFollowing(teacherId: string): boolean {
    return this.followingSet().has(teacherId);
  }

  rateResource(targetId: string, stars: 1 | 2 | 3 | 4 | 5, targetType: TargetType = 'resource') {
    const nextRatings = new Map(this.ratingsMap());
    nextRatings.set(targetId, stars);
    this.ratingsMap.set(nextRatings);
    this.persistRatings();

    this.recordInteraction({
      type: 'rating',
      targetType,
      targetId,
      payload: { stars },
    });
  }

  getUserRating(targetId: string): number | undefined {
    return this.ratingsMap().get(targetId);
  }

  addComment(targetType: TargetType, targetId: string, text: string, parentCommentId?: string) {
    return this.recordInteraction({
      type: parentCommentId ? 'reply' : 'comment',
      targetType,
      targetId,
      payload: { text, parentCommentId },
    });
  }

  voteItem(targetType: TargetType, targetId: string) {
    return this.recordInteraction({
      type: 'vote',
      targetType,
      targetId,
    });
  }

  acceptAnswer(threadId: string, answerId: string, targetAuthorId: string) {
    return this.recordInteraction({
      type: 'accept',
      targetType: 'answer',
      targetId: answerId,
      payload: { text: threadId, reason: targetAuthorId },
    });
  }

  reportItem(targetType: TargetType, targetId: string, reason: string) {
    return this.recordInteraction({
      type: 'report',
      targetType,
      targetId,
      payload: { reason },
    });
  }

  private recordInteraction(params: {
    type: InteractionType;
    targetType: TargetType;
    targetId: string;
    payload?: any;
  }): Interaction {
    const newEntry: Interaction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: params.type,
      actorId: this.currentUserId(),
      actorName: this.currentUserName(),
      actorRole: this.currentUserRole(),
      targetType: params.targetType,
      targetId: params.targetId,
      payload: params.payload,
      createdAt: new Date().toISOString(),
    };

    this.interactions.update((list) => [newEntry, ...list]);
    return newEntry;
  }

  // --- DERIVED REPUTATION LEDGER ---
  getReputationScore(userId: string) {
    return computed(() => {
      const allActs = this.interactions();
      let score = 50; // base score
      let accepts = 0;
      let votes = 0;
      let publications = 0;

      for (const act of allActs) {
        if (act.actorId === userId) {
          if (act.type === 'comment' || act.type === 'answer') score += 5;
          if (act.type === 'rating') score += 2;
        }
        if (act.type === 'accept' && act.payload?.reason === userId) {
          score += 15;
          accepts += 1;
        }
        if (act.type === 'vote' && act.targetId === userId) {
          score += 2;
          votes += 1;
        }
      }

      let level: 'Bronze' | 'مساهم نشيط' | 'Expert Certifié' = 'Bronze';
      if (score >= 200) level = 'Expert Certifié';
      else if (score >= 100) level = 'مساهم نشيط';

      const badges: string[] = ['Pédagogue Verified'];
      if (accepts >= 5) badges.push('Répondeur d\'Élite');
      if (score >= 150) badges.push('Top Contributeur');

      const ledger: UserReputationLedger = {
        userId,
        score,
        level,
        acceptedAnswersCount: accepts,
        usefulVotesCount: votes,
        publicationsCount: publications,
        followersCount: this.followingSet().size,
        badges,
      };

      return ledger;
    });
  }
}
