import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { StoryCard } from "../components/StoryCard";
import { api } from "../lib/api";
import type { Author, Story, StoryStats } from "../types";

interface ProfilePageProps {
  stories: Story[];
  authorsById: Record<string, Author>;
  metricsByStoryId: Record<string, StoryStats>;
  followedAuthorIds: string[];
  onToggleFollow: (authorId: string) => Promise<void>;
  currentUserId: string | null;
  streak: number;
  isAuthenticated: boolean;
}

export const ProfilePage = ({
  stories,
  authorsById,
  metricsByStoryId,
  followedAuthorIds,
  onToggleFollow,
  currentUserId,
  streak,
  isAuthenticated,
}: ProfilePageProps) => {
  const { profileId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stripeStatus, setStripeStatus] = useState<"return" | "refresh" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const status = searchParams.get("stripe") as "return" | "refresh" | null;
    if (status) {
      setStripeStatus(status);
      setTimeout(() => {
        setSearchParams({});
      }, 5000);
    }
  }, [searchParams, setSearchParams]);

  const handleSetupPayouts = async () => {
    setIsConnecting(true);
    try {
      const response = await api.createRazorpayConnectAccount();
      if (response.url) {
        window.location.href = response.url;
      } else {
        alert(response.message || "Payout setup started");
      }
    } catch (error) {
      console.error("Failed to start Razorpay Connect:", error);
      alert("Failed to start payout setup. Please try again later.");
    } finally {
      setIsConnecting(false);
    }
  };

  if (profileId === "you" && !isAuthenticated) {
    return (
      <section className="panel empty-state">
        <h2>Sign in to see your writer profile</h2>
        <p>
          Your profile, streak, private drafts, and published stories are tied
          to your account.
        </p>
        <Link to="/auth" className="button-link primary">
          Go to sign in
        </Link>
      </section>
    );
  }

  const resolvedId = profileId === "you" ? currentUserId : profileId;
  const author = resolvedId ? authorsById[resolvedId] : undefined;

  if (!author) {
    return (
      <section className="panel empty-state">
        <h2>Writer not found</h2>
        <p>
          Try opening a profile from a story card or go back to the home feed.
        </p>
        <Link to="/" className="button-link primary">
          Back home
        </Link>
      </section>
    );
  }

  const isCurrentUser = author.id === currentUserId;
  const authoredStories = stories.filter(
    (story) => story.authorId === author.id,
  );
  const publicStories = authoredStories.filter(
    (story) => story.visibility === "public",
  );
  const totalReads = authoredStories.reduce(
    (sum, story) =>
      sum + (metricsByStoryId[story.id]?.reads ?? story.stats.reads),
    0,
  );
  const totalLikes = authoredStories.reduce(
    (sum, story) =>
      sum + (metricsByStoryId[story.id]?.likes ?? story.stats.likes),
    0,
  );
  const averageEngagement =
    publicStories.length > 0
      ? Math.round(totalLikes / publicStories.length)
      : 0;
  const isFollowing = followedAuthorIds.includes(author.id);

  return (
    <div className="page-stack">
      {stripeStatus === "return" && (
        <div className="message-box success" style={{ marginBottom: "1rem" }}>
          🎉 Your payout account has been successfully connected!
        </div>
      )}
      {stripeStatus === "refresh" && (
        <div className="message-box info" style={{ marginBottom: "1rem" }}>
          ⚠️ Please complete the payout onboarding to receive funds.
        </div>
      )}
      <section className="panel profile-hero">
        <div className="profile-summary">
          <div className="avatar large">{author.avatar}</div>
          <div>
            <p className="eyebrow">writer identity</p>
            <h2>{author.name}</h2>
            <p className="muted">{author.handle}</p>
            <p className="lead small">{author.bio}</p>
          </div>
        </div>

        <div className="profile-actions">
          <div className="level-pill">{author.level}</div>
          {!isCurrentUser ? (
            isAuthenticated ? (
              <button
                type="button"
                className="button-link primary"
                onClick={() => void onToggleFollow(author.id)}
              >
                {isFollowing ? "Following" : "Follow writer"}
              </button>
            ) : (
              <Link to="/auth" className="button-link primary">
                Sign in to follow
              </Link>
            )
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="button secondary"
                onClick={handleSetupPayouts}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Set up Payouts"}
              </button>
              <Link to="/write" className="button-link primary">
                Write new story
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="stats-band">
        <article className="stat-tile">
          <strong>{publicStories.length}</strong>
          <span>Published stories</span>
        </article>
        <article className="stat-tile">
          <strong>{author.followers}</strong>
          <span>Followers</span>
        </article>
        <article className="stat-tile">
          <strong>{totalReads}</strong>
          <span>Total reads</span>
        </article>
        <article className="stat-tile">
          <strong>{averageEngagement}</strong>
          <span>Avg likes / story</span>
        </article>
      </section>

      <section className="panel two-column-panel">
        <div>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">milestones</p>
              <h3>Achievements</h3>
            </div>
          </div>
          <div className="achievement-grid">
            {author.achievements.map((achievement) => (
              <div key={achievement} className="achievement-card">
                <span>🏆</span>
                <p>{achievement}</p>
              </div>
            ))}
            {isCurrentUser ? (
              <div className="achievement-card">
                <span>🔥</span>
                <p>{streak}-day writing streak</p>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">creator focus</p>
              <h3>Primary genres</h3>
            </div>
          </div>
          <div className="tag-row">
            {author.focusGenres.map((genre) => (
              <span key={genre} className="tag-chip large">
                {genre}
              </span>
            ))}
          </div>
          {isCurrentUser ? (
            <div className="message-box success">
              This profile is backed by your account now. Publish consistently
              to keep growing from <strong>{author.level}</strong>.
            </div>
          ) : (
            <div className="message-box info">
              Readers who enjoy {author.focusGenres.join(", ")} are likely to
              follow this writer long term.
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">published work</p>
            <h3>
              {isCurrentUser ? "Your stories" : `${author.name}'s stories`}
            </h3>
          </div>
        </div>

        {authoredStories.length > 0 ? (
          <div className="story-grid">
            {authoredStories.map((story) => (
              <div key={story.id} className="story-with-status">
                <StoryCard
                  story={story}
                  author={author}
                  metrics={metricsByStoryId[story.id] ?? story.stats}
                  liked={false}
                />
                {isCurrentUser && story.visibility === "private" ? (
                  <p className="muted-small visibility-note">
                    Only visible to you
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-card left-aligned-empty">
            <div className="empty-illustration">🪶</div>
            <h4>
              {isCurrentUser
                ? "You have not published a story yet"
                : "No stories published yet"}
            </h4>
            <p>
              {isCurrentUser
                ? "Your profile is ready. Start with one memory, one poem, or one short scene."
                : "This writer has not shared any visible stories yet."}
            </p>
            {isCurrentUser ? (
              <Link to="/write" className="button-link primary">
                Write my first story
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
};
