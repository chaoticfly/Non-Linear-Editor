import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string | null;
}

// Minimal transient notification, used for undo/redo confirmation so the
// user gets feedback even when nothing visibly changes on screen.
export default function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-2 bg-editor-surface border border-editor-border rounded-lg shadow-2xl text-sm text-gray-200"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
