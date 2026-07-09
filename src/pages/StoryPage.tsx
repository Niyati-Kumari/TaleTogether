import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StoryCard } from "../components/StoryCard";
import { TipButton } from "../components/TipButton";
import { convertStoryFormat } from "../lib/analysis";
import type { Author, Comment, Story, StoryFormat, StoryStats } from "../types";

interface StoryPageProps {
  stories: Story[];
  authorsById: Record<string, Author>;
  metricsByStoryId: Record<string, StoryStats>;
  comments: Comment[];
  likedStoryIds: string[];
  bookmarkedStoryIds: string[];
  followedAuthorIds: string[];
  onToggleLike: (storyId: string) => Promise<void>;
  onToggleFollow: (authorId: string) => Promise<void>;
  onToggleBookmark: (storyId: string) => void;
  onAddComment: (storyId: string, body: string) => Promise<void>;
  onViewStory: (storyId: string) => Promise<void>;
  onTip: (storyId: string, amount: number, message?: string) => Promise<void>;
  currentUserId: string | null;
  isAuthenticated: boolean;
}

const formats: StoryFormat[] = ["Biography", "Novel", "Movie Script", "Poem"];

export const StoryPage = ({
  stories,
  authorsById,
  metricsByStoryId,
  comments,
  likedStoryIds,
  bookmarkedStoryIds,
  followedAuthorIds,
  onToggleLike,
  onToggleFollow,
  onToggleBookmark,
  onAddComment,
  onViewStory,
  onTip,
  currentUserId,
  isAuthenticated,
}: StoryPageProps) => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] =
    useState<StoryFormat>("Biography");
  const [commentBody, setCommentBody] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const viewedStoryIdRef = useRef<string | null>(null);

  // Track scroll progress for reading indicator
  useEffect(() => {
    const handleScroll = () => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const story = stories.find((item) => item.id === storyId);

  useEffect(() => {
    if (!storyId || viewedStoryIdRef.current === storyId) {
      return;
    }

    viewedStoryIdRef.current = storyId;
    void onViewStory(storyId);
  }, [onViewStory, storyId]);

  const storyComments = useMemo(
    () => comments.filter((comment) => comment.storyId === storyId),
    [comments, storyId],
  );

  if (!story) {
    return (
      <section className="panel empty-state">
        <h2>Story not found</h2>
        <p>This link may be outdated, or the story may still be private.</p>
        <Link to="/discover" className="button-link primary">
          Go to discovery
        </Link>
      </section>
    );
  }

  const author = authorsById[story.authorId];
  const metrics = metricsByStoryId[story.id] ?? story.stats;
  const isLiked = likedStoryIds.includes(story.id);
  const isBookmarked = bookmarkedStoryIds.includes(story.id);
  const isFollowing = followedAuthorIds.includes(author.id);
  const conversion = convertStoryFormat(
    story.chapters[0]?.content ?? "",
    selectedFormat,
  );
  const relatedStories = stories
    .filter(
      (candidate) =>
        candidate.id !== story.id &&
        candidate.genre === story.genre &&
        candidate.visibility === "public",
    )
    .slice(0, 3);

  const requireAuth = () => {
    navigate("/auth");
  };

  const submitComment = async () => {
    if (!commentBody.trim()) {
      return;
    }

    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    await onAddComment(story.id, commentBody);
    setCommentBody("");
    setActionMessage("Your comment was added.");
  };

  return (
    <div className="page-stack">
      {/* Reading progress indicator */}
      <div className="reading-progress-container">
        <div
          className="reading-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      <section className="story-hero" style={{ background: story.coverStyle }}>
        <div className="story-hero-card">
          {story.coverImageUrl ? (
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="hero-cover-image"
            />
          ) : null}
          <div className="tag-row">
            <span className="chip chip-soft">{story.genre}</span>
            <span className="chip chip-ghost">
              {story.estimatedMinutes} min read
            </span>
            {story.visibility === "private" ? (
              <span className="chip chip-warning">Private draft</span>
            ) : null}
          </div>
          <h2>{story.title}</h2>
          <p className="lead small">{story.summary}</p>

          <div className="story-meta large">
            <Link to={`/profile/${author.id}`} className="author-inline">
              <span className="avatar">{author.avatar}</span>
              <span>
                {author.name} <span className="muted">{author.handle}</span>
              </span>
            </Link>
            {story.challenge ? (
              <span className="muted">Written for {story.challenge}</span>
            ) : null}
          </div>

          <div className="action-row">
            <button
              type="button"
              className="button-link primary"
              onClick={() =>
                isAuthenticated ? void onToggleLike(story.id) : requireAuth()
              }
            >
              {isLiked ? "Unlike this story" : "Like this story"} •{" "}
              {metrics.likes}
            </button>
            <button
              type="button"
              className="button-link secondary"
              onClick={() => onToggleBookmark(story.id)}
            >
              {isBookmarked ? "Remove bookmark" : "Bookmark this story"}
            </button>
            {author.id !== currentUserId && (
              <TipButton
                storyId={story.id}
                authorId={author.id}
                onTip={onTip}
                tipsReceived={story.tipsReceived}
              />
            )}
            {author.id !== currentUserId ? (
              isAuthenticated ? (
                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() => void onToggleFollow(author.id)}
                >
                  {isFollowing ? "Following this writer" : "Follow this writer"}
                </button>
              ) : (
                <Link to="/auth" className="button-link secondary">
                  Sign in to follow
                </Link>
              )
            ) : null}
          </div>
        </div>
      </section>

      <section className="story-layout">
        <article className="panel reading-panel">
          <div className="message-box info reading-tip">
            Start at the top and read slowly. If the story speaks to you, you
            can like it or leave a kind comment.
          </div>
          {story.chapters.map((chapter) => (
            <section key={chapter.title} className="chapter-block">
              <h3>{chapter.title}</h3>
              {chapter.content.split("\n").map((paragraph) => (
                <p key={`${chapter.title}-${paragraph.slice(0, 20)}`}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>

        <aside className="story-sidebar">
          <section className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">same idea, different style</p>
                <h3>See how this story could be reshaped</h3>
              </div>
            </div>
            <p className="panel-intro">
              Click one format below to see how the same idea could become a
              biography, novel, script, or poem.
            </p>
            <div className="tab-row">
              {formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className={`tab-button ${selectedFormat === format ? "active" : ""}`}
                  onClick={() => setSelectedFormat(format)}
                >
                  {format}
                </button>
              ))}
            </div>
            <pre className="conversion-preview">{conversion}</pre>
          </section>

          <section className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">community</p>
                <h3>Comments</h3>
              </div>
              <div className="muted-small">{storyComments.length} replies</div>
            </div>

            <p className="panel-intro">
              A short kind comment can mean a lot to a writer — even one or two
              lines are enough.
            </p>

            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              className="textarea"
              rows={4}
              disabled={!isAuthenticated}
              placeholder={
                isAuthenticated
                  ? "Write a kind response, thought, or reaction"
                  : "Sign in if you want to comment"
              }
            />
            <button
              type="button"
              className="button-link primary full-width"
              onClick={() => void submitComment()}
            >
              {isAuthenticated ? "Add my comment" : "Sign in to comment"}
            </button>
            {actionMessage ? (
              <div className="muted-small">{actionMessage}</div>
            ) : null}

            {storyComments.length > 0 ? (
              <div className="comment-stack">
                {storyComments.map((comment) => (
                  <article key={comment.id} className="comment-card">
                    <div className="comment-header">
                      <strong>{comment.authorName}</strong>
                      <span className="muted-small">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{comment.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state-card left-aligned-empty compact-empty">
                <div className="empty-illustration">💬</div>
                <h4>No comments yet</h4>
                <p>
                  Be the first reader to leave a kind thought for this writer.
                </p>
              </div>
            )}
          </section>
        </aside>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">keep reading</p>
            <h3>More in {story.genre}</h3>
          </div>
        </div>
        {relatedStories.length > 0 ? (
          <div className="story-grid">
            {relatedStories.map((relatedStory) => (
              <StoryCard
                key={relatedStory.id}
                story={relatedStory}
                author={authorsById[relatedStory.authorId]}
                metrics={
                  metricsByStoryId[relatedStory.id] ?? relatedStory.stats
                }
                liked={likedStoryIds.includes(relatedStory.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-illustration">📚</div>
            <h4>No more stories in this genre yet</h4>
            <p>Try the discovery page to explore other genres and writers.</p>
          </div>
        )}
      </section>
    </div>
  );
};
