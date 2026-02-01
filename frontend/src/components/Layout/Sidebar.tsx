/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsPanel from '../Settings/SettingsPanel';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="bg-editor-surface border-l border-editor-border overflow-hidden flex-shrink-0"
        >
          <div className="w-[280px] h-full overflow-y-auto">
            <div className="p-4 border-b border-editor-border">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure your timeline view
              </p>
            </div>
            <SettingsPanel />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
