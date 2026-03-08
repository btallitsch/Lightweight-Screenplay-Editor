/**
 * EditorToolbar.tsx — Top bar with title, controls, export
 */
import { useState } from 'react';
import type { EditorState } from '../../types/screenplay';
import { formatTimestamp } from '../../utils/diff';
import './EditorToolbar.css';

interface Props {
  state: EditorState;
  onTitleChange: (t: string) => void;
  onExportFountain: () => void;
  onExportText: () => void;
  onSaveNow: () => void;
  onTogglePace: () => void;
  onToggleHistory: () => void;
  showPace: boolean;
  showHistory: boolean;
}

export function EditorToolbar({
  state, onTitleChange,
  onExportFountain, onExportText, onSaveNow,
  onTogglePace, onToggleHistory,
  showPace, showHistory
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="app-logo">
          <span className="logo-text">FADE IN</span>
          <span className="logo-dot">·</span>
        </div>

        <div className="title-wrap">
          {editingTitle ? (
            <input
              className="title-input"
              value={state.title}
              onChange={e => onTitleChange(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
              autoFocus
            />
          ) : (
            <button className="title-btn" onClick={() => setEditingTitle(true)}>
              {state.title || 'Untitled Screenplay'}
            </button>
          )}
          <span className={`dirty-dot ${state.isDirty ? 'dirty' : ''}`} />
        </div>
      </div>

      <div className="toolbar-center">
        <span className="meta-stat">{state.wordCount.toLocaleString()} words</span>
        <span className="meta-divider">·</span>
        <span className="meta-stat">{state.pageCount} {state.pageCount === 1 ? 'page' : 'pages'}</span>
        <span className="meta-divider">·</span>
        <span className="meta-stat">{state.scenes.length} {state.scenes.length === 1 ? 'scene' : 'scenes'}</span>
      </div>

      <div className="toolbar-right">
        <span className="save-status">
          {state.isDirty ? 'Unsaved' : state.lastSaved ? `Saved ${formatTimestamp(state.lastSaved)}` : 'Auto-saves every 30s'}
        </span>

        <button className={`tb-btn ${showPace ? 'active' : ''}`} onClick={onTogglePace} title="Pace Meter">
          <PaceIcon />
          <span>Pace</span>
        </button>

        <button className={`tb-btn ${showHistory ? 'active' : ''}`} onClick={onToggleHistory} title="Version History">
          <HistoryIcon />
          <span>History</span>
        </button>

        <button className="tb-btn" onClick={onSaveNow} title="Save Now">
          <SaveIcon />
          <span>Save</span>
        </button>

        <div className="export-wrap">
          <button className="tb-btn tb-btn-primary" onClick={() => setShowExport(s => !s)}>
            Export ↓
          </button>
          {showExport && (
            <div className="export-menu">
              <button onClick={() => { onExportFountain(); setShowExport(false); }}>
                .fountain — Fountain format
              </button>
              <button onClick={() => { onExportText(); setShowExport(false); }}>
                .txt — Plain text
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const PaceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="1,11 4,6 7,9 10,3 13,7" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="5.5" />
    <polyline points="7,4 7,7 9.5,7" />
  </svg>
);
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 13H3a1 1 0 01-1-1V2a1 1 0 011-1h6.5L12 3.5V12a1 1 0 01-1 1z" />
    <rect x="4" y="8" width="6" height="5" />
    <rect x="4.5" y="1" width="4" height="3.5" />
  </svg>
);
