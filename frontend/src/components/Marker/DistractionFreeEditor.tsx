import { useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

interface DistractionFreeEditorProps {
  isOpen: boolean;
  content: string;
  backgroundColor: string;
  onChange: (content: string) => void;
  onClose: () => void;
}

// Bubble theme keeps the toolbar hidden until text is selected, which is
// what makes this feel distraction-free rather than just "modal, but bigger".
const BUBBLE_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
  ],
};

export default function DistractionFreeEditor({
  isOpen,
  content,
  backgroundColor,
  onChange,
  onClose,
}: DistractionFreeEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (isOpen) {
      const focusTimer = setTimeout(() => {
        quillRef.current?.getEditor()?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const quillModules = useMemo(() => BUBBLE_MODULES, []);

  if (!isOpen) return null;

  return (
    <div className="distraction-free-overlay" style={{ backgroundColor }}>
      <div className="distraction-free-container">
        <div className="distraction-free-hint">
          Select text to format &middot; Press <kbd>Esc</kbd> to exit
        </div>
        <ReactQuill
          ref={quillRef}
          theme="bubble"
          value={content}
          onChange={onChange}
          modules={quillModules}
          placeholder="Start writing..."
          className="distraction-free-quill"
        />
      </div>
    </div>
  );
}
