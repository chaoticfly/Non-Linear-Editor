import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEditor } from '../../context/EditorContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ColorPicker from '../ui/ColorPicker';
import DistractionFreeEditor from './DistractionFreeEditor';

export default function MarkerEditor() {
  const {
    isEditorOpen,
    closeEditor,
    editingMarkerId,
    getMarkerById,
    updateMarker,
    deleteMarker,
    timelines,
    config,
  } = useEditor();

  const marker = editingMarkerId ? getMarkerById(editingMarkerId) : null;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('#3b82f6');

  // Sync form state with marker
  useEffect(() => {
    if (marker) {
      setLabel(marker.label);
      setContent(marker.content);
      setCategory(marker.category);
      setTags(marker.tags);
      setColor(marker.color);
    }
  }, [marker]);

  const handleSave = useCallback(() => {
    if (!editingMarkerId) return;

    updateMarker(editingMarkerId, {
      label,
      content,
      category,
      tags,
      color,
    });

    closeEditor();
  }, [editingMarkerId, label, content, category, tags, color, updateMarker, closeEditor]);

  const handleDelete = useCallback(() => {
    if (!editingMarkerId) return;

    if (window.confirm('Are you sure you want to delete this marker?')) {
      deleteMarker(editingMarkerId);
      closeEditor();
    }
  }, [editingMarkerId, deleteMarker, closeEditor]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Ctrl+S to save and close
  useEffect(() => {
    if (!isEditorOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, handleSave]);

  const timeline = marker ? timelines.find((t) => t.id === marker.lineId) : null;

  // Quill modules configuration - memoized to prevent toolbar re-renders
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean'],
    ],
  }), []);

  return (
    <Modal
      isOpen={isEditorOpen}
      onClose={closeEditor}
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      title={marker?.label || 'Edit Marker'}
    >
      <div className="flex flex-col h-full gap-6">
        {/* Top Section: Fixed metadata */}
        <div className="space-y-4 flex-shrink-0">
          {/* Timeline info */}
          {timeline && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="px-2 py-1 bg-editor-hover rounded">
                {timeline.orientation === 'horizontal' ? '↔' : '↕'} {timeline.label}
              </span>
              <span>Position: {marker ? Math.round(marker.position * 100) : 0}%</span>
            </div>
          )}

          {/* Label and Category in grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter marker label..."
                className="w-full px-4 py-2 bg-editor-bg border border-editor-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-editor-accent focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category..."
                className="w-full px-4 py-2 bg-editor-bg border border-editor-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-editor-accent focus:border-transparent"
              />
            </div>
          </div>

          {/* Color and Tags in grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color
              </label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-editor-hover text-gray-300 rounded text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-1 bg-editor-bg border border-editor-border rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-editor-accent focus:border-transparent"
                />
                <Button variant="secondary" onClick={handleAddTag} className="text-sm">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor: Flexible height takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Content
            </label>
            <button
              onClick={() => setIsDistractionFree(true)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors"
              title="Distraction-free mode"
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 bg-white rounded-lg overflow-hidden flex flex-col">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              placeholder="Write your content here..."
              className="flex-1 marker-editor-quill flex flex-col"
            />
          </div>
        </div>

        {/* Distraction-free editor overlay */}
        <DistractionFreeEditor
          isOpen={isDistractionFree}
          content={content}
          backgroundColor={config.backgroundColor}
          onClose={(updatedContent) => {
            setContent(updatedContent);
            setIsDistractionFree(false);
          }}
        />

        {/* Actions: Fixed at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-editor-border flex-shrink-0">
          <Button variant="danger" onClick={handleDelete}>
            Delete Marker
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
