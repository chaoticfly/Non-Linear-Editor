/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { BACKGROUND_COLOR_PALETTES, DEFAULT_BACKGROUND_COLORS } from '../../types';

export default function SettingsPanel() {
  const { config, updateConfig, markers } = useEditor();
  const selectedPreset = [...BACKGROUND_COLOR_PALETTES.dark, ...BACKGROUND_COLOR_PALETTES.light]
    .find(({ color }) => color === config.backgroundColor);

  const renderPalette = (palette: 'dark' | 'light') => (
    <div className="grid grid-cols-4 gap-2">
      {BACKGROUND_COLOR_PALETTES[palette].map(({ name, color }) => {
        const isSelected = config.backgroundColor === color;

        return (
          <button
            key={color}
            type="button"
            onClick={() => updateConfig({ backgroundColor: color })}
            className={`group relative aspect-square w-full min-w-8 overflow-hidden rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-editor-accent focus:ring-offset-2 focus:ring-offset-editor-bg ${
              isSelected
                ? 'border-white/90 ring-2 ring-editor-accent shadow-lg scale-105'
                : palette === 'dark'
                  ? 'border-white/10 hover:border-white/50 hover:-translate-y-0.5'
                  : 'border-black/15 hover:border-white/80 hover:-translate-y-0.5'
            }`}
            style={{ backgroundColor: color }}
            title={`${name} (${color})`}
            aria-label={`Use ${name} background`}
            aria-pressed={isSelected}
          >
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            {isSelected && (
              <svg className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-8 8a1 1 0 01-1.416 0l-4-4a1 1 0 011.416-1.416L8 12.586l7.296-7.294a1 1 0 011.408 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );

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
            {renderPalette('dark')}
          </div>

          {/* Light themes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Light</label>
            {renderPalette('light')}
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

          <p className="text-xs text-gray-400">
            Selected: <span className="text-gray-200">{selectedPreset?.name ?? 'Custom'}</span>
            <span className="ml-1 font-mono text-gray-500">{config.backgroundColor.toUpperCase()}</span>
          </p>
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
