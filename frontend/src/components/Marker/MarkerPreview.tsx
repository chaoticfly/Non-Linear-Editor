/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { Marker } from '../../types';

interface MarkerPreviewProps {
  marker: Marker;
  x: number;
  y: number;
}

export default function MarkerPreview({ marker, x, y }: MarkerPreviewProps) {
  return (
    <div
      className="absolute pointer-events-none z-20 bg-editor-surface border border-editor-border rounded-xl shadow-2xl p-4 min-w-[200px] max-w-[300px] animate-scale-in"
      style={{
        left: x + 20,
        top: y,
        transform: 'translateY(-50%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: marker.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">
            {marker.label || 'Untitled'}
          </h3>
          {marker.category && (
            <p className="text-gray-400 text-xs">{marker.category}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {marker.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {marker.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-editor-hover text-gray-300 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content preview */}
      {marker.content && (
        <div
          className="text-sm text-gray-300 line-clamp-3 prose prose-sm prose-invert"
          dangerouslySetInnerHTML={{ __html: marker.content }}
        />
      )}

      {/* Click hint */}
      <div className="mt-3 pt-3 border-t border-editor-border text-xs text-gray-500">
        Click to edit
      </div>
    </div>
  );
}
