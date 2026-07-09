import { Link } from "react-router-dom";
import { HeroArtwork } from "../components/illustrations/HeroArtwork";
import { StoryCard } from "../components/StoryCard";
import {
  GENRES,
  type Author,
  type Challenge,
  type Genre,
  type Story,
  type StoryStats,
} from "../types";

interface HomePageProps {
  stories: Story[];
  authorsById: Record<string, Author>;
  metricsByStoryId: Record<string, StoryStats>;
  preferences: Genre[];
  onTogglePreference: (genre: Genre) => void;
  likedStoryIds: string[];
  bookmarkedStoryIds: string[];
  onToggleBookmark: (storyId: string) => void;
  challenges: Challenge[];
  currentUser: Author | null;
  showOnboardingPrompt: boolean;
}

export const HomePage = ({
  stories,
  authorsById,
  metricsByStoryId,
  preferences,
  onTogglePreference,
  likedStoryIds,
  bookmarkedStoryIds,
  onToggleBookmark,
  challenges,
  currentUser,
  showOnboardingPrompt,
}: HomePageProps) => {
  const recommended = stories
    .filter((story) => preferences.includes(story.genre))
    .slice(0, 3);
  const trending = [...stories]
    .sort((left, right) => {
      const leftScore =
        metricsByStoryId[left.id].likes + metricsByStoryId[left.id].reads / 100;
      const rightScore =
        metricsByStoryId[right.id].likes +
        metricsByStoryId[right.id].reads / 100;
      return rightScore - leftScore;
    })
    .slice(0, 3);
  const personalStories = stories
    .filter((story) => story.isPersonal)
    .slice(0, 3);

  return (
    <div className="page-stack">
      {showOnboardingPrompt ? (
        <section className="panel onboarding-banner">
          <div>
            <p className="eyebrow">first time here?</p>
            <h3>Take the quick guided tour before you start.</h3>
            <p className="panel-intro">
              We will show you where to read, where to write, and how to publish
              your first story.
            </p>
          </div>
          <Link to="/welcome" className="button-link primary">
            Start the welcome guide
          </Link>
        </section>
      ) : null}

      <section className="hero-grid">
        <div className="hero-card hero-main">
          <p className="eyebrow">
            simple, warm, beginner-friendly writing space
          </p>
          <h2>Read stories, write your own, and improve step by step.</h2>
          <p className="lead">
            TaleTogether is made for people who love stories and for people who
            are just starting to write. You can read, save ideas, write slowly,
            and publish when you feel ready.
          </p>

          <div className="hero-actions">
            <Link to="/discover" className="button-link primary">
              Read stories
            </Link>
            <Link to="/write" className="button-link secondary">
              Write my story
            </Link>
            {!currentUser ? (
              <Link to="/welcome" className="button-link ghost">
                I’m new here
              </Link>
            ) : null}
          </div>

          <HeroArtwork />

          <div className="hero-stats">
            <div>
              <strong>Easy start</strong>
              <span>Read first or begin with one memory</span>
            </div>
            <div>
              <strong>Helpful tools</strong>
              <span>Get writing suggestions while you draft</span>
            </div>
            <div>
              <strong>Gentle community</strong>
              <span>Follow writers and join simple prompts</span>
            </div>
          </div>
        </div>

        <div className="hero-card hero-side">
          {currentUser ? (
            <>
              <p className="eyebrow">make your feed feel personal</p>
              <h3>Choose the kinds of stories you want to see more often</h3>
              <p className="panel-intro">
                Tap two or three genres you enjoy. Your home feed will highlight
                more of them.
              </p>
              <div className="genre-picker">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => onTogglePreference(genre)}
                    className={`genre-pill ${preferences.includes(genre) ? "active" : ""}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <p className="muted">
                Right now, your feed leans toward{" "}
                <strong>{preferences.join(", ")}</strong>.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">new here?</p>
              <h3>Start in 3 easy steps</h3>
              <div className="steps-grid compact-steps">
                <article className="step-card">
                  <div className="step-topline">
                    <div className="step-number">1</div>
                    <div className="card-icon">📚</div>
                  </div>
                  <h4>Read a few stories</h4>
                  <p>
                    Open the reading feed and see what kind of writing you
                    enjoy.
                  </p>
                </article>
                <article className="step-card">
                  <div className="step-topline">
                    <div className="step-number">2</div>
                    <div className="card-icon">✨</div>
                  </div>
                  <h4>Create your account</h4>
                  <p>Save your profile, likes, and writing in one place.</p>
                </article>
                <article className="step-card">
                  <div className="step-topline">
                    <div className="step-number">3</div>
                    <div className="card-icon">✍️</div>
                  </div>
                  <h4>Write one simple story</h4>
                  <p>Start with a memory, feeling, poem, or short scene.</p>
                </article>
              </div>
              <Link to="/auth" className="button-link primary full-width">
                Create a free account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="panel quick-start-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">how TaleTogether works</p>
            <h3>Even if you have never written before, you can start here</h3>
          </div>
        </div>
        <p className="panel-intro">
          You do not need to be an author already. Many people begin with a
          small true story, a poem, or a fictional idea they have never shared
          before.
        </p>
        <div className="steps-grid">
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">1</div>
              <div className="card-icon">🔎</div>
            </div>
            <h4>Explore</h4>
            <p>
              Read a few stories to understand the tone, styles, and genres on
              the platform.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">2</div>
              <div className="card-icon">📝</div>
            </div>
            <h4>Write simply</h4>
            <p>
              Use the editor to add a title, short summary, and your first
              chapter or poem.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">3</div>
              <div className="card-icon">🌱</div>
            </div>
            <h4>Improve gently</h4>
            <p>
              Use the Writer Score and writing assistant to make your story
              clearer and stronger.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">4</div>
              <div className="card-icon">💛</div>
            </div>
            <h4>Share when ready</h4>
            <p>
              Publish publicly for readers or keep your story private until you
              are comfortable.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">picked using your interests</p>
            <h3>Recommended for you</h3>
          </div>
          <Link to="/discover" className="text-link">
            Open the full reading feed →
          </Link>
        </div>
        <div className="story-grid">
          {recommended.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              author={authorsById[story.authorId]}
              metrics={metricsByStoryId[story.id]}
              liked={likedStoryIds.includes(story.id)}
              bookmarked={bookmarkedStoryIds.includes(story.id)}
              onToggleBookmark={onToggleBookmark}
              highlight="Picked because it matches your reading interests"
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">popular with readers</p>
            <h3>Trending now</h3>
          </div>
        </div>
        <div className="story-grid">
          {trending.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              author={authorsById[story.authorId]}
              metrics={metricsByStoryId[story.id]}
              liked={likedStoryIds.includes(story.id)}
              bookmarked={bookmarkedStoryIds.includes(story.id)}
              onToggleBookmark={onToggleBookmark}
              highlight="Readers are opening, liking, and discussing this story"
            />
          ))}
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="card-icon large">🧭</div>
          <h4>Write with guidance</h4>
          <p>
            The editor gives you a live Writer Score and gentle writing
            suggestions while you draft.
          </p>
          <Link to="/write" className="text-link">
            Open the editor →
          </Link>
        </div>
        <div className="feature-card">
          <div className="card-icon large">🔒</div>
          <h4>Keep things simple</h4>
          <p>
            You can save a story privately first, then publish it later when you
            feel confident.
          </p>
          <Link to="/write" className="text-link">
            Start a private draft →
          </Link>
        </div>
        <div className="feature-card">
          <div className="card-icon large">🌟</div>
          <h4>Build your writer identity</h4>
          <p>
            Your profile shows your stories, achievements, followers, and
            writing progress in one place.
          </p>
          <Link to="/profile/you" className="text-link">
            View your profile →
          </Link>
        </div>
      </section>

      <section className="panel two-column-panel">
        <div>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">real experiences and memories</p>
              <h3>Personal stories</h3>
            </div>
          </div>
          <div className="story-list compact-list">
            {personalStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                author={authorsById[story.authorId]}
                metrics={metricsByStoryId[story.id]}
                liked={likedStoryIds.includes(story.id)}
                bookmarked={bookmarkedStoryIds.includes(story.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">need help getting started?</p>
              <h3>Try a writing prompt</h3>
            </div>
            <Link to="/challenges" className="text-link">
              See all prompts →
            </Link>
          </div>
          <div className="challenge-stack">
            {challenges.map((challenge) => (
              <article key={challenge.id} className="challenge-card">
                <div className="challenge-topline">
                  <span className="chip chip-soft">{challenge.cadence}</span>
                  <strong>{challenge.prize}</strong>
                </div>
                <h4>{challenge.title}</h4>
                <p>{challenge.prompt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
