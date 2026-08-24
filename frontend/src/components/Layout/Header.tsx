/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState, useEffect } from 'react';
import FileMenu from './FileMenu';
import ShortcutsDialog from '../ui/ShortcutsDialog';
import { Project } from '../../types';
import { useEditor } from '../../context/EditorContext';
import { isEditableTarget } from '../../utils/isEditableTarget';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleCompile: () => void;
  isCompileOpen: boolean;
  onProjectLoaded?: (project: Project) => void;
  onProjectSaved?: (filePath: string) => void;
}

export default function Header({ onToggleSidebar, isSidebarOpen, onToggleCompile, isCompileOpen, onProjectLoaded, onProjectSaved }: HeaderProps) {
  const { projectName, setProjectName } = useEditor();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !isEditableTarget(e.target)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
    } else {
      setTempName(projectName);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setTempName(projectName);
      setIsEditingName(false);
    }
  };

  return (
    <header className="app-header h-14 bg-editor-surface border-b border-editor-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* File Menu */}
        <FileMenu onProjectLoaded={onProjectLoaded} onProjectSaved={onProjectSaved} projectName={projectName} setProjectName={setProjectName} />

        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="brand-mark w-8 h-8 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-indigo-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </div>
          
          {/* Project Name - Editable */}
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-editor-hover text-white px-2 py-1 rounded font-semibold text-lg border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project name"
            />
          ) : (
            <h1
              onClick={() => {
                setTempName(projectName);
                setIsEditingName(true);
              }}
              className="project-title text-lg text-white cursor-pointer hover:text-indigo-200 transition-colors px-2 py-1 rounded hover:bg-editor-hover"
              title="Click to edit project name"
            >
              {projectName}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Compile toggle */}
        <button
          onClick={onToggleCompile}
          className={`p-2 rounded-lg transition-colors ${
            isCompileOpen
              ? 'bg-indigo-400/15 text-indigo-200 ring-1 ring-indigo-300/30'
              : 'text-gray-400 hover:text-white hover:bg-editor-hover'
          }`}
          title="Build a document"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>

        {/* Settings toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isSidebarOpen
              ? 'bg-editor-accent text-white'
              : 'text-gray-400 hover:text-white hover:bg-editor-hover'
          }`}
          title="Canvas settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Keyboard shortcuts reference */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-editor-hover transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      <ShortcutsDialog isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </header>
  );
}
