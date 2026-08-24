import Modal from './Modal';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Project',
    shortcuts: [
      { keys: 'Ctrl+N', description: 'New project' },
      { keys: 'Ctrl+O', description: 'Open project' },
      { keys: 'Ctrl+S', description: 'Save project' },
      { keys: 'Ctrl+Shift+S', description: 'Save project as...' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Shift+Z / Ctrl+Y', description: 'Redo' },
      { keys: 'Click a line', description: 'Add a marker' },
    ],
  },
  {
    title: 'Marker editor',
    shortcuts: [
      { keys: 'Ctrl+S', description: 'Save marker & close' },
      { keys: 'Ctrl+Shift+F', description: 'Distraction-free full-screen mode' },
      { keys: 'Esc', description: 'Close popup / exit full-screen' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: '?', description: 'Show this shortcuts reference' },
    ],
  },
];

export default function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" resizable={false}>
      <div className="space-y-6 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys + shortcut.description}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-gray-300">{shortcut.description}</span>
                  <kbd className="flex-shrink-0 px-2 py-1 bg-editor-hover border border-editor-border rounded text-xs text-gray-300 font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
