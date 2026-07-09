import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  seedChallenges,
  seedComments,
  seedFollows,
  seedLikes,
  seedPreferences,
  seedStories,
  seedUsers,
} from "./seedData.js";

const databasePath = path.resolve(process.cwd(), "data", "taletogether.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");

const defaultPreferences = ["Personal", "Memoir", "Fantasy"];

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  handle: string;
  bio: string;
  level: string;
  avatar: string;
  followers_base: number;
  readers_base: number;
  achievements_json: string;
  focus_genres_json: string;
  streak: number;
  subscription_tier: string;
  razorpay_subscription_id: string | null;
  razorpay_account_id: string | null;
  total_earnings: number;
};

type StoryRow = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  genre: string;
  tags_json: string;
  cover_style: string;
  cover_image_url: string | null;
  published_at: string;
  visibility: "public" | "private";
  is_personal: number;
  challenge: string | null;
  estimated_minutes: number;
  likes_base: number;
  comments_base: number;
  reads_count: number;
};

type ChapterRow = {
  title: string;
  content: string;
  sort_order: number;
};

type CommentRow = {
  id: string;
  story_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const parseJsonArray = (value: string | null | undefined) => {
  if (!value) {
    return [] as string[];
  }

  try {
    return JSON.parse(value) as string[];
  } catch {
    return [] as string[];
  }
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "TT";

const normalizeHandleBase = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^$/, "writer");

const generateUniqueHandle = (name: string) => {
  const base = normalizeHandleBase(name);
  let candidate = `@${base}`;
  let counter = 1;

  while (
    db.prepare("SELECT 1 FROM users WHERE handle = ?").get(candidate) as
      undefined | { 1: number }
  ) {
    candidate = `@${base}${counter}`;
    counter += 1;
  }

  return candidate;
};

const estimateMinutes = (
  chapters: Array<{ title: string; content: string }>,
) => {
  const words = chapters
    .flatMap((chapter) => chapter.content.split(/\s+/))
    .map((word) => word.trim())
    .filter(Boolean).length;

  return Math.max(3, Math.ceil(words / 220));
};

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      bio TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'Developing Voice',
      avatar TEXT NOT NULL,
      followers_base INTEGER NOT NULL DEFAULT 0,
      readers_base INTEGER NOT NULL DEFAULT 0,
      achievements_json TEXT NOT NULL DEFAULT '[]',
      focus_genres_json TEXT NOT NULL DEFAULT '[]',
      streak INTEGER NOT NULL DEFAULT 0,
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      razorpay_subscription_id TEXT,
      razorpay_account_id TEXT,
      total_earnings REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      cadence TEXT NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      prize TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      genre TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      cover_style TEXT NOT NULL,
      cover_image_url TEXT,
      published_at TEXT NOT NULL,
      visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
      is_personal INTEGER NOT NULL DEFAULT 0,
      challenge TEXT,
      estimated_minutes INTEGER NOT NULL,
      likes_base INTEGER NOT NULL DEFAULT 0,
      comments_base INTEGER NOT NULL DEFAULT 0,
      reads_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS story_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, story_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS preferences (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      genre TEXT NOT NULL,
      PRIMARY KEY (user_id, genre)
    );

    CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
    CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
    CREATE INDEX IF NOT EXISTS idx_story_chapters_story_id ON story_chapters(story_id);
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free';`);
  } catch (error) {
    // Column might already exist
  }

  try {
    db.exec(`ALTER TABLE users RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;`);
  } catch (error) {
    // Column might already be renamed or doesn't exist
  }

  try {
    db.exec(`ALTER TABLE users RENAME COLUMN stripe_account_id TO razorpay_account_id;`);
  } catch (error) {
    // Column might already be renamed or doesn't exist
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN razorpay_subscription_id TEXT;`);
  } catch (error) {
    // Column might already exist
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN razorpay_account_id TEXT;`);
  } catch (error) {
    // Column might already exist
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN total_earnings REAL NOT NULL DEFAULT 0;`);
  } catch (error) {
    // Column might already exist
  }

  seedDatabaseIfNeeded();
};

const seedDatabaseIfNeeded = () => {
  const existingUser = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get() as { count: number };

  if (existingUser.count > 0) {
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, handle, bio, level, avatar, followers_base,
      readers_base, achievements_json, focus_genres_json, streak, subscription_tier, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChallenge = db.prepare(
    "INSERT INTO challenges (id, cadence, title, prompt, prize) VALUES (?, ?, ?, ?, ?)",
  );

  const insertStory = db.prepare(`
    INSERT INTO stories (
      id, author_id, title, summary, genre, tags_json, cover_style, cover_image_url,
      published_at, visibility, is_personal, challenge, estimated_minutes, likes_base,
      comments_base, reads_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChapter = db.prepare(
    "INSERT INTO story_chapters (story_id, sort_order, title, content) VALUES (?, ?, ?, ?)",
  );

  const insertComment = db.prepare(
    "INSERT INTO comments (id, story_id, user_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  const insertLike = db.prepare(
    "INSERT INTO likes (user_id, story_id, created_at) VALUES (?, ?, ?)",
  );

  const insertFollow = db.prepare(
    "INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)",
  );

  const insertPreference = db.prepare(
    "INSERT INTO preferences (user_id, genre) VALUES (?, ?)",
  );

  const transaction = db.transaction(() => {
    seedUsers.forEach((user) => {
      insertUser.run(
        user.id,
        user.email,
        bcrypt.hashSync(user.password, 10),
        user.name,
        user.handle,
        user.bio,
        user.level,
        user.avatar,
        user.followersBase,
        user.readersBase,
        JSON.stringify(user.achievements),
        JSON.stringify(user.focusGenres),
        user.streak,
        "free",
        new Date().toISOString(),
      );
    });

    seedChallenges.forEach((challenge) => {
      insertChallenge.run(
        challenge.id,
        challenge.cadence,
        challenge.title,
        challenge.prompt,
        challenge.prize,
      );
    });

    seedStories.forEach((story) => {
      insertStory.run(
        story.id,
        story.authorId,
        story.title,
        story.summary,
        story.genre,
        JSON.stringify(story.tags),
        story.coverStyle,
        null,
        story.publishedAt,
        story.visibility,
        story.isPersonal ? 1 : 0,
        story.challenge ?? null,
        story.estimatedMinutes,
        story.stats.likes,
        story.stats.comments,
        story.stats.reads,
        story.publishedAt,
      );

      story.chapters.forEach((chapter, index) => {
        insertChapter.run(story.id, index, chapter.title, chapter.content);
      });
    });

    seedComments.forEach((comment) => {
      insertComment.run(
        comment.id,
        comment.storyId,
        null,
        comment.authorName,
        comment.body,
        comment.createdAt,
      );
    });

    seedLikes.forEach((storyId) => {
      insertLike.run("demo-writer", storyId, new Date().toISOString());
    });

    seedFollows.forEach((authorId) => {
      insertFollow.run("demo-writer", authorId, new Date().toISOString());
    });

    seedPreferences.forEach((genre) => {
      insertPreference.run("demo-writer", genre);
    });
  });

  transaction();
};

initializeDatabase();

const likeCountStatement = db.prepare(
  "SELECT COUNT(*) AS count FROM likes WHERE story_id = ?",
);
const commentCountStatement = db.prepare(
  "SELECT COUNT(*) AS count FROM comments WHERE story_id = ?",
);
const followerCountStatement = db.prepare(
  "SELECT COUNT(*) AS count FROM follows WHERE following_id = ?",
);
const authoredStoriesReadStatement = db.prepare(
  "SELECT COALESCE(SUM(reads_count), 0) AS total FROM stories WHERE author_id = ? AND visibility = 'public'",
);
const chaptersByStoryStatement = db.prepare(
  "SELECT title, content, sort_order FROM story_chapters WHERE story_id = ? ORDER BY sort_order ASC",
);

const getUserRowById = (userId: string) =>
  (db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    UserRow | undefined) ?? null;

const getUserRowByEmail = (email: string) =>
  (db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as UserRow | undefined) ?? null;

const mapAuthor = (user: UserRow) => {
  const followerCount = (
    followerCountStatement.get(user.id) as { count: number }
  ).count;
  const readsTotal = (
    authoredStoriesReadStatement.get(user.id) as { total: number }
  ).total;

  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    bio: user.bio,
    level: user.level,
    avatar: user.avatar,
    followers: user.followers_base + followerCount,
    readers: user.readers_base + readsTotal,
    achievements: parseJsonArray(user.achievements_json),
    focusGenres: parseJsonArray(user.focus_genres_json),
    subscriptionTier: (user.subscription_tier as "free" | "premium") || "free",
    razorpayAccountId: user.razorpay_account_id,
    totalEarnings: user.total_earnings,
  };
};

const mapStory = (story: StoryRow) => {
  const chapters = chaptersByStoryStatement.all(story.id) as ChapterRow[];
  const likes = (likeCountStatement.get(story.id) as { count: number }).count;
  const comments = (commentCountStatement.get(story.id) as { count: number })
    .count;

  return {
    id: story.id,
    title: story.title,
    summary: story.summary,
    genre: story.genre,
    tags: parseJsonArray(story.tags_json),
    authorId: story.author_id,
    coverStyle: story.cover_style,
    coverImageUrl: story.cover_image_url ?? undefined,
    publishedAt: story.published_at,
    visibility: story.visibility,
    isPersonal: Boolean(story.is_personal),
    challenge: story.challenge ?? undefined,
    chapters: chapters.map((chapter) => ({
      title: chapter.title,
      content: chapter.content,
    })),
    stats: {
      likes: story.likes_base + likes,
      comments: story.comments_base + comments,
      reads: story.reads_count,
    },
    estimatedMinutes: story.estimated_minutes,
  };
};

const getStoryRowById = (storyId: string) =>
  (db.prepare("SELECT * FROM stories WHERE id = ?").get(storyId) as
    StoryRow | undefined) ?? null;

export const getUserForAuth = (email: string) => getUserRowByEmail(email);

export const verifyPassword = (password: string, passwordHash: string) =>
  bcrypt.compareSync(password, passwordHash);

export const getAuthorById = (userId: string) => {
  const user = getUserRowById(userId);
  return user ? mapAuthor(user) : null;
};

export const getAllAuthors = () => {
  const users = db
    .prepare("SELECT * FROM users ORDER BY name ASC")
    .all() as UserRow[];
  return users.map(mapAuthor);
};

export const getChallenges = () =>
  db
    .prepare(
      "SELECT id, cadence, title, prompt, prize FROM challenges ORDER BY title ASC",
    )
    .all() as Array<{
    id: string;
    cadence: string;
    title: string;
    prompt: string;
    prize: string;
  }>;

export const getVisibleStories = (viewerId?: string) => {
  const rows = viewerId
    ? ((db
        .prepare(
          "SELECT * FROM stories WHERE visibility = 'public' OR author_id = ? ORDER BY datetime(published_at) DESC",
        )
        .all(viewerId) as StoryRow[]) ?? [])
    : ((db
        .prepare(
          "SELECT * FROM stories WHERE visibility = 'public' ORDER BY datetime(published_at) DESC",
        )
        .all() as StoryRow[]) ?? []);

  return rows.map(mapStory);
};

export const getVisibleComments = (viewerId?: string) => {
  const visibleStories = getVisibleStories(viewerId).map((story) => story.id);

  if (visibleStories.length === 0) {
    return [] as Array<{
      id: string;
      storyId: string;
      authorName: string;
      body: string;
      createdAt: string;
    }>;
  }

  const placeholders = visibleStories.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, story_id, author_name, body, created_at FROM comments WHERE story_id IN (${placeholders}) ORDER BY datetime(created_at) DESC`,
    )
    .all(...visibleStories) as CommentRow[];

  return rows.map((comment) => ({
    id: comment.id,
    storyId: comment.story_id,
    authorName: comment.author_name,
    body: comment.body,
    createdAt: comment.created_at,
  }));
};

export const getLikedStoryIds = (userId: string) =>
  (
    db
      .prepare("SELECT story_id FROM likes WHERE user_id = ?")
      .all(userId) as Array<{ story_id: string }>
  ).map((row) => row.story_id);

export const getFollowedAuthorIds = (userId: string) =>
  (
    db
      .prepare("SELECT following_id FROM follows WHERE follower_id = ?")
      .all(userId) as Array<{ following_id: string }>
  ).map((row) => row.following_id);

export const getPreferences = (userId?: string) => {
  if (!userId) {
    return [...defaultPreferences];
  }

  const rows = db
    .prepare("SELECT genre FROM preferences WHERE user_id = ?")
    .all(userId) as Array<{ genre: string }>;
  return rows.length > 0
    ? rows.map((row) => row.genre)
    : [...defaultPreferences];
};

export const savePreferences = (userId: string, genres: string[]) => {
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM preferences WHERE user_id = ?").run(userId);
    const insert = db.prepare(
      "INSERT INTO preferences (user_id, genre) VALUES (?, ?)",
    );
    genres.forEach((genre) => insert.run(userId, genre));
  });

  transaction();

  return getPreferences(userId);
};

export const getUserStreak = (userId?: string) => {
  if (!userId) {
    return 0;
  }

  const user = getUserRowById(userId);
  return user?.streak ?? 0;
};

export const getBootstrap = (viewerId?: string) => ({
  user: viewerId ? getAuthorById(viewerId) : null,
  authors: getAllAuthors(),
  stories: getVisibleStories(viewerId),
  comments: getVisibleComments(viewerId),
  likes: viewerId ? getLikedStoryIds(viewerId) : [],
  follows: viewerId ? getFollowedAuthorIds(viewerId) : [],
  preferences: getPreferences(viewerId),
  streak: getUserStreak(viewerId),
  challenges: getChallenges(),
});

export const createUser = ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) => {
  const existingUser = getUserRowByEmail(email);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const id = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();
  const handle = generateUniqueHandle(name);
  const now = new Date().toISOString();
  const focusGenres = [...defaultPreferences];

  db.prepare(
    `INSERT INTO users (
      id, email, password_hash, name, handle, bio, level, avatar, followers_base,
      readers_base, achievements_json, focus_genres_json, streak, subscription_tier, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    normalizedEmail,
    bcrypt.hashSync(password, 10),
    name.trim(),
    handle,
    "New here, but already collecting stories worth remembering.",
    "Developing Voice",
    getInitials(name),
    0,
    0,
    JSON.stringify(["Joined TaleTogether"]),
    JSON.stringify(focusGenres),
    0,
    "free",
    now,
  );

  focusGenres.forEach((genre) => {
    db.prepare("INSERT INTO preferences (user_id, genre) VALUES (?, ?)").run(
      id,
      genre,
    );
  });

  return getAuthorById(id);
};

export const getStoryById = (storyId: string, viewerId?: string) => {
  const row = getStoryRowById(storyId);

  if (!row) {
    return null;
  }

  if (row.visibility === "private" && row.author_id !== viewerId) {
    return null;
  }

  return mapStory(row);
};

export const incrementStoryRead = (storyId: string) => {
  db.prepare(
    "UPDATE stories SET reads_count = reads_count + 1 WHERE id = ?",
  ).run(storyId);
};

export const toggleLike = (storyId: string, userId: string) => {
  const existing = db
    .prepare("SELECT 1 FROM likes WHERE story_id = ? AND user_id = ?")
    .get(storyId, userId);

  if (existing) {
    db.prepare("DELETE FROM likes WHERE story_id = ? AND user_id = ?").run(
      storyId,
      userId,
    );
    return { liked: false };
  }

  db.prepare(
    "INSERT INTO likes (user_id, story_id, created_at) VALUES (?, ?, ?)",
  ).run(userId, storyId, new Date().toISOString());

  return { liked: true };
};

export const toggleFollow = (authorId: string, userId: string) => {
  if (authorId === userId) {
    return { following: false };
  }

  const existing = db
    .prepare("SELECT 1 FROM follows WHERE following_id = ? AND follower_id = ?")
    .get(authorId, userId);

  if (existing) {
    db.prepare(
      "DELETE FROM follows WHERE following_id = ? AND follower_id = ?",
    ).run(authorId, userId);
    return { following: false };
  }

  db.prepare(
    "INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)",
  ).run(userId, authorId, new Date().toISOString());

  return { following: true };
};

export const addComment = ({
  storyId,
  userId,
  body,
}: {
  storyId: string;
  userId: string;
  body: string;
}) => {
  const user = getUserRowById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO comments (id, story_id, user_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, storyId, userId, user.name, body.trim(), createdAt);

  return {
    id,
    storyId,
    authorName: user.name,
    body: body.trim(),
    createdAt,
  };
};

export const createStory = ({
  authorId,
  title,
  summary,
  genre,
  tags,
  coverStyle,
  coverImageUrl,
  visibility,
  isPersonal,
  challenge,
  chapters,
}: {
  authorId: string;
  title: string;
  summary: string;
  genre: string;
  tags: string[];
  coverStyle: string;
  coverImageUrl?: string;
  visibility: "public" | "private";
  isPersonal: boolean;
  challenge?: string;
  chapters: Array<{ title: string; content: string }>;
}) => {
  const id = randomUUID();
  const publishedAt = new Date().toISOString();
  const estimatedMinutes = estimateMinutes(chapters);

  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT INTO stories (
        id, author_id, title, summary, genre, tags_json, cover_style, cover_image_url,
        published_at, visibility, is_personal, challenge, estimated_minutes, likes_base,
        comments_base, reads_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
    ).run(
      id,
      authorId,
      title.trim(),
      summary.trim(),
      genre,
      JSON.stringify(tags),
      coverStyle,
      coverImageUrl ?? null,
      publishedAt,
      visibility,
      isPersonal ? 1 : 0,
      challenge || null,
      estimatedMinutes,
      publishedAt,
    );

    const chapterInsert = db.prepare(
      "INSERT INTO story_chapters (story_id, sort_order, title, content) VALUES (?, ?, ?, ?)",
    );

    chapters.forEach((chapter, index) => {
      chapterInsert.run(
        id,
        index,
        chapter.title.trim() || `Chapter ${index + 1}`,
        chapter.content.trim(),
      );
    });

    db.prepare("UPDATE users SET streak = streak + 1 WHERE id = ?").run(
      authorId,
    );
  });

  transaction();

  return getStoryById(id, authorId);
};

export const ensureStoryVisibleToUser = (storyId: string, userId?: string) => {
  const story = getStoryById(storyId, userId);
  if (!story) {
    throw new Error("Story not found.");
  }

  return story;
};

export const updateUserSubscription = (
  userId: string,
  tier: "free" | "premium",
  subscriptionId?: string,
) => {
  db.prepare(
    "UPDATE users SET subscription_tier = ?, razorpay_subscription_id = ? WHERE id = ?",
  ).run(tier, subscriptionId ?? null, userId);
  return getAuthorById(userId);
};

export const updateUserRazorpayAccountId = (userId: string, accountId: string) => {
  db.prepare("UPDATE users SET razorpay_account_id = ? WHERE id = ?").run(
    accountId,
    userId,
  );
  return getAuthorById(userId);
};

export const cancelUserSubscription = (subscriptionId: string) => {
  db.prepare(
    "UPDATE users SET subscription_tier = 'free', razorpay_subscription_id = NULL WHERE razorpay_subscription_id = ?",
  ).run(subscriptionId);
};
