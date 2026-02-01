/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { DEFAULT_BACKGROUND_COLORS } from '../../types';

export default function SettingsPanel() {
  const { config, updateConfig, markers } = useEditor();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Timeline Settings
        </h3>

        {/* Horizontal Lines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Horizontal Lines</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateConfig({
                    horizontalLines: Math.max(0, config.horizontalLines - 1),
                  })
                }
                className="w-8 h-8 flex items-center justify-center bg-editor-hover hover:bg-editor-border rounded-lg text-white transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-white font-mono">
                {config.horizontalLines}
              </span>
              <button
                onClick={() =>
                  updateConfig({
                    horizontalLines: Math.min(30, config.horizontalLines + 1),
                  })
                }
                className="w-8 h-8 flex items-center justify-center bg-editor-hover hover:bg-editor-border rounded-lg text-white transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showHorizontal}
              onChange={(e) => updateConfig({ showHorizontal: e.target.checked })}
              className="w-4 h-4 rounded border-editor-border bg-editor-bg text-editor-accent focus:ring-editor-accent focus:ring-offset-0"
            />
            <span className="text-sm text-gray-400">Show horizontal lines</span>
          </label>
        </div>

        {/* Divider */}
        <div className="border-t border-editor-border my-4" />

        {/* Vertical Lines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Vertical Lines</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateConfig({
                    verticalLines: Math.max(0, config.verticalLines - 1),
                  })
                }
                className="w-8 h-8 flex items-center justify-center bg-editor-hover hover:bg-editor-border rounded-lg text-white transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-white font-mono">
                {config.verticalLines}
              </span>
              <button
                onClick={() =>
                  updateConfig({
                    verticalLines: Math.min(30, config.verticalLines + 1),
                  })
                }
                className="w-8 h-8 flex items-center justify-center bg-editor-hover hover:bg-editor-border rounded-lg text-white transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showVertical}
              onChange={(e) => updateConfig({ showVertical: e.target.checked })}
              className="w-4 h-4 rounded border-editor-border bg-editor-bg text-editor-accent focus:ring-editor-accent focus:ring-offset-0"
            />
            <span className="text-sm text-gray-400">Show vertical lines</span>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-editor-border" />

      {/* Background Color */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Appearance
        </h3>

        <div className="space-y-4">
          {/* Dark themes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Dark</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_BACKGROUND_COLORS.slice(0, 8).map((color) => (
                <button
                  key={color}
                  onClick={() => updateConfig({ backgroundColor: color })}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 border-2 ${
                    config.backgroundColor === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-110 hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Light themes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Light</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_BACKGROUND_COLORS.slice(8).map((color) => (
                <button
                  key={color}
                  onClick={() => updateConfig({ backgroundColor: color })}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 border-2 ${
                    config.backgroundColor === color
                      ? 'border-editor-accent scale-110'
                      : 'border-gray-400 hover:scale-110 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Custom</label>
            <div className="relative inline-block">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
              />
              <div
                className={`w-8 h-8 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center ${
                  !DEFAULT_BACKGROUND_COLORS.includes(config.backgroundColor)
                    ? 'border-white border-solid'
                    : ''
                }`}
                style={{
                  backgroundColor: !DEFAULT_BACKGROUND_COLORS.includes(config.backgroundColor)
                    ? config.backgroundColor
                    : 'transparent',
                }}
              >
                {DEFAULT_BACKGROUND_COLORS.includes(config.backgroundColor) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-editor-border" />

      {/* Stats */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-editor-hover rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{markers.length}</div>
            <div className="text-xs text-gray-400">Total Markers</div>
          </div>
          <div className="bg-editor-hover rounded-lg p-3">
            <div className="text-2xl font-bold text-white">
              {config.horizontalLines + config.verticalLines}
            </div>
            <div className="text-xs text-gray-400">Total Lines</div>
          </div>
        </div>
      </div>
    </div>
  );
}
