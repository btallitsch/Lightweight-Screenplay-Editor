import React, { useRef, useEffect, useCallback } from 'react';
import { ScreenplayLine, Scene } from '../../types/screenplay';
import Editor, { EditorHandle } from '../Editor/Editor';

interface SceneIsolationProps {
  scene: Scene;
  allLines: ScreenplayLine[];
  title: string;
  onClose: () => void;
  onContentChange: (content: string, lines: ScreenplayLine[]) => void;
}

const SceneIsolation: React.FC<SceneIsolationProps> = ({
  scene,
  allLines,
  title,
  onClose,
  onContentChange,
}) => {
  const editorRef = useRef<EditorHandle>(null);

  // Build scene-only content string for the isolated editor
  const sceneLines = allLines.slice(scene.startLineIndex, scene.endLineIndex + 1);
  const sceneContent = sceneLines.map((l) => l.text).join('\n');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Merge scene edits back into full script
  const handleSceneContentChange = useCallback(
    (content: string, editedLines: ScreenplayLine[]) => {
      // Build new full lines array: prefix + edited scene + suffix
      const prefix = allLines.slice(0, scene.startLineIndex);
      const suffix = allLines.slice(scene.endLineIndex + 1);
      const merged = [...prefix, ...editedLines, ...suffix];

      // Re-index sceneIndex on the merged content (simple: keep as-is from editedLines)
      onContentChange(content, merged);
    },
    [allLines, scene.startLineIndex, scene.endLineIndex, onContentChange]
  );

  // Prevent backdrop scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="isolation-overlay" role="dialog" aria-modal="true" aria-label={`Editing: ${scene.heading}`}>
      {/* Backdrop */}
      <div className="isolation-backdrop" onClick={onClose} />

      {/* Modal panel */}
      <div className="isolation-panel">
        {/* Header */}
        <div className="isolation-header">
          <div className="isolation-breadcrumb">
            <span className="breadcrumb-script">{title}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-scene">Scene {scene.index + 1}</span>
          </div>
          <div className="isolation-meta">
            <span className="isolation-heading">{scene.heading}</span>
          </div>
          <button
            className="isolation-close"
            onClick={onClose}
            aria-label="Close scene isolation (Esc)"
            title="Close (Esc)"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Isolated editor */}
        <div className="isolation-editor-wrap">
          <Editor
            ref={editorRef}
            initialContent={sceneContent}
            title={scene.heading}
            onTitleChange={() => {}}
            onContentChange={handleSceneContentChange}
          />
        </div>

        {/* Footer hint */}
        <div className="isolation-footer">
          <kbd>Esc</kbd> to return to full script · Changes sync automatically
        </div>
      </div>
    </div>
  );
};

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default SceneIsolation;
