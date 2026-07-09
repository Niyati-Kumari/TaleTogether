export const HeroArtwork = () => {
  return (
    <div className="hero-artwork" aria-hidden="true">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-orb hero-orb-three" />

      <div className="hero-scene-card hero-scene-main floating-card">
        <div className="hero-scene-topline">
          <span className="hero-mini-badge">Today’s draft</span>
          <span className="hero-mini-badge soft">Warm memory</span>
        </div>
        <h4>The day I finally felt brave</h4>
        <p>
          Start with one moment, one feeling, and one small detail the reader can see.
        </p>
        <div className="hero-lines">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="hero-scene-card hero-scene-side floating-card delay-one">
        <div className="card-icon large">💡</div>
        <h5>Helpful guidance</h5>
        <p>Simple prompts and gentle writing help while you work.</p>
      </div>

      <div className="hero-scene-card hero-scene-side second floating-card delay-two">
        <div className="card-icon large">📚</div>
        <h5>Stories to explore</h5>
        <p>Read personal stories, poems, and fiction from new writers.</p>
      </div>

      <div className="hero-floating-tag tag-one">Personal story</div>
      <div className="hero-floating-tag tag-two">Poetry</div>
      <div className="hero-floating-tag tag-three">Fantasy</div>
      <div className="hero-floating-star star-one">✦</div>
      <div className="hero-floating-star star-two">✦</div>
    </div>
  );
};
