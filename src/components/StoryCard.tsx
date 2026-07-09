import { Link } from "react-router-dom";
import type { Author, Story, StoryStats } from "../types";

interface StoryCardProps {
  story: Story;
  author: Author;
  metrics: StoryStats;
  liked?: boolean;
  bookmarked?: boolean;
  onToggleBookmark?: (storyId: string) => void;
  highlight?: string;
}

export const StoryCard = ({
  story,
  author,
  metrics,
  liked,
  bookmarked,
  onToggleBookmark,
  highlight,
}: StoryCardProps) => (
  <article className="story-card">
    {story.coverImageUrl ? (
      <div className="story-cover image-cover">
        <img
          src={story.coverImageUrl}
          alt={story.title}
          className="story-cover-image"
        />
        <div className="story-cover-overlay">
          <span className="chip chip-soft">{story.genre}</span>
          {story.challenge ? (
            <span className="chip chip-ghost">{story.challenge}</span>
          ) : null}
          {onToggleBookmark ? (
            <button
              type="button"
              className="bookmark-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark(story.id);
              }}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark story"}
            >
              {bookmarked ? "🔖" : "📌"}
            </button>
          ) : null}
        </div>
      </div>
    ) : (
      <div className="story-cover" style={{ background: story.coverStyle }}>
        <span className="chip chip-soft">{story.genre}</span>
        {story.challenge ? (
          <span className="chip chip-ghost">{story.challenge}</span>
        ) : null}
        {onToggleBookmark ? (
          <button
            type="button"
            className="bookmark-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(story.id);
            }}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark story"}
          >
            {bookmarked ? "🔖" : "📌"}
          </button>
        ) : null}
      </div>
    )}

    <div className="story-card-content">
      {highlight ? <p className="story-highlight">{highlight}</p> : null}
      <Link to={`/story/${story.id}`} className="story-link-title">
        {story.title}
      </Link>
      <p className="story-summary">{story.summary}</p>

      <div className="story-meta">
        <Link to={`/profile/${author.id}`} className="author-inline">
          <span className="avatar small">{author.avatar}</span>
          <span>
            {author.name} <span className="muted">{author.handle}</span>
          </span>
        </Link>
        <span className="muted">{story.estimatedMinutes} min read</span>
      </div>

      <div className="tag-row">
        {story.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            #{tag}
          </span>
        ))}
      </div>

      <div className="story-footer">
        <div className="stats-row">
          <span>
            {liked ? "♥" : "♡"} {metrics.likes}
          </span>
          <span>💬 {metrics.comments}</span>
          <span>👁 {metrics.reads}</span>
        </div>
        <Link to={`/story/${story.id}`} className="button-link secondary">
          Read story
        </Link>
      </div>
    </div>
  </article>
);
