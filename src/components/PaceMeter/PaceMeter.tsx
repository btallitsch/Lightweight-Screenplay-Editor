/**
 * PaceMeter.tsx — Visual pacing graph for scene rhythm analysis
 */
import './PaceMeter.css';
import type { PaceDataPoint } from '../../types/screenplay';
import { analyzePacing, getOverallStats } from '../../utils/paceAnalyzer';
import type { Scene } from '../../types/screenplay';

interface Props {
  scenes: Scene[];
  currentSceneIndex: number | null;
  onSelectScene: (index: number) => void;
}

export function PaceMeter({ scenes, currentSceneIndex, onSelectScene }: Props) {
  const data = analyzePacing(scenes);
  const stats = getOverallStats(data);

  if (data.length === 0) {
    return (
      <div className="pace-panel">
        <div className="pace-header">
          <span className="pace-title">PACE METER</span>
        </div>
        <p className="pace-empty">Add scene headings to see pacing analysis.</p>
      </div>
    );
  }

  const maxLines = Math.max(...data.map(d => d.totalLines), 1);

  return (
    <div className="pace-panel">
      <div className="pace-header">
        <span className="pace-title">PACE METER</span>
        {stats && (
          <span className="pace-sub">{stats.sceneCount} scenes · {stats.totalPages.toFixed(1)}p est.</span>
        )}
      </div>

      {/* Bar Chart */}
      <div className="pace-chart">
        {data.map((point) => {
          const heightPct = (point.totalLines / maxLines) * 100;
          const isActive = point.sceneIndex === currentSceneIndex;
          const hasWarning = !!point.warning;

          return (
            <div
              key={point.sceneIndex}
              className={`pace-bar-wrap ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScene(point.sceneIndex)}
              title={point.sceneHeading}
            >
              <div className="pace-bar-outer" style={{ height: '80px' }}>
                {/* Action layer */}
                <div
                  className="pace-bar-segment action"
                  style={{ height: `${heightPct * point.actionDensity}%` }}
                />
                {/* Dialogue layer */}
                <div
                  className="pace-bar-segment dialogue"
                  style={{ height: `${heightPct * point.dialogueDensity}%` }}
                />
                {/* Total bar outline */}
                <div
                  className="pace-bar-total"
                  style={{ height: `${heightPct}%` }}
                />
                {hasWarning && (
                  <div className={`pace-warning-dot severity-${point.warning!.severity}`} />
                )}
              </div>
              <span className="pace-bar-label">#{point.sceneIndex + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pace-legend">
        <span className="legend-item"><span className="legend-dot dialogue" />Dialogue</span>
        <span className="legend-item"><span className="legend-dot action" />Action</span>
        <span className="legend-item"><span className="legend-dot warning" />Warning</span>
      </div>

      {/* Warnings List */}
      {data.some(d => d.warning) && (
        <div className="pace-warnings">
          <div className="warnings-header">PACING NOTES</div>
          {data.filter(d => d.warning).map(d => (
            <div key={d.sceneIndex} className={`pace-note severity-${d.warning!.severity}`}>
              <span className="note-scene">Scene #{d.sceneIndex + 1}</span>
              <span className="note-msg">{d.warning!.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Overall stats */}
      {stats && (
        <div className="pace-stats">
          <div className="stat-row">
            <span>Avg. Dialogue</span>
            <span className="stat-bar-wrap">
              <span className="stat-bar dialogue" style={{ width: `${stats.avgDialogue * 100}%` }} />
            </span>
            <span>{Math.round(stats.avgDialogue * 100)}%</span>
          </div>
          <div className="stat-row">
            <span>Avg. Action</span>
            <span className="stat-bar-wrap">
              <span className="stat-bar action" style={{ width: `${stats.avgAction * 100}%` }} />
            </span>
            <span>{Math.round(stats.avgAction * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
