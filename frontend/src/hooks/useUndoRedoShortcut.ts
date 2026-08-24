import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { isEditableTarget } from '../utils/isEditableTarget';

const TOAST_DURATION_MS = 1800;

const LABELS: Record<string, string> = {
  'add marker': 'marker added',
  'edit marker': 'marker edit',
  'delete marker': 'marker delete',
  'move marker': 'marker move',
};

function describe(label: string): string {
  return LABELS[label] ?? label;
}

// Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y) for undo/redo, skipped while focus is
// in a text field so Quill/native undo still works there as expected.
export function useUndoRedoShortcut() {
  const { undo, redo } = useEditor();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const isRedoCombo = (key === 'z' && e.shiftKey) || key === 'y';
      const isUndoCombo = key === 'z' && !e.shiftKey;

      if (isUndoCombo) {
        e.preventDefault();
        const label = undo();
        showToast(label ? `Undid ${describe(label)}` : 'Nothing to undo');
      } else if (isRedoCombo) {
        e.preventDefault();
        const label = redo();
        showToast(label ? `Redid ${describe(label)}` : 'Nothing to redo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return { toastMessage };
}
