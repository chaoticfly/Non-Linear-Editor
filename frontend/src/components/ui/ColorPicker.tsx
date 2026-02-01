/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { DEFAULT_MARKER_COLORS } from '../../types';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_MARKER_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            value === color
              ? 'ring-2 ring-white ring-offset-2 ring-offset-editor-surface scale-110'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
        />
        <div
          className={`w-8 h-8 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center ${
            !DEFAULT_MARKER_COLORS.includes(value) ? 'ring-2 ring-white ring-offset-2 ring-offset-editor-surface' : ''
          }`}
          style={{
            backgroundColor: !DEFAULT_MARKER_COLORS.includes(value) ? value : 'transparent',
          }}
        >
          {DEFAULT_MARKER_COLORS.includes(value) && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
