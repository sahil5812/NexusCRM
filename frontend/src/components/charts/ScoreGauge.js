export default function ScoreGauge({ score, label = 'AI Score' }) {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  let colorClass = 'score-low';
  if (safeScore >= 80) colorClass = 'score-high';
  else if (safeScore >= 50) colorClass = 'score-medium';

  return (
    <div className="score-gauge">
      <div className="score-gauge-header">
        <span>{label}</span>
        <strong className={colorClass}>{safeScore}</strong>
      </div>
      <div className="score-meter-track">
        <div
          className={`score-meter-fill ${colorClass}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}
