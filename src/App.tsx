/**
 * App.tsx — Root: wires document manager, screenplay state, and all UI panels
 */
import { useCallback } from 'react';
import { useDocuments } from './hooks/useDocuments';
import { useScreenplay } from './hooks/useScreenplay';
import { useEditorCursor } from './hooks/useEditorCursor';
import { useAutoSave } from './hooks/useAutoSave';
import { EditorToolbar } from './components/Editor/EditorToolbar';
import { FormatToolbar } from './components/FormatToolbar/FormatToolbar';
import { ScreenplayEditor } from './components/Editor/ScreenplayEditor';
import { ScenePanel } from './components/ScenePanel/ScenePanel';
import { PaceMeter } from './components/PaceMeter/PaceMeter';
import { VersionHistory } from './components/VersionHistory/VersionHistory';
import { exportAsFountain, exportAsText, downloadFile, sanitizeFilename } from './utils/export';
import { useState } from 'react';
import './styles/globals.css';
import './App.css';

export default function App() {
  const [showPace, setShowPace] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Documents ─────────────────────────────────────────────────────────────
  const { docs, activeDoc, activeId, updateActive, createDoc, switchDoc, deleteDoc, renameDoc } = useDocuments();

  // ── Screenplay state (keyed to active document) ───────────────────────────
  const {
    state, titleData,
    updateContent, updateTitle,
    isolateScene, setCurrentScene, forceElementType, markSaved,
  } = useScreenplay(
    activeDoc.content,
    activeDoc.title,
    (c) => updateActive({ content: c }),
    (t) => updateActive({ title: t }),
  );

  // ── Cursor tracking ───────────────────────────────────────────────────────
  const { cursor, updateFromTextarea } = useEditorCursor(state.elements);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const { versions, saveNow, restoreVersion, deleteVersion, clearHistory } = useAutoSave(
    state.content, state.wordCount, state.pageCount, markSaved
  );

  // ── Force element type on current cursor line ─────────────────────────────
  const handleForceType = useCallback((type: import('./types/screenplay').ElementType) => {
    const newContent = forceElementType(cursor.line, state.content, type);
    updateContent(newContent);
  }, [cursor.line, state.content, forceElementType, updateContent]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportFountain = useCallback(() => {
    const text = exportAsFountain(state.elements, titleData, state.title);
    downloadFile(text, `${sanitizeFilename(state.title)}.fountain`, 'text/plain');
  }, [state.elements, state.title, titleData]);

  const handleExportText = useCallback(() => {
    const text = exportAsText(state.elements, titleData, state.title);
    downloadFile(text, `${sanitizeFilename(state.title)}.txt`, 'text/plain');
  }, [state.elements, state.title, titleData]);

  // ── Restore version ───────────────────────────────────────────────────────
  const handleRestore = useCallback((id: string) => {
    const restored = restoreVersion(id);
    if (restored) { updateContent(restored); setShowHistory(false); }
  }, [restoreVersion, updateContent]);

  const handleSaveNow = useCallback(() => {
    saveNow(state.content, state.wordCount, state.pageCount);
  }, [saveNow, state.content, state.wordCount, state.pageCount]);

  return (
    <div className="app">
      {/* ── Top toolbar ────────────────────────────────────────── */}
      <EditorToolbar
        state={state}
        onTitleChange={updateTitle}
        onExportFountain={handleExportFountain}
        onExportText={handleExportText}
        onSaveNow={handleSaveNow}
        onTogglePace={() => setShowPace(s => !s)}
        onToggleHistory={() => setShowHistory(s => !s)}
        showPace={showPace}
        showHistory={showHistory}
      />

      {/* ── Format toolbar ─────────────────────────────────────── */}
      <FormatToolbar
        currentType={cursor.elementType}
        onForceType={handleForceType}
      />

      {/* ── Main body ──────────────────────────────────────────── */}
      <div className="app-body">
        {/* Left sidebar */}
        <ScenePanel
          docs={docs}
          activeDocId={activeId}
          onNewDoc={createDoc}
          onSwitchDoc={(id) => { switchDoc(id); setShowHistory(false); }}
          onDeleteDoc={deleteDoc}
          onRenameDoc={renameDoc}
          scenes={state.scenes}
          currentSceneIndex={state.currentSceneIndex}
          isolatedSceneIndex={state.isolatedSceneIndex}
          onSelectScene={setCurrentScene}
          onIsolateScene={isolateScene}
        />

        {/* Editor canvas */}
        <main className="editor-main">
          <ScreenplayEditor
            content={state.content}
            elements={state.elements}
            onChange={updateContent}
            onCursorMove={updateFromTextarea}
            isolatedSceneIndex={state.isolatedSceneIndex}
            onExitIsolation={() => isolateScene(null)}
          />
        </main>

        {/* Right: pace meter */}
        {showPace && (
          <PaceMeter
            scenes={state.scenes}
            currentSceneIndex={state.currentSceneIndex}
            onSelectScene={setCurrentScene}
          />
        )}
      </div>

      {/* Version history overlay */}
      {showHistory && (
        <VersionHistory
          versions={versions}
          onRestore={handleRestore}
          onDelete={deleteVersion}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
