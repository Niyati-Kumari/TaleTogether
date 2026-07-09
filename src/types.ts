export const GENRES = [
  "Personal",
  "Memoir",
  "Fantasy",
  "Romance",
  "Adventure",
  "Poetry",
  "Sci-Fi",
  "Horror",
] as const;

export type Genre = (typeof GENRES)[number];
export type Visibility = "public" | "private";
export type StoryFormat = "Biography" | "Novel" | "Movie Script" | "Poem";
export type AiAssistAction = "opening" | "ending" | "polish" | "character";
export type SubscriptionTier = "free" | "premium";
export type PremiumFeature = "ad-free" | "early-access" | "exclusive-challenges" | "ai-assist-unlimited";

export interface Chapter {
  title: string;
  content: string;
}

export interface StoryStats {
  likes: number;
  comments: number;
  reads: number;
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  genre: Genre;
  tags: string[];
  authorId: string;
  coverStyle: string;
  coverImageUrl?: string;
  publishedAt: string;
  visibility: Visibility;
  isPersonal: boolean;
  challenge?: string;
  chapters: Chapter[];
  stats: StoryStats;
  estimatedMinutes: number;
  isPremium?: boolean;
  price?: number;
  tipsReceived?: number;
}

export interface Author {
  id: string;
  name: string;
  handle: string;
  bio: string;
  level: string;
  avatar: string;
  followers: number;
  readers: number;
  achievements: string[];
  focusGenres: Genre[];
  subscriptionTier?: SubscriptionTier;
  totalEarnings?: number;
}

export interface Comment {
  id: string;
  storyId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  cadence: string;
  title: string;
  prompt: string;
  prize: string;
}

export interface StoryDraft {
  title: string;
  summary: string;
  genre: Genre;
  tags: string[];
  coverStyle: string;
  coverImageUrl?: string;
  visibility: Visibility;
  isPersonal: boolean;
  challenge: string;
  chapters: Chapter[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  features: PremiumFeature[];
}

export interface Tip {
  id: string;
  storyId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message?: string;
  createdAt: string;
}

export interface BootstrapData {
  user: Author | null;
  authors: Author[];
  stories: Story[];
  comments: Comment[];
  likes: string[];
  follows: string[];
  preferences: Genre[];
  streak: number;
  challenges: Challenge[];
  subscriptionPlans?: SubscriptionPlan[];
}

export interface WritingScore {
  creativity: number;
  grammar: number;
  emotion: number;
  flow: number;
  vocabulary: number;
  wordCount: number;
  level: string;
  suggestions: string[];
}

export interface AuthResponse {
  token: string;
  user: Author;
}

export interface AiAssistResponse {
  output: string;
  provider: "openai" | "local-fallback";
}
