import { useState, useEffect, useCallback } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import TimelineCanvas from './components/Canvas/TimelineCanvas';
import MarkerEditor from './components/Marker/MarkerEditor';
import CompileDrawer from './components/Compile/CompileDrawer';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Toast from './components/ui/Toast';
import { useAutosave } from './hooks/useAutosave';
import { useUndoRedoShortcut } from './hooks/useUndoRedoShortcut';
import * as wails from './services/wails';
import { Project, AutosaveEnvelope } from './types';
import { Events } from '@wailsio/runtime';

function AppContent() {
  // Keep configuration close without letting it compete with the thinking surface.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompileOpen, setIsCompileOpen] = useState(false);
  const [pendingRecovery, setPendingRecovery] = useState<AutosaveEnvelope | null>(null);
  const { setSelectedMarkerId, setProjectName, updateConfig, setMarkers, setCompileSlots, setNarrativePaths } = useEditor();

  useAutosave();
  const { toastMessage } = useUndoRedoShortcut();

  const handleToggleCompile = () => {
    setIsCompileOpen(!isCompileOpen);
    // Close sidebar when opening compile to give more space
    if (!isCompileOpen && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    // Close compile when opening sidebar
    if (!isSidebarOpen && isCompileOpen) {
      setIsCompileOpen(false);
    }
  };

  const handleProjectLoaded = useCallback((project: Project) => {
    // Update editor state with loaded project data
    setProjectName(project.name || 'Untitled Project');
    updateConfig(project.config);
    // Parse date strings back to Date objects when loading markers from JSON
    const loadedMarkers = (project.markers || []).map(marker => ({
      ...marker,
      createdAt: new Date(marker.createdAt),
      updatedAt: new Date(marker.updatedAt),
    }));
    setMarkers(loadedMarkers);
    setCompileSlots(project.compileSlots || []);
    setNarrativePaths(project.narrativePaths || [{ id: 'main', name: 'Draft', markerIds: project.compileSlots || [] }], project.activeNarrativePathId);
    setSelectedMarkerId(null);
  }, [setProjectName, updateConfig, setMarkers, setCompileSlots, setNarrativePaths, setSelectedMarkerId]);

  const handleProjectSaved = (filePath: string) => {
    // A deliberate save supersedes the recovery snapshot
    wails.clearAutosave();
    console.log('Project saved to:', filePath);
  };

  // On launch, offer to recover a snapshot left behind by a crash or an
  // unsaved exit.
  useEffect(() => {
    wails.hasAutosave().then((exists) => {
      if (!exists) return;
      wails.loadAutosave().then((envelope) => {
        if (envelope) setPendingRecovery(envelope);
      });
    });
  }, []);

  // Native tray commands are routed through the same project-loading path as
  // the File menu, so state and recent-project tracking stay consistent.
  useEffect(() => {
    const offNew = Events.On('tray:new-project', async () => {
      const project = await wails.newProject();
      if (!project) return;
      handleProjectLoaded(project);
      await wails.clearCurrentFilePath();
    });
    const offOpen = Events.On('tray:open-project', async () => {
      const project = await wails.loadProject();
      if (project) handleProjectLoaded(project);
    });

    return () => {
      offNew();
      offOpen();
    };
  }, [handleProjectLoaded]);

  const handleRecoverAutosave = useCallback(() => {
    if (!pendingRecovery) return;
    handleProjectLoaded(pendingRecovery.project);
    setPendingRecovery(null);
  }, [pendingRecovery, handleProjectLoaded]);

  const handleDiscardAutosave = useCallback(() => {
    wails.clearAutosave();
    setPendingRecovery(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-editor-bg">
      <Header
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onToggleCompile={handleToggleCompile}
        isCompileOpen={isCompileOpen}
        onProjectLoaded={handleProjectLoaded}
        onProjectSaved={handleProjectSaved}
      />

      <div className="flex-1 flex overflow-hidden">
        <CompileDrawer isOpen={isCompileOpen} />
        <TimelineCanvas isNarrativeMode={isCompileOpen} />
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <MarkerEditor />

      <ConfirmDialog
        isOpen={pendingRecovery !== null}
        title="Recover unsaved changes?"
        message={
          pendingRecovery
            ? `We found unsaved work from "${pendingRecovery.project.name || 'Untitled Project'}", ` +
              `autosaved at ${new Date(pendingRecovery.savedAt).toLocaleString()}. ` +
              `Recover it, or discard and start from your last save?`
            : ''
        }
        confirmLabel="Recover"
        cancelLabel="Discard"
        variant="info"
        onConfirm={handleRecoverAutosave}
        onCancel={handleDiscardAutosave}
      />

      <Toast message={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}
