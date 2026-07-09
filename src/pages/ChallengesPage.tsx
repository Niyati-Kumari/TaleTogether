import { Link } from "react-router-dom";
import { StoryCard } from "../components/StoryCard";
import type { Author, Challenge, Story, StoryStats } from "../types";

interface ChallengesPageProps {
  challenges: Challenge[];
  stories: Story[];
  authorsById: Record<string, Author>;
  metricsByStoryId: Record<string, StoryStats>;
}

export const ChallengesPage = ({
  challenges,
  stories,
  authorsById,
  metricsByStoryId,
}: ChallengesPageProps) => {
  const featuredChallengeStories = stories
    .filter((story) => story.challenge)
    .sort(
      (left, right) =>
        (metricsByStoryId[right.id]?.likes ?? 0) -
        (metricsByStoryId[left.id]?.likes ?? 0),
    )
    .slice(0, 3);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">writing prompts</p>
            <h2>Not sure what to write? Start with a prompt.</h2>
            <p className="lead small">
              Challenges make writing easier because they give you a clear
              theme, a simple starting point, and a small reason to finish
              something.
            </p>
          </div>
          <Link to="/write" className="button-link primary">
            Write from a prompt
          </Link>
        </div>

        <div className="challenge-stack three-up">
          {challenges.map((challenge) => (
            <article key={challenge.id} className="challenge-card large">
              <div className="card-icon large challenge-icon">🎯</div>
              <div className="challenge-topline">
                <span className="chip chip-soft">{challenge.cadence}</span>
                <strong>{challenge.prize}</strong>
              </div>
              <h3>{challenge.title}</h3>
              <p>{challenge.prompt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="card-icon large">🌼</div>
          <h4>Good for beginners</h4>
          <p>
            If a blank page feels difficult, a prompt gives you something small
            and clear to begin with.
          </p>
        </div>
        <div className="feature-card">
          <div className="card-icon large">📆</div>
          <h4>Build a writing habit</h4>
          <p>
            Short daily or weekly prompts help you practise without needing a
            huge idea every time.
          </p>
        </div>
        <div className="feature-card">
          <div className="card-icon large">💬</div>
          <h4>Share with readers</h4>
          <p>
            Prompts also make it easier for readers to discover your work
            because many people explore by theme.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">examples</p>
            <h3>Stories that grew from prompts</h3>
          </div>
        </div>

        <div className="story-grid">
          {featuredChallengeStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              author={authorsById[story.authorId]}
              metrics={metricsByStoryId[story.id] ?? story.stats}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
