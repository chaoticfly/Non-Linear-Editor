import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as wails from '../../services/wails';
import { Project, DEFAULT_CONFIG } from '../../types';
import ConfirmDialog from '../ui/ConfirmDialog';
import AboutDialog from '../ui/AboutDialog';
import { isEditableTarget } from '../../utils/isEditableTarget';

interface FileMenuProps {
  onProjectLoaded?: (project: Project) => void;
  onProjectSaved?: (filePath: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
}

export default function FileMenu({ onProjectLoaded, onProjectSaved, projectName, setProjectName }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<wails.RecentProject[]>([]);
  const [currentFilePath, setCurrentFilePath] = useState<string>('');
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { markers, config, compileSlots, narrativePaths, activeNarrativePathId, isEditorOpen } = useEditor();

  useEffect(() => {
    if (isOpen) {
      loadRecentProjects();
      loadCurrentFilePath();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadCurrentFilePath = async () => {
    try {
      const path = await wails.getCurrentFilePath();
      setCurrentFilePath(path || '');
    } catch (error) {
      console.error('Failed to get current file path:', error);
    }
  };

  const loadRecentProjects = async () => {
    try {
      const recent = await wails.getRecentProjects();
      setRecentProjects(recent || []);
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  };

  const createNewProject = useCallback(async () => {
    try {
      const newProj: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Untitled Project',
        config: {
          ...config,
          backgroundColor: DEFAULT_CONFIG.backgroundColor,
        },
        markers: [],
        compileSlots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjectName('Untitled Project');
      setCurrentFilePath('');
      await wails.clearCurrentFilePath();
      await wails.clearAutosave();
      onProjectLoaded?.(newProj);
    } catch (error) {
      console.error('Failed to create new project:', error);
    }
  }, [config, setProjectName, onProjectLoaded]);

  const handleNewProject = useCallback(() => {
    setIsOpen(false);
    // If there are markers, confirm before discarding
    if (markers.length > 0) {
      setShowNewConfirm(true);
    } else {
      createNewProject();
    }
  }, [markers.length, createNewProject]);

  const handleConfirmNew = useCallback(() => {
    setShowNewConfirm(false);
    createNewProject();
  }, [createNewProject]);

  const handleOpenProject = async () => {
    try {
      const project = await wails.loadProject();
      if (project) {
        setProjectName(project.name || 'Untitled Project');
        onProjectLoaded?.(project);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
    }
    setIsOpen(false);
  };

  const handleSaveProject = async (project: Project) => {
    try {
      const filePath = await wails.saveProject(project);
      if (filePath) {
        setCurrentFilePath(filePath);
        onProjectSaved?.(filePath);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
    setIsOpen(false);
  };

  const handleSaveAsProject = async (project: Project) => {
    try {
      const filePath = await wails.saveProjectAs(project);
      if (filePath) {
        setCurrentFilePath(filePath);
        onProjectSaved?.(filePath);
      }
    } catch (error) {
      console.error('Failed to save project as:', error);
    }
    setIsOpen(false);
  };

  const handleOpenRecent = async (path: string) => {
    try {
      const project = await wails.loadProjectFromPath(path);
      if (project) {
        setProjectName(project.name || 'Untitled Project');
        onProjectLoaded?.(project);
      }
    } catch (error) {
      console.error('Failed to open recent project:', error);
    }
    setIsOpen(false);
  };

  const handleExit = useCallback(() => {
    setIsOpen(false);
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    setShowExitConfirm(false);
    await wails.quit();
  }, []);

  const handleAbout = useCallback(() => {
    setIsOpen(false);
    setShowAbout(true);
  }, []);

  const currentProject: Project = useMemo(() => ({
    id: Math.random().toString(36).substr(2, 9),
    name: projectName,
    config,
    markers,
    compileSlots,
    narrativePaths,
    activeNarrativePathId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [projectName, config, markers, compileSlots, narrativePaths, activeNarrativePathId]);

  // Global Ctrl+N/O/S/Shift+S. The marker editor popup owns Ctrl+S for
  // itself while open, so this defers to it rather than double-saving.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (isEditableTarget(e.target)) return;
      if (isEditorOpen) return;
      if (showNewConfirm || showExitConfirm || showAbout) return;

      const key = e.key.toLowerCase();

      if (key === 'n') {
        e.preventDefault();
        handleNewProject();
      } else if (key === 'o') {
        e.preventDefault();
        handleOpenProject();
      } else if (key === 's' && e.shiftKey) {
        e.preventDefault();
        handleSaveAsProject(currentProject);
      } else if (key === 's') {
        e.preventDefault();
        if (currentFilePath) {
          handleSaveProject(currentProject);
        } else {
          handleSaveAsProject(currentProject);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditorOpen, showNewConfirm, showExitConfirm, showAbout,
    currentFilePath, currentProject, handleNewProject,
  ]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-editor-hover rounded-lg transition-colors"
          title="File menu"
        >
          File
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute left-0 mt-0 w-56 bg-editor-surface border border-editor-border rounded-lg shadow-lg z-50 py-1">
            {/* New */}
            <button
              onClick={handleNewProject}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white flex items-center justify-between group transition-colors"
            >
              <span>New Project</span>
              <span className="text-xs text-gray-500 group-hover:text-gray-400">Ctrl+N</span>
            </button>

            {/* Open */}
            <button
              onClick={handleOpenProject}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white flex items-center justify-between group transition-colors"
            >
              <span>Open Project</span>
              <span className="text-xs text-gray-500 group-hover:text-gray-400">Ctrl+O</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-editor-border my-1" />

            {/* Save */}
            <button
              onClick={() => handleSaveProject(currentProject)}
              disabled={!currentFilePath}
              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between group transition-colors ${
                currentFilePath
                  ? 'text-gray-300 hover:bg-editor-hover hover:text-white'
                  : 'text-gray-500 cursor-not-allowed bg-opacity-50'
              }`}
              title={currentFilePath ? 'Save to current file' : 'Use Save As to choose a location first'}
            >
              <span>{currentFilePath ? 'Save Project' : 'Save (unsaved)'}</span>
              <span className={`text-xs ${currentFilePath ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600'}`}>
                Ctrl+S
              </span>
            </button>

            {/* Save As */}
            <button
              onClick={() => handleSaveAsProject(currentProject)}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white flex items-center justify-between group transition-colors"
              title="Save to a new or different location"
            >
              <span>Save As...</span>
              <span className="text-xs text-gray-500 group-hover:text-gray-400">Ctrl+Shift+S</span>
            </button>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <>
                <div className="h-px bg-editor-border my-1" />
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Projects
                </div>
                {recentProjects.slice(0, 5).map((project, index) => (
                  <button
                    key={index}
                    onClick={() => handleOpenRecent(project.path)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white transition-colors truncate"
                    title={project.path}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-gray-500 truncate">{project.path}</div>
                  </button>
                ))}
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-editor-border my-1" />

            {/* About */}
            <button
              onClick={handleAbout}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>About</span>
            </button>

            {/* Exit */}
            <button
              onClick={handleExit}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Exit</span>
              </div>
              <span className="text-xs text-gray-500 group-hover:text-gray-400">Alt+F4</span>
            </button>
          </div>
        )}
      </div>

      {/* New Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showNewConfirm}
        title="New Project"
        message="You have unsaved markers in your current project. Creating a new project will discard all current work. Are you sure you want to continue?"
        confirmLabel="New Project"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmNew}
        onCancel={() => setShowNewConfirm(false)}
      />

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit Application"
        message="Are you sure you want to exit? Any unsaved changes will be lost."
        confirmLabel="Exit"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* About Dialog */}
      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}
