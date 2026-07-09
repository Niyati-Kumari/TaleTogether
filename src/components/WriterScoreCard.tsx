import type { WritingScore } from "../types";

interface WriterScoreCardProps {
  score: WritingScore;
}

const rows = [
  { label: "Creativity", key: "creativity" },
  { label: "Grammar", key: "grammar" },
  { label: "Emotion", key: "emotion" },
  { label: "Story Flow", key: "flow" },
  { label: "Vocabulary", key: "vocabulary" },
] as const;

export const WriterScoreCard = ({ score }: WriterScoreCardProps) => (
  <section className="panel score-panel">
    <div className="section-heading compact">
      <div>
        <p className="eyebrow">writing guide</p>
        <h3>Your Writer Score</h3>
      </div>
      <div className="score-badge">{score.level}</div>
    </div>

    <p className="muted-small score-note">
      This score is only a gentle guide. Use it to improve your draft, not to
      judge yourself.
    </p>

    <div className="score-grid">
      {rows.map((row) => {
        const value = score[row.key];
        return (
          <div key={row.key} className="score-row">
            <div className="score-row-label">
              <span>{row.label}</span>
              <strong>{value}/100</strong>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${value}%` }} />
            </div>
          </div>
        );
      })}
    </div>

    <div className="muted-small">{score.wordCount} words analyzed</div>

    <ul className="suggestion-list">
      {score.suggestions.length > 0 ? (
        score.suggestions.map((suggestion) => (
          <li key={suggestion}>{suggestion}</li>
        ))
      ) : (
        <li>
          Your draft already feels balanced. Keep developing the middle scenes
          and details.
        </li>
      )}
    </ul>
  </section>
);
