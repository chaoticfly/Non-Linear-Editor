import { useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import TimelineCanvas from './components/Canvas/TimelineCanvas';
import MarkerEditor from './components/Marker/MarkerEditor';
import CompileDrawer from './components/Compile/CompileDrawer';
import { Project } from './types';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCompileOpen, setIsCompileOpen] = useState(false);
  const { setSelectedMarkerId, setProjectName, updateConfig, setMarkers, setCompileSlots } = useEditor();

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

  const handleProjectLoaded = (project: Project) => {
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
    setSelectedMarkerId(null);
  };

  const handleProjectSaved = (filePath: string) => {
    // Show a brief notification or update window title
    console.log('Project saved to:', filePath);
  };

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
        <TimelineCanvas />
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <MarkerEditor />
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
