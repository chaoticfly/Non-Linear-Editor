import Modal from './Modal';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About" resizable={false}>
      <div className="flex flex-col items-center text-center py-4">
        {/* App Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-white mb-1">Likhi Lakeerain</h1>
        <p className="text-sm text-gray-400 mb-1 font-medium">
          Version 1.0.0
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-editor-border my-5" />

        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed max-w-sm mb-6">
          A non-linear, timeline-based editor for organizing and compiling
          your creative writing. Place markers on timelines, write rich content,
          and compile them into documents in any order.
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['Go', 'Wails', 'React', 'TypeScript', 'Tailwind CSS'].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs font-medium text-gray-400 bg-editor-hover rounded-full border border-editor-border"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Likhi Lakeerain. All rights reserved.
        </p>
      </div>
    </Modal>
  );
}
