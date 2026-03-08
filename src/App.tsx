/**
 * App.tsx — Root: wires document manager, screenplay state, and all UI panels
 */
import { useRef, useState, useCallback } from 'react';
import { useDocuments } from './hooks/useDocuments';
import { useScreenplay } from './hooks/useScreenplay';
import { useEditorCursor } from './hooks/useEditorCursor';
import { useAutoSave } from './hooks/useAutoSave';
import { EditorToolbar } from './components/Editor/EditorToolbar';
import { FormatToolbar } from './components/FormatToolbar/FormatToolbar';
import { ScreenplayEditor, type EditorHandle } from './components/Editor/ScreenplayEditor';
import { ScenePanel } from './components/ScenePanel/ScenePanel';
import { PaceMeter } from './components/PaceMeter/PaceMeter';
import { VersionHistory } from './components/VersionHistory/VersionHistory';
import { exportAsFountain, exportAsText, downloadFile, sanitizeFilename } from './utils/export';
import type { ElementType } from './types/screenplay';
import './styles/globals.css';
import './App.css';

export default function App() {
  const [showPace, setShowPace]       = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  // ── Documents ─────────────────────────────────────────────────────────────
  const { docs, activeDoc, activeId, updateActive, createDoc, switchDoc, deleteDoc, renameDoc } = useDocuments();

  // ── Screenplay state ───────────────────────────────────────────────────────
  const {
    state, titleData,
    updateContent, updateTitle,
    isolateScene, setCurrentScene, forceElementType, markSaved,
  } = useScreenplay(
    activeDoc.content,
    activeDoc.title,
    c => updateActive({ content: c }),
    t => updateActive({ title: t }),
  );

  // ── Cursor ────────────────────────────────────────────────────────────────
  const { cursor, updateFromTextarea } = useEditorCursor(state.elements, state.isolatedSceneIndex);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const { versions, saveNow, restoreVersion, deleteVersion, clearHistory } = useAutoSave(
    state.content, state.wordCount, state.pageCount, markSaved
  );

  // ── Format toolbar: force element type on current line ────────────────────
  const handleForceType = useCallback((type: ElementType) => {
    const newContent = forceElementType(cursor.line, state.content, type);
    updateContent(newContent);
    // Keep focus in editor after button click
    setTimeout(() => editorRef.current?.focus(), 0);
  }, [cursor.line, state.content, forceElementType, updateContent]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportFountain = useCallback(() => {
    downloadFile(
      exportAsFountain(state.elements, titleData, state.title),
      `${sanitizeFilename(state.title)}.fountain`, 'text/plain'
    );
  }, [state.elements, state.title, titleData]);

  const handleExportText = useCallback(() => {
    downloadFile(
      exportAsText(state.elements, titleData, state.title),
      `${sanitizeFilename(state.title)}.txt`, 'text/plain'
    );
  }, [state.elements, state.title, titleData]);

  // ── Version history ───────────────────────────────────────────────────────
  const handleRestore = useCallback((id: string) => {
    const restored = restoreVersion(id);
    if (restored) { updateContent(restored); setShowHistory(false); }
  }, [restoreVersion, updateContent]);

  const handleSaveNow = useCallback(() => {
    saveNow(state.content, state.wordCount, state.pageCount);
  }, [saveNow, state.content, state.wordCount, state.pageCount]);

  // ── Switch doc: reset isolation ───────────────────────────────────────────
  const handleSwitchDoc = useCallback((id: string) => {
    switchDoc(id);
    isolateScene(null);
    setShowHistory(false);
  }, [switchDoc, isolateScene]);

  return (
    <div className="app">
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

      <FormatToolbar
        currentType={cursor.elementType}
        onForceType={handleForceType}
      />

      <div className="app-body">
        <ScenePanel
          docs={docs}
          activeDocId={activeId}
          onNewDoc={createDoc}
          onSwitchDoc={handleSwitchDoc}
          onDeleteDoc={deleteDoc}
          onRenameDoc={renameDoc}
          scenes={state.scenes}
          currentSceneIndex={state.currentSceneIndex}
          isolatedSceneIndex={state.isolatedSceneIndex}
          onSelectScene={setCurrentScene}
          onIsolateScene={isolateScene}
        />

        <main className="editor-main">
          <ScreenplayEditor
            ref={editorRef}
            content={state.content}
            elements={state.elements}
            onChange={updateContent}
            onCursorMove={updateFromTextarea}
            isolatedSceneIndex={state.isolatedSceneIndex}
            onExitIsolation={() => isolateScene(null)}
          />
        </main>

        {showPace && (
          <PaceMeter
            scenes={state.scenes}
            currentSceneIndex={state.currentSceneIndex}
            onSelectScene={setCurrentScene}
          />
        )}
      </div>

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
