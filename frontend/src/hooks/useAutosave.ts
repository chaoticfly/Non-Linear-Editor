import { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import * as wails from '../services/wails';
import { Project } from '../types';

const AUTOSAVE_DELAY_MS = 4000;

// Debounced crash/forgot-to-save protection: writes a recovery snapshot a
// few seconds after edits settle. Never touches the user's actual save
// file, so it's purely additive safety, not a replacement for Save.
export function useAutosave() {
  const { projectName, config, markers, compileSlots, narrativePaths, activeNarrativePathId } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip the mount/load pass so opening a project doesn't immediately
    // rewrite the autosave file with a no-op snapshot.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Nothing worth protecting yet
    if (markers.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const project: Project = {
        id: 'autosave',
        name: projectName,
        config,
        markers,
        compileSlots,
        narrativePaths,
        activeNarrativePathId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      wails.autosaveProject(project);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectName, config, markers, compileSlots, narrativePaths, activeNarrativePathId]);
}
