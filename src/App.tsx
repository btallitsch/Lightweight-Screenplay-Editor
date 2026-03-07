/**
 * App.tsx — Root application component
 */
import { useState, useCallback } from 'react';
import { useScreenplay } from './hooks/useScreenplay';
import { useAutoSave, loadSavedContent } from './hooks/useAutoSave';
import { EditorToolbar } from './components/Editor/EditorToolbar';
import { ScreenplayEditor } from './components/Editor/ScreenplayEditor';
import { ScenePanel } from './components/ScenePanel/ScenePanel';
import { PaceMeter } from './components/PaceMeter/PaceMeter';
import { VersionHistory } from './components/VersionHistory/VersionHistory';
import { exportAsFountain, exportAsText, downloadFile, sanitizeFilename } from './utils/export';
import './styles/globals.css';
import './App.css';

const savedContent = loadSavedContent();

export default function App() {
  const [showPace, setShowPace] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    state, titleData,
    updateContent, updateTitle,
    isolateScene, setCurrentScene, markSaved,
  } = useScreenplay(savedContent ?? undefined);

  const { versions, saveNow, restoreVersion, deleteVersion, clearHistory } = useAutoSave(
    state.content,
    state.wordCount,
    state.pageCount,
    markSaved
  );

  const handleSaveNow = useCallback(() => {
    saveNow(state.content, state.wordCount, state.pageCount);
  }, [saveNow, state.content, state.wordCount, state.pageCount]);

  const handleRestore = useCallback((id: string) => {
    const restored = restoreVersion(id);
    if (restored) {
      updateContent(restored);
      setShowHistory(false);
    }
  }, [restoreVersion, updateContent]);

  const handleExportFountain = useCallback(() => {
    const text = exportAsFountain(state.elements, titleData, state.title);
    downloadFile(text, `${sanitizeFilename(state.title)}.fountain`, 'text/plain');
  }, [state.elements, state.title, titleData]);

  const handleExportText = useCallback(() => {
    const text = exportAsText(state.elements, titleData, state.title);
    downloadFile(text, `${sanitizeFilename(state.title)}.txt`, 'text/plain');
  }, [state.elements, state.title, titleData]);

  const handleIsolateScene = useCallback((index: number | null) => {
    isolateScene(index);
  }, [isolateScene]);

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

      <div className="app-body">
        <ScenePanel
          scenes={state.scenes}
          currentSceneIndex={state.currentSceneIndex}
          isolatedSceneIndex={state.isolatedSceneIndex}
          onSelectScene={setCurrentScene}
          onIsolateScene={handleIsolateScene}
        />

        <main className="editor-main">
          <ScreenplayEditor
            content={state.content}
            elements={state.elements}
            onChange={updateContent}
            isolatedSceneIndex={state.isolatedSceneIndex}
            onSceneChange={setCurrentScene}
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
