import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Marker, Timeline, EditorConfig, DEFAULT_CONFIG } from '../types';

interface EditorContextType {
  // Project
  projectName: string;
  setProjectName: (name: string) => void;

  // Config
  config: EditorConfig;
  updateConfig: (updates: Partial<EditorConfig>) => void;

  // Timelines
  timelines: Timeline[];

  // Markers
  markers: Marker[];
  setMarkers: (markers: Marker[]) => void;
  addMarker: (lineId: string, position: number) => Marker;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  deleteMarker: (id: string) => void;
  getMarkerById: (id: string) => Marker | undefined;

  // Selection
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;

  // Editor popup
  isEditorOpen: boolean;
  openEditor: (markerId: string) => void;
  closeEditor: () => void;
  editingMarkerId: string | null;

  // Compile
  compileSlots: string[]; // Array of marker IDs in compile order
  setCompileSlots: (slots: string[]) => void;
  addToCompile: (markerId: string) => void;
  removeFromCompile: (markerId: string) => void;
  reorderCompile: (fromIndex: number, toIndex: number) => void;
  clearCompile: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

function generateTimelines(config: EditorConfig): Timeline[] {
  const timelines: Timeline[] = [];

  if (config.showHorizontal) {
    for (let i = 0; i < config.horizontalLines; i++) {
      timelines.push({
        id: `h-${i}`,
        orientation: 'horizontal',
        index: i,
        label: `H${i + 1}`,
      });
    }
  }

  if (config.showVertical) {
    for (let i = 0; i < config.verticalLines; i++) {
      timelines.push({
        id: `v-${i}`,
        orientation: 'vertical',
        index: i,
        label: `V${i + 1}`,
      });
    }
  }

  return timelines;
}

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [config, setConfig] = useState<EditorConfig>(DEFAULT_CONFIG);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [compileSlots, setCompileSlots] = useState<string[]>([]);

  const timelines = useMemo(() => generateTimelines(config), [
    config.horizontalLines,
    config.verticalLines,
    config.showHorizontal,
    config.showVertical,
  ]);

  const updateConfig = useCallback((updates: Partial<EditorConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addMarker = useCallback((lineId: string, position: number): Marker => {
    const newMarker: Marker = {
      id: uuidv4(),
      lineId,
      position,
      label: '',
      content: '',
      tags: [],
      category: '',
      color: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMarkers(prev => [...prev, newMarker]);
    return newMarker;
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<Marker>) => {
    setMarkers(prev => prev.map(marker =>
      marker.id === id
        ? { ...marker, ...updates, updatedAt: new Date() }
        : marker
    ));
  }, []);

  const deleteMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
    }
    if (editingMarkerId === id) {
      setIsEditorOpen(false);
      setEditingMarkerId(null);
    }
  }, [selectedMarkerId, editingMarkerId]);

  const getMarkerById = useCallback((id: string) => {
    return markers.find(m => m.id === id);
  }, [markers]);

  const openEditor = useCallback((markerId: string) => {
    setEditingMarkerId(markerId);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingMarkerId(null);
  }, []);

  const addToCompile = useCallback((markerId: string) => {
    setCompileSlots(prev => {
      if (prev.includes(markerId)) return prev;
      return [...prev, markerId];
    });
  }, []);

  const removeFromCompile = useCallback((markerId: string) => {
    setCompileSlots(prev => prev.filter(id => id !== markerId));
  }, []);

  const reorderCompile = useCallback((fromIndex: number, toIndex: number) => {
    setCompileSlots(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearCompile = useCallback(() => {
    setCompileSlots([]);
  }, []);

  const setMarkersCallback = useCallback((newMarkers: Marker[]) => {
    setMarkers(newMarkers);
  }, []);

  const setCompileSlotsCallback = useCallback((slots: string[]) => {
    setCompileSlots(slots);
  }, []);

  const value: EditorContextType = useMemo(() => ({
    projectName,
    setProjectName,
    config,
    updateConfig,
    timelines,
    markers,
    setMarkers: setMarkersCallback,
    addMarker,
    updateMarker,
    deleteMarker,
    getMarkerById,
    selectedMarkerId,
    setSelectedMarkerId,
    isEditorOpen,
    openEditor,
    closeEditor,
    editingMarkerId,
    compileSlots,
    setCompileSlots: setCompileSlotsCallback,
    addToCompile,
    removeFromCompile,
    reorderCompile,
    clearCompile,
  }), [
    projectName, setProjectName, config, updateConfig, timelines,
    markers, setMarkersCallback, addMarker, updateMarker, deleteMarker,
    getMarkerById, selectedMarkerId, setSelectedMarkerId, isEditorOpen,
    openEditor, closeEditor, editingMarkerId, compileSlots,
    setCompileSlotsCallback, addToCompile, removeFromCompile,
    reorderCompile, clearCompile,
  ]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
