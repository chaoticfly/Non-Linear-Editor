import { useMemo, useCallback, useEffect, useState, memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { calculateLineGeometries, normalizedToPosition } from '../../utils/geometry';
import { useCanvasRenderer } from './useCanvasRenderer';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { MarkerWithGeometry } from '../../types';

export default function TimelineCanvas() {
  const {
    config,
    timelines,
    markers,
    addMarker,
    selectedMarkerId,
    setSelectedMarkerId,
    openEditor,
  } = useEditor();

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size using ResizeObserver for accurate tracking
  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    // Use ResizeObserver to track container size changes (including sidebar animations)
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate line geometries based on current config and canvas size
  const lineGeometries = useMemo(() => {
    return calculateLineGeometries(
      timelines,
      config,
      canvasSize.width,
      canvasSize.height
    );
  }, [timelines, config, canvasSize]);

  // Calculate marker screen positions
  const markersWithGeometry: MarkerWithGeometry[] = useMemo(() => {
    return markers.map((marker) => {
      const line = lineGeometries.find((l) => l.id === marker.lineId);
      if (!line) {
        return { ...marker, screenX: 0, screenY: 0 };
      }

      const pos = normalizedToPosition(marker.position, line);
      return {
        ...marker,
        screenX: pos.x,
        screenY: pos.y,
      };
    });
  }, [markers, lineGeometries]);

  // Handle marker click - open editor
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      setSelectedMarkerId(markerId);
      openEditor(markerId);
    },
    [setSelectedMarkerId, openEditor]
  );

  // Handle line click - add new marker
  const handleLineClick = useCallback(
    (lineId: string, position: number) => {
      const newMarker = addMarker(lineId, position);
      setSelectedMarkerId(newMarker.id);
      openEditor(newMarker.id);
    },
    [addMarker, setSelectedMarkerId, openEditor]
  );

  // Canvas interaction (hover, click detection)
  const {
    hoveredMarkerId,
    hoverSnapPoint,
    handleMouseMove,
    handleMouseLeave,
    handleClick,
  } = useCanvasInteraction({
    lineGeometries,
    markers: markersWithGeometry,
    snapThreshold: config.snapThreshold,
    onMarkerClick: handleMarkerClick,
    onLineClick: handleLineClick,
  });

  // Canvas renderer
  const canvasRef = useCanvasRenderer({
    lineGeometries,
    markers: markersWithGeometry,
    hoveredMarkerId,
    selectedMarkerId,
    hoverSnapPoint,
  });

  return (
    <div
      id="canvas-container"
      className="flex-1 min-w-0 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: config.backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Tooltip for hovered marker */}
      {hoveredMarkerId && (
        <MarkerTooltip
          marker={markersWithGeometry.find((m) => m.id === hoveredMarkerId)}
        />
      )}
    </div>
  );
}

interface MarkerTooltipProps {
  marker: MarkerWithGeometry | undefined;
}

const MarkerTooltip = memo(function MarkerTooltip({ marker }: MarkerTooltipProps) {
  if (!marker) return null;

  // Strip HTML tags for plain text preview
  const contentPreview = marker.content
    ? marker.content.replace(/<[^>]*>/g, '').slice(0, 150)
    : '';

  return (
    <div
      className="absolute pointer-events-none z-10 bg-editor-surface border border-editor-border rounded-lg shadow-xl px-3 py-2 text-sm animate-fade-in max-w-xs"
      style={{
        left: marker.screenX + 15,
        top: marker.screenY - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: marker.color }}
        />
        <span className="text-white font-medium truncate">
          {marker.label || 'Untitled marker'}
        </span>
      </div>
      {marker.category && (
        <div className="text-gray-400 text-xs mt-1">{marker.category}</div>
      )}
      {marker.tags.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {marker.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-editor-hover text-gray-300 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {marker.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{marker.tags.length - 3}
            </span>
          )}
        </div>
      )}
      {contentPreview && (
        <div className="mt-2 pt-2 border-t border-editor-border text-gray-300 text-xs line-clamp-3">
          {contentPreview}
          {marker.content && marker.content.replace(/<[^>]*>/g, '').length > 150 && '...'}
        </div>
      )}
    </div>
  );
});
