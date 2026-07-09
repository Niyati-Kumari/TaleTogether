import { Link } from "react-router-dom";
import type { Author } from "../types";

interface OnboardingPageProps {
  currentUser: Author | null;
  onMarkOnboardingSeen: () => void;
}

export const OnboardingPage = ({
  currentUser,
  onMarkOnboardingSeen,
}: OnboardingPageProps) => {
  return (
    <div className="page-stack onboarding-page">
      <section className="panel onboarding-hero">
        <div>
          <p className="eyebrow">welcome to TaleTogether</p>
          <h2>A calm place to read, write, and grow as a storyteller.</h2>
          <p className="lead">
            If this is your first time here, start small. You do not need to write a perfect novel.
            You only need one memory, one idea, or one page.
          </p>

          <div className="hero-actions">
            <Link
              to={currentUser ? "/write" : "/auth"}
              className="button-link primary"
              onClick={onMarkOnboardingSeen}
            >
              {currentUser ? "Start writing" : "Create my account"}
            </Link>
            <Link
              to="/discover"
              className="button-link secondary"
              onClick={onMarkOnboardingSeen}
            >
              Explore stories first
            </Link>
          </div>
        </div>

        <div className="onboarding-side-art">
          <div className="onboarding-bubble floating-card">
            <div className="card-icon large">🪶</div>
            <h4>Your story can begin with one honest sentence.</h4>
          </div>
        </div>
      </section>

      <section className="steps-grid onboarding-steps-grid">
        <article className="step-card">
          <div className="step-topline">
            <div className="step-number">1</div>
            <div className="card-icon">📖</div>
          </div>
          <h4>Read to get comfortable</h4>
          <p>Open a few stories and notice what kinds of writing feel natural and interesting to you.</p>
        </article>

        <article className="step-card">
          <div className="step-topline">
            <div className="step-number">2</div>
            <div className="card-icon">👤</div>
          </div>
          <h4>Create your writing space</h4>
          <p>Your account keeps your profile, likes, comments, preferences, and published stories together.</p>
        </article>

        <article className="step-card">
          <div className="step-topline">
            <div className="step-number">3</div>
            <div className="card-icon">✍️</div>
          </div>
          <h4>Write one simple draft</h4>
          <p>Start with a memory, a poem, a scene, or a fictional idea. Small drafts are welcome here.</p>
        </article>

        <article className="step-card">
          <div className="step-topline">
            <div className="step-number">4</div>
            <div className="card-icon">🌱</div>
          </div>
          <h4>Use the helper tools</h4>
          <p>The editor gives you writing guidance, gentle suggestions, and a live Writer Score while you work.</p>
        </article>
      </section>

      <section className="panel onboarding-checklist">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">easy first-day path</p>
            <h3>If you are unsure what to do first, do this:</h3>
          </div>
        </div>

        <div className="checklist-grid">
          <div className="checklist-item">
            <span>✓</span>
            <p>Read 2 or 3 stories in the discovery page.</p>
          </div>
          <div className="checklist-item">
            <span>✓</span>
            <p>Pick one writing prompt from the prompts page.</p>
          </div>
          <div className="checklist-item">
            <span>✓</span>
            <p>Write at least 80 words in the editor.</p>
          </div>
          <div className="checklist-item">
            <span>✓</span>
            <p>Save it as private if you are not ready to publish yet.</p>
          </div>
        </div>
      </section>

      <section className="panel onboarding-bottom-cta">
        <div>
          <p className="eyebrow">ready?</p>
          <h3>Choose your next step</h3>
          <p className="panel-intro">
            There is no wrong starting point. You can read first, write first, or just make your account.
          </p>
        </div>
        <div className="hero-actions onboarding-actions">
          <Link to="/discover" className="button-link secondary" onClick={onMarkOnboardingSeen}>
            Read first
          </Link>
          <Link to="/write" className="button-link secondary" onClick={onMarkOnboardingSeen}>
            Open editor
          </Link>
          {!currentUser ? (
            <Link to="/auth" className="button-link primary" onClick={onMarkOnboardingSeen}>
              Create account
            </Link>
          ) : (
            <Link to="/profile/you" className="button-link primary" onClick={onMarkOnboardingSeen}>
              Open my profile
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
