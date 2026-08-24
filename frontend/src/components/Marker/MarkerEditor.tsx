import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEditor } from '../../context/EditorContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ColorPicker from '../ui/ColorPicker';
import DistractionFreeEditor from './DistractionFreeEditor';

const AUTO_LABEL_LENGTH = 40;

// Strips HTML markup and collapses whitespace to derive a short auto-label
// from the marker's content when the user hasn't typed one.
function deriveAutoLabel(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';
  if (text.length <= AUTO_LABEL_LENGTH) return text;
  return `${text.slice(0, AUTO_LABEL_LENGTH).trim()}…`;
}

export default function MarkerEditor() {
  const {
    isEditorOpen,
    closeEditor,
    openEditor,
    editingMarkerId,
    getMarkerById,
    updateMarker,
    deleteMarker,
    timelines,
    config,
    markers,
    editorAnchor,
  } = useEditor();

  const marker = editingMarkerId ? getMarkerById(editingMarkerId) : null;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [linkedMarkerIds, setLinkedMarkerIds] = useState<string[]>([]);
  const [writingStatus, setWritingStatus] = useState<'draft' | 'complete'>('draft');
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [showWordCount, setShowWordCount] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Sync form state with marker
  useEffect(() => {
    if (marker) {
      setLabel(marker.label);
      setContent(marker.content);
      setCategory(marker.category);
      setTags(marker.tags);
      setColor(marker.color);
      setLinkedMarkerIds(marker.linkedMarkerIds || []);
      setWritingStatus(marker.writingStatus || 'draft');
      setShowDetails(false);
    }
  }, [marker?.id]);

  // Put the caret in the content editor as soon as the popup opens, so
  // typing can start immediately without touching label/tags/category first.
  useEffect(() => {
    if (!isEditorOpen) return;
    const focusTimer = setTimeout(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      editor.focus();
      // Quill always includes a trailing newline. Position immediately before
      // it so continuing from quick capture feels like one uninterrupted act.
      editor.setSelection(Math.max(0, editor.getLength() - 1), 0, 'silent');
    }, 50);
    return () => clearTimeout(focusTimer);
  }, [isEditorOpen]);

  const persistDraft = useCallback(() => {
    if (!editingMarkerId) return;

    const finalLabel = label.trim() || deriveAutoLabel(content) || 'Untitled';

    updateMarker(editingMarkerId, {
      label: finalLabel,
      content,
      category,
      tags,
      color,
      linkedMarkerIds,
      writingStatus,
    });
    setSaveState('saved');
  }, [editingMarkerId, label, content, category, tags, color, linkedMarkerIds, writingStatus, updateMarker]);

  // Marker edits are continuously committed after a short pause. The cleanup
  // flush makes Escape/backdrop close safe even inside the debounce window.
  useEffect(() => {
    if (!isEditorOpen || !editingMarkerId) return;
    setSaveState('saving');
    const timer = setTimeout(persistDraft, 550);
    return () => clearTimeout(timer);
  }, [isEditorOpen, editingMarkerId, label, content, category, tags, color, linkedMarkerIds, writingStatus, persistDraft]);

  const handleClose = useCallback(() => {
    persistDraft();
    closeEditor();
  }, [persistDraft, closeEditor]);

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

  // Ctrl+S to save and close, Ctrl+Shift+F for distraction-free full screen
  useEffect(() => {
    if (!isEditorOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        persistDraft();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsDistractionFree(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, persistDraft]);

  const timeline = marker ? timelines.find((t) => t.id === marker.lineId) : null;
  const crossTimeline = marker?.crossLineId
    ? timelines.find((t) => t.id === marker.crossLineId)
    : null;

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

  const plainText = useMemo(() => content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), [content]);
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const linkMatch = plainText.match(/\[\[([^\]]*)$/);
  const linkQuery = linkMatch?.[1]?.toLowerCase() || '';
  const linkSuggestions = linkMatch
    ? markers.filter((candidate) => candidate.id !== editingMarkerId && candidate.label.toLowerCase().includes(linkQuery)).slice(0, 5)
    : [];
  const linkedMarkers = linkedMarkerIds.map((id) => markers.find((candidate) => candidate.id === id)).filter(Boolean);

  const insertMarkerLink = useCallback((targetId: string, targetLabel: string) => {
    const editor = quillRef.current?.getEditor();
    const selection = editor?.getSelection(true);
    if (editor && selection) {
      const beforeCaret = editor.getText(0, selection.index);
      const start = beforeCaret.lastIndexOf('[[');
      if (start >= 0) {
        editor.deleteText(start, selection.index - start, 'user');
        editor.insertText(start, `↗ ${targetLabel}`, 'link', `marker://${targetId}`, 'user');
        editor.setSelection(start + targetLabel.length + 2, 0, 'silent');
      }
    }
    setLinkedMarkerIds((ids) => ids.includes(targetId) ? ids : [...ids, targetId]);
  }, []);

  return (
    <Modal
      isOpen={isEditorOpen}
      onClose={handleClose}
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      title={marker?.label || 'Edit Marker'}
      defaultWidth={760}
      defaultHeight={680}
      anchorPoint={editorAnchor}
      subtleBackdrop
    >
      <div className="flex flex-col h-full gap-4">
        {/* Timeline info */}
        {timeline && (
          <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
            <span className="px-2 py-1 bg-editor-hover rounded">
              {timeline.orientation === 'horizontal' ? '↔' : '↕'} {timeline.label}
            </span>
            {crossTimeline && (
              <span className="px-2 py-1 bg-editor-hover rounded">
                {crossTimeline.orientation === 'horizontal' ? '↔' : '↕'} {crossTimeline.label}
              </span>
            )}
            <span>Position: {marker ? Math.round(marker.position * 100) : 0}%</span>
          </div>
        )}

        {/* Content Editor: front and center, caret ready to type */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={`h-1.5 w-1.5 rounded-full ${saveState === 'saved' ? 'bg-emerald-400' : 'bg-amber-300 animate-pulse'}`} />
              <span className="text-xs text-gray-500">{saveState === 'saved' ? 'Saved' : 'Saving…'}</span>
            </div>
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
          <div className="flex-1 bg-editor-bg rounded-lg overflow-hidden flex flex-col">
            {!isDistractionFree && (
              <ReactQuill
                ref={quillRef}
                theme="bubble"
                value={content}
                onChange={setContent}
                modules={quillModules}
                placeholder="Write your content here..."
                className="flex-1 marker-editor-quill marker-editor-bubble flex flex-col"
              />
            )}
          </div>
          {linkSuggestions.length > 0 && (
            <div className="mt-2 rounded-xl border border-editor-border bg-editor-bg p-2 shadow-xl">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-gray-500">Link a thought</div>
              {linkSuggestions.map((suggestion) => (
                <button key={suggestion.id} onMouseDown={(event) => event.preventDefault()} onClick={() => insertMarkerLink(suggestion.id, suggestion.label || 'Untitled')} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-editor-hover hover:text-white">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: suggestion.color }} />
                  {suggestion.label || 'Untitled'}
                </button>
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>Type <kbd className="rounded border border-editor-border bg-editor-hover px-1 text-gray-400">[[</kbd> to link a thought</span>
            <button onMouseEnter={() => setShowWordCount(true)} onMouseLeave={() => setShowWordCount(false)} className="min-w-[58px] text-right text-gray-600 hover:text-gray-400">
              {showWordCount ? `${wordCount} ${wordCount === 1 ? 'word' : 'words'}` : '•••'}
            </button>
          </div>
        </div>

        {linkedMarkers.length > 0 && (
          <aside className="flex-shrink-0 border-l border-editor-border/60 pl-3">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">Thought trail</div>
            <div className="flex flex-wrap gap-1.5">
              {linkedMarkers.map((linked) => linked && (
                <button key={linked.id} onClick={() => { persistDraft(); openEditor(linked.id); }} className="rounded-full border border-editor-border bg-editor-bg px-2.5 py-1 text-xs text-gray-300 hover:border-blue-400/50 hover:text-white">↗ {linked.label || 'Untitled'}</button>
              ))}
            </div>
          </aside>
        )}

        {/* Details: label, category, color, tags — tucked away below, out of the way of typing */}
        <div className="flex-shrink-0 border-t border-editor-border pt-3">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Label, category & tags
            {(label.trim() || category.trim() || tags.length > 0) && (
              <span className="text-gray-500">
                {' '}
                ({label.trim() || 'auto-labeled'}
                {category.trim() ? `, ${category.trim()}` : ''}
                {tags.length > 0 ? `, ${tags.length} tag${tags.length > 1 ? 's' : ''}` : ''})
              </span>
            )}
          </button>

          {showDetails && (
            <div className="space-y-4 mt-3">
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
                    placeholder="Auto-generated from content if left blank"
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
          )}
        </div>

        {/* Distraction-free editor overlay */}
        <DistractionFreeEditor
          isOpen={isDistractionFree}
          content={content}
          backgroundColor={config.backgroundColor}
          onChange={setContent}
          onClose={() => setIsDistractionFree(false)}
        />

        {/* Completion is optional; drafts remain first-class thoughts. */}
        <div className="flex items-center justify-between pt-4 border-t border-editor-border flex-shrink-0">
          <Button variant="danger" onClick={handleDelete}>
            Delete Marker
          </Button>
          <button onClick={() => setWritingStatus((status) => status === 'draft' ? 'complete' : 'draft')} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${writingStatus === 'complete' ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/30 bg-amber-300/5 text-amber-100/70'}`}>
            {writingStatus === 'complete' ? '✓ Complete thought' : '◌ Continue later'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
