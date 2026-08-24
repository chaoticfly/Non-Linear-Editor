import { useEffect, useCallback, useRef, useState, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  title?: string;
  /** Initial size in px. Defaults to a large editing-window size; pass
   * smaller values for compact dialogs (About, shortcuts reference, etc). */
  defaultWidth?: number;
  defaultHeight?: number;
  /** Set false for small, content-sized dialogs that shouldn't be dragged
   * to arbitrary sizes. */
  resizable?: boolean;
  anchorPoint?: { x: number; y: number } | null;
  subtleBackdrop?: boolean;
}

const DEFAULT_WIDTH = 1040;
const DEFAULT_HEIGHT = 760;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

function clampSize(width: number, height: number) {
  const maxWidth = window.innerWidth * 0.96;
  const maxHeight = window.innerHeight * 0.96;
  return {
    width: Math.min(Math.max(width, MIN_WIDTH), maxWidth),
    height: Math.min(Math.max(height, MIN_HEIGHT), maxHeight),
  };
}

export default function Modal({
  isOpen,
  onClose,
  children,
  isFullscreen = false,
  onToggleFullscreen,
  title,
  defaultWidth = DEFAULT_WIDTH,
  defaultHeight = DEFAULT_HEIGHT,
  resizable = true,
  anchorPoint = null,
  subtleBackdrop = false,
}: ModalProps) {
  const [size, setSize] = useState(() => clampSize(defaultWidth, defaultHeight));
  const resizeState = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    const resize = resizeState.current;
    if (!resize) return;

    const dx = e.clientX - resize.startX;
    const dy = e.clientY - resize.startY;

    let nextWidth = resize.startWidth;
    let nextHeight = resize.startHeight;

    if (resize.direction.includes('e')) nextWidth = resize.startWidth + dx;
    if (resize.direction.includes('w')) nextWidth = resize.startWidth - dx;
    if (resize.direction.includes('s')) nextHeight = resize.startHeight + dy;
    if (resize.direction.includes('n')) nextHeight = resize.startHeight - dy;

    setSize(clampSize(nextWidth, nextHeight));
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeState.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: ReactPointerEvent) => {
      e.preventDefault();
      resizeState.current = {
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: size.width,
        startHeight: size.height,
      };
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handleResizeMove);
      window.addEventListener('pointerup', handleResizeEnd);
    },
    [size, handleResizeMove, handleResizeEnd]
  );

  // Clean up any lingering listeners if the modal unmounts mid-resize
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeEnd);
      document.body.style.userSelect = '';
    };
  }, [handleResizeMove, handleResizeEnd]);

  const edgeHandles: { direction: ResizeDirection; className: string; cursor: string }[] = [
    { direction: 'n', className: 'top-0 left-2 right-2 h-1.5', cursor: 'ns-resize' },
    { direction: 's', className: 'bottom-0 left-2 right-2 h-1.5', cursor: 'ns-resize' },
    { direction: 'e', className: 'right-0 top-2 bottom-2 w-1.5', cursor: 'ew-resize' },
    { direction: 'w', className: 'left-0 top-2 bottom-2 w-1.5', cursor: 'ew-resize' },
  ];

  const cornerHandles: { direction: ResizeDirection; className: string; cursor: string }[] = [
    { direction: 'nw', className: 'top-0 left-0 w-3 h-3', cursor: 'nwse-resize' },
    { direction: 'ne', className: 'top-0 right-0 w-3 h-3', cursor: 'nesw-resize' },
    { direction: 'sw', className: 'bottom-0 left-0 w-3 h-3', cursor: 'nesw-resize' },
    { direction: 'se', className: 'bottom-0 right-0 w-3 h-3', cursor: 'nwse-resize' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 ${anchorPoint ? '' : 'flex items-center justify-center'}`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 ${subtleBackdrop ? 'bg-black/15' : 'bg-black/60 backdrop-blur-sm'}`}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={isFullscreen ? undefined : anchorPoint ? {
              width: size.width,
              height: size.height,
              position: 'fixed',
              left: Math.min(Math.max(20, anchorPoint.x + 24), Math.max(20, window.innerWidth - size.width - 20)),
              top: Math.min(Math.max(72, anchorPoint.y + 72), Math.max(72, window.innerHeight - size.height - 20)),
            } : !resizable ? undefined : { width: size.width, height: size.height }}
            className={`relative z-10 bg-editor-surface ${anchorPoint ? 'border-0 ring-1 ring-white/10' : 'border border-editor-border'} rounded-xl shadow-2xl flex flex-col ${
              isFullscreen
                ? 'w-[95vw] h-[95vh]'
                : resizable
                ? ''
                : 'w-full max-w-2xl max-h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">
                {title || 'Edit Marker'}
              </h2>
              <div className="flex items-center gap-2">
                {onToggleFullscreen && (
                  <button
                    onClick={onToggleFullscreen}
                    className="p-2 text-gray-400 hover:text-white hover:bg-editor-hover rounded-lg transition-colors"
                    title={isFullscreen ? 'Restore window' : 'Maximize'}
                  >
                    {isFullscreen ? (
                      /* Restore window icon - two overlapping rectangles */
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="8" y="8" width="12" height="12" rx="1" />
                        <path d="M8 8V5a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1h-3" />
                      </svg>
                    ) : (
                      /* Maximize window icon - single rectangle */
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="4" y="4" width="16" height="16" rx="1" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-editor-hover rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col">
              {children}
            </div>

            {/* Resize handles (disabled while maximized, or for fixed-size dialogs) */}
            {!isFullscreen && resizable && (
              <>
                {edgeHandles.map(({ direction, className, cursor }) => (
                  <div
                    key={direction}
                    onPointerDown={handleResizeStart(direction)}
                    className={`absolute ${className}`}
                    style={{ cursor, touchAction: 'none' }}
                  />
                ))}
                {cornerHandles.map(({ direction, className, cursor }) => (
                  <div
                    key={direction}
                    onPointerDown={handleResizeStart(direction)}
                    className={`absolute ${className}`}
                    style={{ cursor, touchAction: 'none' }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
