/**
 * ScenePanel.tsx — Left sidebar listing all scenes for navigation
 */
import './ScenePanel.css';
import type { Scene } from '../../types/screenplay';

interface Props {
  scenes: Scene[];
  currentSceneIndex: number | null;
  isolatedSceneIndex: number | null;
  onSelectScene: (index: number) => void;
  onIsolateScene: (index: number | null) => void;
}

export function ScenePanel({ scenes, currentSceneIndex, isolatedSceneIndex, onSelectScene, onIsolateScene }: Props) {
  return (
    <aside className="scene-panel">
      <div className="panel-header">
        <span className="panel-title">SCENES</span>
        <span className="scene-count">{scenes.length}</span>
      </div>

      <div className="scene-list">
        {scenes.length === 0 && (
          <p className="empty-hint">
            Start typing a scene heading like<br />
            <code>INT. LOCATION - DAY</code>
          </p>
        )}

        {scenes.map((scene) => (
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
    </aside>
  );
}

interface ItemProps {
  scene: Scene;
  isActive: boolean;
  isIsolated: boolean;
  onSelect: () => void;
  onIsolate: () => void;
}

function SceneItem({ scene, isActive, isIsolated, onSelect, onIsolate }: ItemProps) {
  const intExt = scene.interior === true ? 'INT' : scene.interior === false ? 'EXT' : '—';
  const pages = scene.pageCount < 1 ? `${Math.round(scene.pageCount * 8)}/8` : scene.pageCount.toFixed(1);

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
        <div className="scene-stats">
          <span className="pages-stat">{pages}p</span>
        </div>
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
