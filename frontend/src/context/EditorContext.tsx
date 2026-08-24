import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Marker, Timeline, EditorConfig, DEFAULT_CONFIG, NarrativePath, Point } from '../types';

const MAX_HISTORY = 50;

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
  addMarker: (lineId: string, position: number, crossLineId?: string | null) => Marker;
  updateMarker: (id: string, updates: Partial<Marker>, historyLabel?: string) => void;
  deleteMarker: (id: string) => void;
  getMarkerById: (id: string) => Marker | undefined;

  // Selection
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;

  // Editor popup
  isEditorOpen: boolean;
  openEditor: (markerId: string, anchor?: Point) => void;
  closeEditor: () => void;
  editingMarkerId: string | null;
  editorAnchor: Point | null;

  // Compile
  compileSlots: string[]; // Array of marker IDs in compile order
  setCompileSlots: (slots: string[]) => void;
  addToCompile: (markerId: string) => void;
  removeFromCompile: (markerId: string) => void;
  reorderCompile: (fromIndex: number, toIndex: number) => void;
  clearCompile: () => void;
  narrativePaths: NarrativePath[];
  activeNarrativePathId: string;
  setNarrativePaths: (paths: NarrativePath[], activeId?: string) => void;
  createNarrativePath: (name: string) => void;
  renameNarrativePath: (id: string, name: string) => void;
  selectNarrativePath: (id: string) => void;
  deleteNarrativePath: (id: string) => void;

  // Undo/redo (covers marker add/update/delete)
  undo: () => string | null;
  redo: () => string | null;
  canUndo: boolean;
  canRedo: boolean;
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
  const [editorAnchor, setEditorAnchor] = useState<Point | null>(null);
  const [compileSlots, setCompileSlots] = useState<string[]>([]);
  const [narrativePaths, setNarrativePathsState] = useState<NarrativePath[]>([
    { id: 'main', name: 'Draft', markerIds: [] },
  ]);
  const [activeNarrativePathId, setActiveNarrativePathId] = useState('main');

  const timelines = useMemo(() => generateTimelines(config), [
    config.horizontalLines,
    config.verticalLines,
    config.showHorizontal,
    config.showVertical,
  ]);

  const updateConfig = useCallback((updates: Partial<EditorConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Undo/redo history for marker add/update/delete. Kept in refs (not
  // state) since only the imperative undo()/redo() calls need to read it —
  // canUndo/canRedo below is the only thing that needs to trigger a render.
  const markersRef = useRef<Marker[]>(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  interface HistoryEntry {
    markers: Marker[];
    label: string;
  }
  const historyPastRef = useRef<HistoryEntry[]>([]);
  const historyFutureRef = useRef<HistoryEntry[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const pushHistory = useCallback((label: string) => {
    historyPastRef.current = [
      ...historyPastRef.current,
      { markers: markersRef.current, label },
    ].slice(-MAX_HISTORY);
    historyFutureRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const resetHistory = useCallback(() => {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const undo = useCallback((): string | null => {
    const past = historyPastRef.current;
    if (past.length === 0) return null;

    const entry = past[past.length - 1];
    historyPastRef.current = past.slice(0, -1);
    historyFutureRef.current = [
      { markers: markersRef.current, label: entry.label },
      ...historyFutureRef.current,
    ].slice(0, MAX_HISTORY);

    setMarkers(entry.markers);
    setHistoryVersion(v => v + 1);
    return entry.label;
  }, []);

  const redo = useCallback((): string | null => {
    const future = historyFutureRef.current;
    if (future.length === 0) return null;

    const entry = future[0];
    historyFutureRef.current = future.slice(1);
    historyPastRef.current = [
      ...historyPastRef.current,
      { markers: markersRef.current, label: entry.label },
    ].slice(-MAX_HISTORY);

    setMarkers(entry.markers);
    setHistoryVersion(v => v + 1);
    return entry.label;
  }, []);

  const addMarker = useCallback((lineId: string, position: number, crossLineId?: string | null): Marker => {
    const newMarker: Marker = {
      id: uuidv4(),
      lineId,
      ...(crossLineId ? { crossLineId } : {}),
      position,
      label: '',
      content: '',
      tags: [],
      category: '',
      color: '#3b82f6',
      linkedMarkerIds: [],
      writingStatus: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    pushHistory('add marker');
    setMarkers(prev => [...prev, newMarker]);
    return newMarker;
  }, [pushHistory]);

  const updateMarker = useCallback((id: string, updates: Partial<Marker>, historyLabel: string = 'edit marker') => {
    pushHistory(historyLabel);
    setMarkers(prev => prev.map(marker =>
      marker.id === id
        ? { ...marker, ...updates, updatedAt: new Date() }
        : marker
    ));
  }, [pushHistory]);

  const deleteMarker = useCallback((id: string) => {
    pushHistory('delete marker');
    setMarkers(prev => prev.filter(marker => marker.id !== id));
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
    }
    if (editingMarkerId === id) {
      setIsEditorOpen(false);
      setEditingMarkerId(null);
    }
  }, [selectedMarkerId, editingMarkerId, pushHistory]);

  const getMarkerById = useCallback((id: string) => {
    return markers.find(m => m.id === id);
  }, [markers]);

  const openEditor = useCallback((markerId: string, anchor?: Point) => {
    setEditingMarkerId(markerId);
    setEditorAnchor(anchor || null);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingMarkerId(null);
    setEditorAnchor(null);
  }, []);

  const addToCompile = useCallback((markerId: string) => {
    setCompileSlots(prev => {
      if (prev.includes(markerId)) return prev;
      return [...prev, markerId];
    });
  }, []);

  useEffect(() => {
    setNarrativePathsState((paths) => paths.map((path) =>
      path.id === activeNarrativePathId ? { ...path, markerIds: compileSlots } : path
    ));
  }, [compileSlots, activeNarrativePathId]);

  const setNarrativePaths = useCallback((paths: NarrativePath[], activeId?: string) => {
    const safePaths = paths.length ? paths : [{ id: 'main', name: 'Draft', markerIds: [] }];
    const nextId = activeId && safePaths.some((path) => path.id === activeId) ? activeId : safePaths[0].id;
    setNarrativePathsState(safePaths);
    setActiveNarrativePathId(nextId);
    setCompileSlots(safePaths.find((path) => path.id === nextId)?.markerIds || []);
  }, []);

  const createNarrativePath = useCallback((name: string) => {
    const id = uuidv4();
    const path = { id, name: name.trim() || 'New path', markerIds: [] };
    setNarrativePathsState((paths) => [...paths, path]);
    setActiveNarrativePathId(id);
    setCompileSlots([]);
  }, []);

  const renameNarrativePath = useCallback((id: string, name: string) => {
    setNarrativePathsState((paths) => paths.map((path) => path.id === id ? { ...path, name: name.trim() || path.name } : path));
  }, []);

  const selectNarrativePath = useCallback((id: string) => {
    const path = narrativePaths.find((candidate) => candidate.id === id);
    if (!path) return;
    setActiveNarrativePathId(id);
    setCompileSlots(path.markerIds);
  }, [narrativePaths]);

  const deleteNarrativePath = useCallback((id: string) => {
    setNarrativePathsState((paths) => {
      if (paths.length <= 1) return paths;
      const next = paths.filter((path) => path.id !== id);
      if (id === activeNarrativePathId) {
        setActiveNarrativePathId(next[0].id);
        setCompileSlots(next[0].markerIds);
      }
      return next;
    });
  }, [activeNarrativePathId]);

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
    // Bulk replacement (loading/creating a project) starts a fresh history,
    // rather than letting undo reach back into a previous project's markers.
    resetHistory();
    setMarkers(newMarkers);
  }, [resetHistory]);

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
    editorAnchor,
    compileSlots,
    setCompileSlots: setCompileSlotsCallback,
    addToCompile,
    removeFromCompile,
    reorderCompile,
    clearCompile,
    narrativePaths,
    activeNarrativePathId,
    setNarrativePaths,
    createNarrativePath,
    renameNarrativePath,
    selectNarrativePath,
    deleteNarrativePath,
    undo,
    redo,
    canUndo: historyPastRef.current.length > 0,
    canRedo: historyFutureRef.current.length > 0,
  }), [
    projectName, setProjectName, config, updateConfig, timelines,
    markers, setMarkersCallback, addMarker, updateMarker, deleteMarker,
    getMarkerById, selectedMarkerId, setSelectedMarkerId, isEditorOpen,
    openEditor, closeEditor, editingMarkerId, editorAnchor, compileSlots,
    setCompileSlotsCallback, addToCompile, removeFromCompile,
    reorderCompile, clearCompile, narrativePaths, activeNarrativePathId,
    setNarrativePaths, createNarrativePath, renameNarrativePath, selectNarrativePath,
    deleteNarrativePath, undo, redo, historyVersion,
  ]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
