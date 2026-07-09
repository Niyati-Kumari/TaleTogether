import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { hasSeenOnboarding, markOnboardingSeen } from "./lib/onboarding";
import { AuthPage } from "./pages/AuthPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { HomePage } from "./pages/HomePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StoryPage } from "./pages/StoryPage";
import { WritePage } from "./pages/WritePage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import {
  api,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "./lib/api";
import {
  clearDraft,
  defaultDraft,
  loadDraft,
  persistDraft,
} from "./lib/draftStorage";
import type { AiAssistAction, BootstrapData, Genre, StoryDraft, SubscriptionPlan } from "./types";

// Sample subscription plans for monetization
const SAMPLE_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free-monthly",
    name: "Free",
    description: "Start your writing journey",
    price: 0,
    currency: "USD",
    billingCycle: "monthly",
    features: ["early-access"],
  },
  {
    id: "premium-monthly",
    name: "Premium",
    description: "Unlock all features for writers and readers",
    price: 7.99,
    currency: "USD",
    billingCycle: "monthly",
    features: ["ad-free", "early-access", "exclusive-challenges", "ai-assist-unlimited"],
  },
  {
    id: "free-yearly",
    name: "Free",
    description: "Start your writing journey",
    price: 0,
    currency: "USD",
    billingCycle: "yearly",
    features: ["early-access"],
  },
  {
    id: "premium-yearly",
    name: "Premium",
    description: "Unlock all features for writers and readers",
    price: 79.99,
    currency: "USD",
    billingCycle: "yearly",
    features: ["ad-free", "early-access", "exclusive-challenges", "ai-assist-unlimited"],
  },
];

// Load dark mode preference from localStorage
const loadDarkMode = () => {
  const saved = window.localStorage.getItem("taletogether-dark-mode");
  if (saved !== null) {
    return saved === "true";
  }
  // Fallback to system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// Load bookmarks from localStorage
const loadBookmarks = () => {
  try {
    const saved = window.localStorage.getItem("taletogether-bookmarks");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const emptyBootstrap: BootstrapData = {
  user: null,
  authors: [],
  stories: [],
  comments: [],
  likes: [],
  follows: [],
  preferences: ["Personal", "Memoir", "Fantasy"],
  streak: 0,
  challenges: [],
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [bootstrap, setBootstrap] = useState<BootstrapData>(emptyBootstrap);
  const [draft, setDraft] = useState<StoryDraft>(() => loadDraft());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [onboardingSeen, setOnboardingSeen] = useState<boolean>(() =>
    hasSeenOnboarding(),
  );
  const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());
  const [bookmarkedStoryIds, setBookmarkedStoryIds] = useState<string[]>(() =>
    loadBookmarks(),
  );

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = useCallback(() => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    window.localStorage.setItem("taletogether-dark-mode", String(newValue));
  }, [darkMode]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Toggle bookmark function
  const toggleBookmark = useCallback((storyId: string) => {
    setBookmarkedStoryIds((prev) => {
      const isBookmarked = prev.includes(storyId);
      const newBookmarks = isBookmarked
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId];
      window.localStorage.setItem(
        "taletogether-bookmarks",
        JSON.stringify(newBookmarks),
      );
      return newBookmarks;
    });
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);

    try {
      const data = await api.getBootstrap();
      setBootstrap(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load TaleTogether.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [token, loadBootstrap]);

  useEffect(() => {
    persistDraft(draft);
  }, [draft]);

  const authorsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.authors.map((author) => [author.id, author]),
      ),
    [bootstrap.authors],
  );

  const metricsByStoryId = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.stories.map((story) => [story.id, story.stats]),
      ),
    [bootstrap.stories],
  );

  const currentUser = bootstrap.user;
  const currentUserId = currentUser?.id ?? null;
  const myStories = bootstrap.stories.filter(
    (story) => story.authorId === currentUserId,
  );

  const handleAuth = async (
    mode: "login" | "register",
    payload: Record<string, string>,
  ) => {
    const result =
      mode === "login"
        ? await api.login({ email: payload.email, password: payload.password })
        : await api.register({
            name: payload.name,
            email: payload.email,
            password: payload.password,
          });

    setStoredToken(result.token);
    setToken(result.token);
    await loadBootstrap();
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setBootstrap({ ...emptyBootstrap, challenges: bootstrap.challenges });
  };

  const updateDraft = (nextDraft: StoryDraft) => {
    setDraft(nextDraft);
  };

  const publishStory = async (storyDraft: StoryDraft) => {
    const result = await api.createStory(storyDraft);
    setDraft(defaultDraft());
    clearDraft();
    await loadBootstrap();
    return result.story;
  };

  const togglePreference = async (genre: Genre) => {
    const exists = bootstrap.preferences.includes(genre);
    const nextPreferences = exists
      ? bootstrap.preferences.length > 1
        ? bootstrap.preferences.filter((item) => item !== genre)
        : bootstrap.preferences
      : [...bootstrap.preferences, genre];

    setBootstrap((previous) => ({ ...previous, preferences: nextPreferences }));

    if (!currentUser) {
      return;
    }

    try {
      const result = await api.updatePreferences(nextPreferences);
      setBootstrap((previous) => ({
        ...previous,
        preferences: result.preferences as Genre[],
      }));
    } catch {
      await loadBootstrap();
    }
  };

  const toggleLike = async (storyId: string) => {
    await api.toggleLike(storyId);
    await loadBootstrap();
  };

  const toggleFollow = async (authorId: string) => {
    await api.toggleFollow(authorId);
    await loadBootstrap();
  };

  const addComment = async (storyId: string, body: string) => {
    await api.addComment(storyId, body);
    await loadBootstrap();
  };

  const viewStory = async (storyId: string) => {
    try {
      const result = await api.viewStory(storyId);
      setBootstrap((previous) => ({
        ...previous,
        stories: previous.stories.map((story) =>
          story.id === storyId ? result.story : story,
        ),
      }));
    } catch {
      // Ignore read-tracking errors so the page remains usable.
    }
  };

  const uploadCover = async (file: File) => api.uploadCover(file);

  const requestAiAssist = async (payload: {
    action: AiAssistAction;
    text: string;
    genre?: string;
    title?: string;
  }) => api.assistWriting(payload);

  const handleMarkOnboardingSeen = () => {
    markOnboardingSeen();
    setOnboardingSeen(true);
  };

  // Monetization handlers
  const handleSubscribe = async (planId: string) => {
    // In a real app, this would integrate with Stripe/PayPal
    alert(`Subscription to plan ${planId} would be processed here!`);
    // Mock successful subscription
    if (currentUser) {
      setBootstrap((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          subscriptionTier: "premium",
        },
      }));
    }
  };

  const handleTip = async (storyId: string, amount: number, message?: string) => {
    // In a real app, this would integrate with Stripe/PayPal
    alert(`Tip of $${amount}${message ? ` with message: "${message}"` : ""} sent!`);
    // Mock updating tips received
    setBootstrap((prev) => ({
      ...prev,
      stories: prev.stories.map((story) =>
        story.id === storyId
          ? { ...story, tipsReceived: (story.tipsReceived || 0) + 1 }
          : story,
      ),
    }));
  };

  return (
    <BrowserRouter>
      <Layout
        currentUser={currentUser}
        storyCount={
          myStories.filter((story) => story.visibility === "public").length
        }
        streak={bootstrap.streak}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      >
        {loading ? (
          <section className="panel empty-state">
            <h2>Opening TaleTogether…</h2>
            <p>Getting your stories, preferences, and reading space ready.</p>
          </section>
        ) : errorMessage ? (
          <section className="panel empty-state">
            <h2>Could not load the app</h2>
            <p>{errorMessage}</p>
            <button
              type="button"
              className="button-link primary"
              onClick={() => void loadBootstrap()}
            >
              Retry
            </button>
          </section>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  stories={bootstrap.stories.filter(
                    (story) => story.visibility === "public",
                  )}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                  preferences={bootstrap.preferences}
                  onTogglePreference={(genre) => void togglePreference(genre)}
                  likedStoryIds={bootstrap.likes}
                  bookmarkedStoryIds={bookmarkedStoryIds}
                  onToggleBookmark={toggleBookmark}
                  challenges={bootstrap.challenges}
                  currentUser={currentUser}
                  showOnboardingPrompt={!currentUser && !onboardingSeen}
                />
              }
            />
            <Route
              path="/discover"
              element={
                <DiscoverPage
                  stories={bootstrap.stories.filter(
                    (story) => story.visibility === "public",
                  )}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                  preferences={bootstrap.preferences}
                  likedStoryIds={bootstrap.likes}
                  bookmarkedStoryIds={bookmarkedStoryIds}
                  onToggleBookmark={toggleBookmark}
                />
              }
            />
            <Route
              path="/story/:storyId"
              element={
                <StoryPage
                  stories={bootstrap.stories}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                  comments={bootstrap.comments}
                  likedStoryIds={bootstrap.likes}
                  bookmarkedStoryIds={bookmarkedStoryIds}
                  followedAuthorIds={bootstrap.follows}
                  onToggleLike={(storyId) => toggleLike(storyId)}
                  onToggleFollow={(authorId) => toggleFollow(authorId)}
                  onToggleBookmark={toggleBookmark}
                  onAddComment={(storyId, body) => addComment(storyId, body)}
                  onViewStory={(storyId) => viewStory(storyId)}
                  onTip={handleTip}
                  currentUserId={currentUserId}
                  isAuthenticated={Boolean(currentUser)}
                />
              }
            />
            <Route
              path="/write"
              element={
                <WritePage
                  draft={draft}
                  onDraftChange={updateDraft}
                  onPublish={publishStory}
                  onUploadCover={uploadCover}
                  onAiAssist={requestAiAssist}
                  challenges={bootstrap.challenges}
                  isAuthenticated={Boolean(currentUser)}
                />
              }
            />
            <Route
              path="/profile/:profileId"
              element={
                <ProfilePage
                  stories={bootstrap.stories}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                  followedAuthorIds={bootstrap.follows}
                  onToggleFollow={(authorId) => toggleFollow(authorId)}
                  currentUserId={currentUserId}
                  streak={bootstrap.streak}
                  isAuthenticated={Boolean(currentUser)}
                />
              }
            />
            <Route
              path="/challenges"
              element={
                <ChallengesPage
                  challenges={bootstrap.challenges}
                  stories={bootstrap.stories.filter(
                    (story) => story.visibility === "public",
                  )}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                />
              }
            />
            <Route
              path="/auth"
              element={
                <AuthPage
                  currentUser={currentUser}
                  onLogin={(payload) => handleAuth("login", payload)}
                  onRegister={(payload) => handleAuth("register", payload)}
                />
              }
            />
            <Route
              path="/welcome"
              element={
                <OnboardingPage
                  currentUser={currentUser}
                  onMarkOnboardingSeen={handleMarkOnboardingSeen}
                />
              }
            />
            <Route
              path="/subscribe"
              element={
                <SubscriptionPage
                  subscriptionPlans={SAMPLE_SUBSCRIPTION_PLANS}
                  currentUser={currentUser}
                  onSubscribe={handleSubscribe}
                />
              }
            />
            <Route
              path="*"
              element={
                <HomePage
                  stories={bootstrap.stories.filter(
                    (story) => story.visibility === "public",
                  )}
                  authorsById={authorsById}
                  metricsByStoryId={metricsByStoryId}
                  preferences={bootstrap.preferences}
                  onTogglePreference={(genre) => void togglePreference(genre)}
                  likedStoryIds={bootstrap.likes}
                  bookmarkedStoryIds={bookmarkedStoryIds}
                  onToggleBookmark={toggleBookmark}
                  challenges={bootstrap.challenges}
                  currentUser={currentUser}
                  showOnboardingPrompt={!currentUser && !onboardingSeen}
                />
              }
            />
          </Routes>
        )}
      </Layout>
    </BrowserRouter>
  );
}
