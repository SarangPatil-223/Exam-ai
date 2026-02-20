import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function Results({ result, navigate, role }) {
  if (!result) return null;

  const { percentage, grade, totalScore, totalMax, correctCount, wrongCount,
    bloomPerformance, results = [], thetaHistory = [], finalTheta, config, questions } = result;

  const bloomChartRef = useRef(null);
  const thetaChartRef = useRef(null);
  const bloomCanvas = useRef(null);
  const thetaCanvas = useRef(null);

  const ringCircumference = 439.8;
  const ringOffset = ringCircumference - (percentage / 100) * ringCircumference;
  const ringColor = percentage >= 80 ? '#6AECE1' : percentage >= 60 ? '#FFF57E' : '#ff6b6b';

  const gridColor = 'rgba(255,255,255,0.05)';
  const tickColor = '#64748b';

  useEffect(() => {
    // Bloom Radar
    if (bloomCanvas.current && Object.keys(bloomPerformance || {}).length) {
      if (bloomChartRef.current) bloomChartRef.current.destroy();
      const labels = Object.keys(bloomPerformance);
      bloomChartRef.current = new Chart(bloomCanvas.current, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Your Score', data: labels.map(l => bloomPerformance[l] || 0),
            backgroundColor: 'rgba(38,204,194,0.2)', borderColor: '#26CCC2', borderWidth: 2, pointBackgroundColor: '#26CCC2',
          }],
        },
        options: {
          responsive: true, plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: tickColor, font: { size: 9 }, backdropColor: 'transparent' },
              pointLabels: { color: '#94a3b8', font: { size: 11 } }
            }
          }
        },
      });
    }

    // Theta Line
    if (thetaCanvas.current && thetaHistory.length > 1) {
      if (thetaChartRef.current) thetaChartRef.current.destroy();
      thetaChartRef.current = new Chart(thetaCanvas.current, {
        type: 'line',
        data: {
          labels: thetaHistory.map((_, i) => `Q${i + 1}`),
          datasets: [{
            label: 'θ', data: thetaHistory,
            borderColor: '#FFB76C', backgroundColor: 'rgba(255,183,108,0.1)',
            borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#FFB76C',
          }],
        },
        options: {
          responsive: true, plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { min: -3, max: 3, ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } }
          }
        },
      });
    }

    return () => {
      bloomChartRef.current?.destroy();
      thetaChartRef.current?.destroy();
    };
  }, [bloomPerformance, thetaHistory]);

  const dest = role === 'teacher' ? 'teacher' : 'student';

  return (
    <div id="view-results" className="view active" style={{ overflowY: 'auto', padding: '32px 24px', minHeight: '100vh' }}>
      <div className="results-header">
        <div className="brand-icon sm" style={{ marginBottom: 16 }}><span className="brand-icon-inner">N</span></div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Exam Complete!</h1>
        <p className="page-sub" style={{ textAlign: 'center' }}>{config?.title ?? 'Exam'}</p>
      </div>

      {/* Score Ring */}
      <div className="results-score-section">
        <div className="score-ring-wrap">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
            <circle cx="80" cy="80" r="70" fill="none"
              stroke={ringColor} strokeWidth="12"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dashoffset 1.5s ease' }}
            />
          </svg>
          <div className="score-ring-inner">
            <div className="results-score-num" style={{ color: ringColor }}>{percentage}%</div>
            <div className="results-grade" style={{ color: ringColor }}>{grade}</div>
          </div>
        </div>

        <div className="results-stats">
          <div className="result-stat"><div className="rs-value">{totalScore}</div><div className="rs-label">Score</div></div>
          <div className="result-stat"><div className="rs-value">{totalMax}</div><div className="rs-label">Max</div></div>
          <div className="result-stat"><div className="rs-value" style={{ color: '#6AECE1' }}>{correctCount}</div><div className="rs-label">Correct</div></div>
          <div className="result-stat"><div className="rs-value" style={{ color: '#ff6b6b' }}>{wrongCount}</div><div className="rs-label">Wrong</div></div>
          {finalTheta !== undefined && (
            <div className="result-stat"><div className="rs-value" style={{ color: '#FFB76C' }}>{(+finalTheta).toFixed(2)}</div><div className="rs-label">Final θ</div></div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="results-charts">
        {Object.keys(bloomPerformance || {}).length > 0 && (
          <div className="chart-card">
            <div className="chart-header"><h3>Bloom's Performance</h3></div>
            <canvas ref={bloomCanvas} height="260" />
          </div>
        )}
        {thetaHistory.length > 1 && (
          <div className="chart-card">
            <div className="chart-header"><h3>Ability Trajectory (θ)</h3></div>
            <canvas ref={thetaCanvas} height="260" />
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="breakdown-section">
        <h3 style={{ marginBottom: 16 }}>Answer Breakdown</h3>
        <div className="breakdown-list">
          {results.map((r, i) => (
            <div key={r.questionId} className="breakdown-item">
              <div className="breakdown-q">
                <span className="breakdown-num">Q{i + 1}</span>
                <div className="breakdown-info">
                  <div className="breakdown-text">{r.question?.text?.slice(0, 90)}…</div>
                  <div className="breakdown-meta">
                    <span className="bloom-badge" style={{ fontSize: 10 }}>{r.question?.bloom}</span>
                    <span className="type-badge" style={{ fontSize: 10 }}>{r.type}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{r.feedback}</span>
                  </div>
                </div>
              </div>
              <div className="breakdown-score" style={{ color: r.correct ? '#6AECE1' : '#ff6b6b' }}>
                {r.score}/{r.maxScore}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        <button className="btn btn-primary" onClick={() => navigate(dest)}>← Back to Dashboard</button>
        <button className="btn btn-outline" onClick={() => navigate('landing')}>Home</button>
      </div>
    </div>
  );
}
