import { useState, useEffect, useRef } from 'react';

interface DistractionFreeEditorProps {
  isOpen: boolean;
  content: string;
  backgroundColor: string;
  onClose: (content: string) => void;
}

// Convert HTML to plain text for editing
function htmlToPlainText(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Convert plain text back to basic HTML paragraphs
function plainTextToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
    .join('');
}

export default function DistractionFreeEditor({
  isOpen,
  content,
  backgroundColor,
  onClose,
}: DistractionFreeEditorProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize text from HTML content when opening
  useEffect(() => {
    if (isOpen) {
      setText(htmlToPlainText(content));
      // Focus textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen, content]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose(plainTextToHtml(text));
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, text, onClose]);

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

  if (!isOpen) return null;

  return (
    <div className="distraction-free-overlay" style={{ backgroundColor }}>
      <div className="distraction-free-container">
        <div className="distraction-free-hint">
          Press <kbd>Esc</kbd> to exit
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing..."
          className="distraction-free-textarea"
          spellCheck
        />
      </div>
    </div>
  );
}
