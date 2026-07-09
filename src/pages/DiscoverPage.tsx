import { useMemo, useState } from "react";
import { StoryCard } from "../components/StoryCard";
import {
  GENRES,
  type Author,
  type Genre,
  type Story,
  type StoryStats,
} from "../types";

interface DiscoverPageProps {
  stories: Story[];
  authorsById: Record<string, Author>;
  metricsByStoryId: Record<string, StoryStats>;
  preferences: Genre[];
  likedStoryIds: string[];
  bookmarkedStoryIds: string[];
  onToggleBookmark: (storyId: string) => void;
}

export const DiscoverPage = ({
  stories,
  authorsById,
  metricsByStoryId,
  preferences,
  likedStoryIds,
  bookmarkedStoryIds,
  onToggleBookmark,
}: DiscoverPageProps) => {
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<"All" | Genre>("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "personal">(
    "latest",
  );

  const filteredStories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...stories]
      .filter((story) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          story.title.toLowerCase().includes(normalizedQuery) ||
          story.summary.toLowerCase().includes(normalizedQuery) ||
          story.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

        const matchesGenre =
          genreFilter === "All" || story.genre === genreFilter;
        const matchesSortFilter = sortBy !== "personal" || story.isPersonal;

        return matchesQuery && matchesGenre && matchesSortFilter;
      })
      .sort((left, right) => {
        if (sortBy === "popular") {
          return (
            metricsByStoryId[right.id].likes +
            metricsByStoryId[right.id].reads / 100 -
            (metricsByStoryId[left.id].likes +
              metricsByStoryId[left.id].reads / 100)
          );
        }

        return (
          new Date(right.publishedAt).getTime() -
          new Date(left.publishedAt).getTime()
        );
      });
  }, [genreFilter, metricsByStoryId, query, sortBy, stories]);

  return (
    <div className="page-stack">
      <section className="panel discover-header">
        <div>
          <p className="eyebrow">reading feed</p>
          <h2>Discover stories at your own pace.</h2>
          <p className="lead small">
            Use search if you know what you want. If you do not, just scroll the
            stories below and open anything that sounds interesting.
          </p>
        </div>

        <div className="message-box info discover-tip">
          Tip: you can search by a feeling, topic, place, or genre — for
          example: <strong>rain</strong>,<strong> family</strong>,{" "}
          <strong>college</strong>, or <strong>fantasy</strong>.
        </div>

        <div className="discover-controls">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stories, feelings, themes, or tags"
            className="input"
          />
          <select
            value={genreFilter}
            onChange={(event) =>
              setGenreFilter(event.target.value as "All" | Genre)
            }
            className="input"
          >
            <option value="All">All genres</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "latest" | "popular" | "personal")
            }
            className="input"
          >
            <option value="latest">Newest first</option>
            <option value="popular">Most popular</option>
            <option value="personal">Personal stories</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">your current view</p>
            <h3>{filteredStories.length} stories match your filters</h3>
          </div>
          <div className="muted-small">
            You usually enjoy: {preferences.join(", ")}
          </div>
        </div>

        {filteredStories.length > 0 ? (
          <div className="story-grid">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                author={authorsById[story.authorId]}
                metrics={metricsByStoryId[story.id]}
                liked={likedStoryIds.includes(story.id)}
                bookmarked={bookmarkedStoryIds.includes(story.id)}
                onToggleBookmark={onToggleBookmark}
                highlight={
                  preferences.includes(story.genre)
                    ? "Close to the genres you already like"
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-illustration">🔍</div>
            <h4>No stories match these filters yet</h4>
            <p>
              Try removing one filter, choosing a different genre, or searching
              with a simpler word.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
