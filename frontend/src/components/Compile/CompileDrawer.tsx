import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useEditor } from '../../context/EditorContext';
import { CompiledSection } from '../../types';
import * as wails from '../../services/wails';
import Button from '../ui/Button';

interface CompileDrawerProps {
  isOpen: boolean;
}

export default function CompileDrawer({ isOpen }: CompileDrawerProps) {
  const {
    markers,
    compileSlots,
    addToCompile,
    removeFromCompile,
    reorderCompile,
    clearCompile,
    getMarkerById,
  } = useEditor();

  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);

  // Get markers not yet in compile - memoized to avoid recomputation
  const availableMarkers = useMemo(
    () => markers.filter(m => !compileSlots.includes(m.id)),
    [markers, compileSlots]
  );

  // Get compiled markers in order - memoized to avoid recomputation
  const compiledMarkers = useMemo(
    () => compileSlots
      .map(id => getMarkerById(id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined),
    [compileSlots, getMarkerById]
  );

  // Collect unique tags from available markers for auto-add
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    availableMarkers.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [availableMarkers]);

  // Auto-add all markers with a given tag
  const handleAddByTag = useCallback((tag: string) => {
    availableMarkers.forEach(m => {
      if (m.tags.includes(tag) && !compileSlots.includes(m.id)) {
        addToCompile(m.id);
      }
    });
  }, [availableMarkers, compileSlots, addToCompile]);

  // Build compiled sections with category and tags for export
  const buildCompiledSections = useCallback((): CompiledSection[] => {
    return compiledMarkers.map(m => ({
      label: m.label || 'Untitled',
      content: m.content,
      color: m.color,
      category: m.category || '',
      tags: m.tags || [],
    }));
  }, [compiledMarkers]);

  const handleDragStart = (e: React.DragEvent, markerId: string) => {
    e.dataTransfer.setData('markerId', markerId);
    setDraggedMarkerId(markerId);
  };

  const handleDragEnd = () => {
    setDraggedMarkerId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const markerId = e.dataTransfer.getData('markerId');
    if (markerId && !compileSlots.includes(markerId)) {
      addToCompile(markerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="bg-editor-surface border-l border-editor-border overflow-hidden flex-shrink-0"
        >
          <div className="w-[360px] h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-editor-border">
              <h2 className="text-lg font-semibold text-white">Compile Document</h2>
              <p className="text-sm text-gray-400 mt-1">
                Drag markers to build your document
              </p>
            </div>

            {/* Add by Tag */}
            {availableTags.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b border-editor-border">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Add by Tag
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddByTag(tag)}
                      className="text-xs px-2 py-1 bg-editor-bg text-gray-300 hover:bg-editor-accent hover:text-white rounded transition-colors border border-editor-border hover:border-editor-accent"
                      title={`Add all markers tagged "${tag}"`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Available Markers */}
            <div className="p-4 border-b border-editor-border">
              <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
                Available Markers ({availableMarkers.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableMarkers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No markers available</p>
                ) : (
                  availableMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, marker.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-2 bg-editor-bg rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-editor-border transition-all ${
                        draggedMarkerId === marker.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: marker.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate block">
                          {marker.label || 'Untitled'}
                        </span>
                        {marker.category && (
                          <span className="text-xs text-gray-500 truncate block">
                            {marker.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCompile(marker.id)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Add to compile"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compile Drop Zone */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Document Order ({compileSlots.length})
                </h3>
                {compileSlots.length > 0 && (
                  <button
                    onClick={clearCompile}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`flex-1 border-2 border-dashed rounded-lg p-3 overflow-y-auto transition-colors ${
                  compileSlots.length === 0
                    ? 'border-editor-border bg-editor-bg/50'
                    : 'border-editor-accent/30 bg-editor-bg/30'
                }`}
              >
                {compileSlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        Drop markers here to<br />build your document
                      </p>
                    </div>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={compileSlots}
                    onReorder={(newOrder) => {
                      // Find the indices that changed and call reorderCompile
                      const oldIndex = compileSlots.findIndex((id, i) => id !== newOrder[i]);
                      if (oldIndex !== -1) {
                        const newIndex = newOrder.findIndex(id => id === compileSlots[oldIndex]);
                        reorderCompile(oldIndex, newIndex);
                      }
                    }}
                    className="space-y-2"
                  >
                    {compiledMarkers.map((marker, index) => (
                      <Reorder.Item
                        key={marker.id}
                        value={marker.id}
                        className="bg-editor-surface border border-editor-border rounded-lg p-3 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-500 font-mono w-5">
                            {index + 1}.
                          </span>
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: marker.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">
                              {marker.label || 'Untitled'}
                            </div>
                            {marker.category && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {marker.category}
                              </div>
                            )}
                            {marker.content && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {marker.content.replace(/<[^>]*>/g, '').slice(0, 80)}
                                {marker.content.replace(/<[^>]*>/g, '').length > 80 && '...'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCompile(marker.id)}
                            className="text-gray-400 hover:text-red-400 p-1 flex-shrink-0"
                            title="Remove from compile"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </div>

            {/* Preview / Export */}
            {compileSlots.length > 0 && (
              <div className="p-4 border-t border-editor-border space-y-3">
                {/* ODT Export */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const filePath = await wails.exportODT(buildCompiledSections());
                      if (filePath) {
                        alert(`Document exported successfully to:\n${filePath}`);
                      }
                    } catch (error) {
                      console.error('Failed to export ODT:', error);
                      alert('Failed to export document. Please try again.');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Export to ODT
                </Button>

                {/* HTML Export */}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const filePath = await wails.exportHTML(buildCompiledSections());
                      if (filePath) {
                        alert(`HTML exported successfully to:\n${filePath}`);
                      }
                    } catch (error) {
                      console.error('Failed to export HTML:', error);
                      alert('Failed to export HTML. Please try again.');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to HTML
                </Button>

                {/* Clipboard Copy */}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    // Build properly structured HTML for rich text copy
                    const htmlContent = compiledMarkers
                      .map(m => {
                        const sectionHtml = m.content || '';
                        return `<div>${sectionHtml}</div>`;
                      })
                      .join('<br/>');

                    const wrappedHtml = `<!DOCTYPE html><html><body>${htmlContent}</body></html>`;
                    const plainText = compiledMarkers
                      .map(m => (m.content || '').replace(/<[^>]*>/g, ''))
                      .join('\n\n');

                    try {
                      // Copy as rich text (HTML) with plain text fallback
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          'text/html': new Blob([wrappedHtml], { type: 'text/html' }),
                          'text/plain': new Blob([plainText], { type: 'text/plain' }),
                        }),
                      ]);
                      alert('Rich text copied to clipboard!');
                    } catch (err) {
                      // Fallback to plain text if rich text copy fails
                      await navigator.clipboard.writeText(plainText);
                      alert('Content copied to clipboard (plain text)');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
