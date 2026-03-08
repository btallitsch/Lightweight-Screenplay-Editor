/**
 * ScenePanel.tsx — Left sidebar: document list + scene navigation
 */
import { useState } from 'react';
import './ScenePanel.css';
import type { Scene } from '../../types/screenplay';
import type { ScreenplayDoc } from '../../hooks/useDocuments';

interface Props {
  // Documents
  docs: ScreenplayDoc[];
  activeDocId: string;
  onNewDoc: () => void;
  onSwitchDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onRenameDoc: (id: string, title: string) => void;
  // Scenes
  scenes: Scene[];
  currentSceneIndex: number | null;
  isolatedSceneIndex: number | null;
  onSelectScene: (index: number) => void;
  onIsolateScene: (index: number | null) => void;
}

export function ScenePanel(props: Props) {
  const { docs, activeDocId, onNewDoc, onSwitchDoc, onDeleteDoc, onRenameDoc,
    scenes, currentSceneIndex, isolatedSceneIndex, onSelectScene, onIsolateScene } = props;

  const [tab, setTab] = useState<'scenes' | 'docs'>('scenes');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const startRename = (doc: ScreenplayDoc) => {
    setRenamingId(doc.id);
    setRenameVal(doc.title);
  };
  const commitRename = () => {
    if (renamingId && renameVal.trim()) onRenameDoc(renamingId, renameVal.trim());
    setRenamingId(null);
  };

  return (
    <aside className="scene-panel">
      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="panel-tabs">
        <button
          className={`panel-tab ${tab === 'scenes' ? 'active' : ''}`}
          onClick={() => setTab('scenes')}
        >SCENES</button>
        <button
          className={`panel-tab ${tab === 'docs' ? 'active' : ''}`}
          onClick={() => setTab('docs')}
        >DOCS</button>

        {/* New document button — always visible */}
        <button className="new-doc-btn" onClick={onNewDoc} title="New screenplay">
          <PlusIcon /> New
        </button>
      </div>

      {/* ── Scenes tab ───────────────────────────────────────────── */}
      {tab === 'scenes' && (
        <div className="panel-content">
          <div className="scene-list">
            {scenes.length === 0 && (
              <p className="empty-hint">
                Add a scene heading like<br />
                <code>INT. LOCATION - DAY</code>
              </p>
            )}
            {scenes.map(scene => (
              <SceneItem
                key={scene.id}
                scene={scene}
                isActive={scene.index === currentSceneIndex}
                isIsolated={scene.index === isolatedSceneIndex}
                onSelect={() => onSelectScene(scene.index)}
                onIsolate={() => onIsolateScene(scene.index === isolatedSceneIndex ? null : scene.index)}
              />
            ))}
          </div>

          {isolatedSceneIndex !== null && (
            <div className="panel-footer">
              <button className="exit-isolation" onClick={() => onIsolateScene(null)}>
                ← Exit Isolation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Docs tab ─────────────────────────────────────────────── */}
      {tab === 'docs' && (
        <div className="panel-content">
          <div className="doc-list">
            {docs.map(doc => (
              <div
                key={doc.id}
                className={`doc-item ${doc.id === activeDocId ? 'active' : ''}`}
              >
                {renamingId === doc.id ? (
                  <input
                    className="doc-rename-input"
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
                    autoFocus
                  />
                ) : (
                  <button className="doc-title-btn" onClick={() => onSwitchDoc(doc.id)}>
                    <span className="doc-icon">📄</span>
                    <span className="doc-name">{doc.title}</span>
                  </button>
                )}

                <div className="doc-actions">
                  <button className="doc-action-btn" onClick={() => startRename(doc)} title="Rename">✎</button>
                  {docs.length > 1 && (
                    <button
                      className="doc-action-btn danger"
                      onClick={() => { if (confirm(`Delete "${doc.title}"?`)) onDeleteDoc(doc.id); }}
                      title="Delete"
                    >✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="panel-footer">
            <button className="new-doc-full-btn" onClick={onNewDoc}>
              <PlusIcon /> New Screenplay
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Scene Item ───────────────────────────────────────────────────────────────
function SceneItem({ scene, isActive, isIsolated, onSelect, onIsolate }: {
  scene: Scene;
  isActive: boolean;
  isIsolated: boolean;
  onSelect: () => void;
  onIsolate: () => void;
}) {
  const intExt = scene.interior === true ? 'INT' : scene.interior === false ? 'EXT' : '—';
  const pages = scene.pageCount < 1
    ? `${Math.round(scene.pageCount * 8)}/8`
    : scene.pageCount.toFixed(1);

  return (
    <div className={`scene-item ${isActive ? 'active' : ''} ${isIsolated ? 'isolated' : ''}`}>
      <button className="scene-btn" onClick={onSelect}>
        <div className="scene-num">
          <span className="int-ext">{intExt}</span>
          <span className="scene-idx">#{scene.index + 1}</span>
        </div>
        <div className="scene-info">
          <span className="scene-location">{scene.location || scene.heading}</span>
          <span className="scene-time">{scene.timeOfDay}</span>
        </div>
        <span className="pages-stat">{pages}p</span>
      </button>
      <button
        className={`isolate-btn ${isIsolated ? 'on' : ''}`}
        onClick={onIsolate}
        title={isIsolated ? 'Exit isolation' : 'Isolate scene'}
      >
        {isIsolated ? '⊡' : '⊞'}
      </button>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5.5" y1="1" x2="5.5" y2="10" />
    <line x1="1" y1="5.5" x2="10" y2="5.5" />
  </svg>
);
