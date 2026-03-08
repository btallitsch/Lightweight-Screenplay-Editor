/**
 * VersionHistory.tsx — Git-like version history panel
 */
import './VersionHistory.css';
import type { ScreenplayVersion } from '../../types/screenplay';
import { formatTimestamp, getDiffStats } from '../../utils/diff';

interface Props {
  versions: ScreenplayVersion[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function VersionHistory({ versions, onRestore, onDelete, onClear, onClose }: Props) {
  const sorted = [...versions].reverse();

  return (
    <div className="history-overlay">
      <div className="history-panel">
        <div className="history-header">
          <div>
            <div className="history-title">VERSION HISTORY</div>
            <div className="history-sub">{versions.length} saved version{versions.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {versions.length > 0 && (
              <button className="clear-btn" onClick={onClear}>Clear All</button>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="history-list">
          {sorted.length === 0 && (
            <p className="history-empty">
              No versions saved yet. Saves happen automatically every 30 seconds, or press the Save button.
            </p>
          )}

          {sorted.map((v, i) => {
            const stats = v.diff ? getDiffStats(v.diff) : null;
            const isCurrent = i === 0;

            return (
              <div key={v.id} className={`version-item ${isCurrent ? 'current' : ''}`}>
                <div className="version-dot">
                  <span className={`dot ${isCurrent ? 'current' : ''}`} />
                  {i < sorted.length - 1 && <span className="line" />}
                </div>
                <div className="version-content">
                  <div className="version-meta">
                    <span className="version-time">{formatTimestamp(v.timestamp)}</span>
                    {isCurrent && <span className="current-badge">CURRENT</span>}
                  </div>
                  <div className="version-stats">
                    <span>{v.wordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span>{v.pageCount}p</span>
                    {stats && (
                      <>
                        <span>·</span>
                        {stats.added > 0 && <span className="diff-add">+{stats.added}</span>}
                        {stats.removed > 0 && <span className="diff-del">−{stats.removed}</span>}
                      </>
                    )}
                  </div>
                  {!isCurrent && (
                    <div className="version-actions">
                      <button className="restore-btn" onClick={() => onRestore(v.id)}>
                        ↩ Restore
                      </button>
                      <button className="delete-btn" onClick={() => onDelete(v.id)}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
