/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState } from 'react';
import FileMenu from './FileMenu';
import { Project } from '../../types';
import { useEditor } from '../../context/EditorContext';

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
    <header className="h-14 bg-editor-surface border-b border-editor-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* File Menu */}
        <FileMenu onProjectLoaded={onProjectLoaded} onProjectSaved={onProjectSaved} projectName={projectName} setProjectName={setProjectName} />

        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
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
              className="text-lg font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-editor-hover"
              title="Click to edit project name"
            >
              {projectName}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Help hint */}
        <div className="text-sm text-gray-400 mr-4 hidden sm:block">
          Click on a line to add a marker. To re-arrange and compile use -&gt;
        </div>

        {/* Compile toggle */}
        <button
          onClick={onToggleCompile}
          className={`p-2 rounded-lg transition-colors ${
            isCompileOpen
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-editor-hover'
          }`}
          title="Compile document"
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
          title="Toggle settings"
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
      </div>
    </header>
  );
}
