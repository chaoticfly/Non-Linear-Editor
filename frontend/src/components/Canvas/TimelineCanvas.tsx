import { useMemo, useCallback, useEffect, useState, useRef, memo, KeyboardEvent as ReactKeyboardEvent, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useEditor } from '../../context/EditorContext';
import { calculateLineGeometries, normalizedToPosition, getLineStops, getNextStop } from '../../utils/geometry';
import { useCanvasRenderer } from './useCanvasRenderer';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { MarkerWithGeometry } from '../../types';

const FORWARD_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const BACKWARD_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

interface TimelineCanvasProps { isNarrativeMode?: boolean; }

export default function TimelineCanvas({ isNarrativeMode = false }: TimelineCanvasProps) {
  const {
    config,
    timelines,
    markers,
    addMarker,
    updateMarker,
    deleteMarker,
    selectedMarkerId,
    setSelectedMarkerId,
    isEditorOpen,
    openEditor,
    compileSlots,
    addToCompile,
    removeFromCompile,
    reorderCompile,
  } = useEditor();

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [quickCapture, setQuickCapture] = useState<{
    markerId: string;
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [markerDrag, setMarkerDrag] = useState<{
    markerId: string;
    lineId: string;
    startX: number;
    startY: number;
    position: number;
    moved: boolean;
  } | null>(null);
  const draggedPathMarkerRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const suppressPathClickRef = useRef(false);
  const suppressMarkerClickRef = useRef(false);
  const interactionHandlersRef = useRef<{
    move?: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
    click?: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
  }>({});

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

      const effectivePosition = markerDrag?.markerId === marker.id ? markerDrag.position : marker.position;
      const pos = normalizedToPosition(effectivePosition, line);
      return {
        ...marker,
        screenX: pos.x,
        screenY: pos.y,
      };
    });
  }, [markers, lineGeometries, markerDrag]);

  // Handle marker click - open editor
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      setSelectedMarkerId(markerId);
      if (isNarrativeMode) {
        if (suppressPathClickRef.current) {
          suppressPathClickRef.current = false;
          return;
        }
        if (compileSlots.includes(markerId)) removeFromCompile(markerId);
        else addToCompile(markerId);
        return;
      }
      const marker = markersWithGeometry.find((candidate) => candidate.id === markerId);
      openEditor(markerId, marker ? { x: marker.screenX, y: marker.screenY } : undefined);
    },
    [setSelectedMarkerId, openEditor, isNarrativeMode, compileSlots, addToCompile, removeFromCompile, markersWithGeometry]
  );

  const markerAtPointer = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return markersWithGeometry.find((marker) => Math.hypot(marker.screenX - x, marker.screenY - y) <= 18);
  }, [markersWithGeometry]);

  const handlePathDragStart = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    const marker = markerAtPointer(event);
    if (!marker) return;
    if (!isNarrativeMode) {
      setMarkerDrag({
        markerId: marker.id,
        lineId: marker.lineId,
        startX: event.clientX,
        startY: event.clientY,
        position: marker.position,
        moved: false,
      });
      return;
    }
    if (marker && compileSlots.includes(marker.id)) {
      draggedPathMarkerRef.current = { id: marker.id, x: event.clientX, y: event.clientY };
      event.currentTarget.style.cursor = 'grabbing';
    }
  }, [isNarrativeMode, markerAtPointer, compileSlots]);

  const handleMarkerDragMove = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!markerDrag || isNarrativeMode) {
      interactionHandlersRef.current.move?.(event);
      return;
    }

    const line = lineGeometries.find((candidate) => candidate.id === markerDrag.lineId);
    if (!line) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const span = line.orientation === 'horizontal'
      ? line.end.x - line.start.x
      : line.end.y - line.start.y;
    const rawPosition = line.orientation === 'horizontal'
      ? (pointerX - line.start.x) / span
      : (pointerY - line.start.y) / span;
    const clampedPosition = Math.max(0, Math.min(1, rawPosition));
    const stops = getLineStops(line.orientation, config);
    const nearestStop = stops.reduce(
      (nearest, stop) => Math.abs(stop - clampedPosition) < Math.abs(nearest - clampedPosition) ? stop : nearest,
      stops[0] ?? clampedPosition
    );
    const position = Math.abs(nearestStop - clampedPosition) * span <= config.snapThreshold
      ? nearestStop
      : clampedPosition;
    const moved = markerDrag.moved || Math.hypot(event.clientX - markerDrag.startX, event.clientY - markerDrag.startY) > 4;
    setMarkerDrag({ ...markerDrag, position, moved });
    event.currentTarget.style.cursor = line.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize';
  }, [markerDrag, isNarrativeMode, lineGeometries, config]);

  const handlePathDragEnd = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (markerDrag && !isNarrativeMode) {
      event.currentTarget.style.cursor = '';
      if (markerDrag.moved) {
        const line = lineGeometries.find((candidate) => candidate.id === markerDrag.lineId);
        const point = line ? normalizedToPosition(markerDrag.position, line) : null;
        const perpendicular = lineGeometries
          .filter((candidate) => candidate.orientation !== line?.orientation)
          .map((candidate) => ({
            line: candidate,
            distance: point
              ? candidate.orientation === 'vertical'
                ? Math.abs(candidate.start.x - point.x)
                : Math.abs(candidate.start.y - point.y)
              : Infinity,
          }))
          .sort((a, b) => a.distance - b.distance)[0];
        updateMarker(markerDrag.markerId, {
          position: markerDrag.position,
          crossLineId: perpendicular && perpendicular.distance <= config.snapThreshold ? perpendicular.line.id : undefined,
        }, 'move marker');
        suppressMarkerClickRef.current = true;
      }
      setMarkerDrag(null);
      return;
    }
    const dragged = draggedPathMarkerRef.current;
    draggedPathMarkerRef.current = null;
    event.currentTarget.style.cursor = '';
    if (!dragged) return;
    const moved = Math.hypot(event.clientX - dragged.x, event.clientY - dragged.y) > 5;
    if (!moved) return;
    suppressPathClickRef.current = true;
    const target = markerAtPointer(event);
    if (!target || target.id === dragged.id || !compileSlots.includes(target.id)) return;
    reorderCompile(compileSlots.indexOf(dragged.id), compileSlots.indexOf(target.id));
  }, [markerDrag, isNarrativeMode, lineGeometries, updateMarker, config.snapThreshold, markerAtPointer, compileSlots, reorderCompile]);

  const handleCanvasClick = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (suppressMarkerClickRef.current) {
      suppressMarkerClickRef.current = false;
      return;
    }
    interactionHandlersRef.current.click?.(event);
  }, []);

  // Capture the thought where it occurred; deeper editing remains optional.
  const handleLineClick = useCallback(
    (lineId: string, position: number, crossLineId: string | null) => {
      const newMarker = addMarker(lineId, position, crossLineId);
      setSelectedMarkerId(newMarker.id);
      const line = lineGeometries.find((candidate) => candidate.id === lineId);
      const point = line ? normalizedToPosition(position, line) : { x: 0, y: 0 };
      setQuickCapture({ markerId: newMarker.id, x: point.x, y: point.y, value: '' });
    },
    [addMarker, setSelectedMarkerId, lineGeometries]
  );

  const finishQuickCapture = useCallback((openFullEditor = false) => {
    if (!quickCapture) return;
    const thought = quickCapture.value.trim();

    if (!thought) {
      deleteMarker(quickCapture.markerId);
      setQuickCapture(null);
      return;
    }

    const escapedThought = thought
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    updateMarker(quickCapture.markerId, {
      label: thought.length > 48 ? `${thought.slice(0, 48).trim()}…` : thought,
      content: `<p>${escapedThought}</p>`,
    }, 'capture thought');
    const markerId = quickCapture.markerId;
    setQuickCapture(null);
    if (openFullEditor) openEditor(markerId);
  }, [quickCapture, deleteMarker, updateMarker, openEditor]);

  const handleQuickCaptureSubmit = useCallback((event: FormEvent) => {
    event.preventDefault();
    finishQuickCapture(false);
  }, [finishQuickCapture]);

  // Marker order for Tab/Shift+Tab cycling: by timeline (horizontal before
  // vertical, then index), then position along the line.
  const orderedMarkers = useMemo(() => {
    const timelineOrder = new Map(timelines.map((t, i) => [t.id, i]));
    return [...markers].sort((a, b) => {
      const orderA = timelineOrder.get(a.lineId) ?? 0;
      const orderB = timelineOrder.get(b.lineId) ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.position - b.position;
    });
  }, [markers, timelines]);

  // Keyboard navigation: Tab/Shift+Tab cycles which marker has keyboard
  // focus (shown via the existing selected-marker glow), arrow keys step it
  // along its line (half-step, joint, half-step, joint...), Enter opens it.
  const handleCanvasKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLCanvasElement>) => {
      if (orderedMarkers.length === 0) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = orderedMarkers.findIndex((m) => m.id === selectedMarkerId);
        const nextIndex = e.shiftKey
          ? currentIndex <= 0
            ? orderedMarkers.length - 1
            : currentIndex - 1
          : currentIndex === -1
          ? 0
          : (currentIndex + 1) % orderedMarkers.length;
        setSelectedMarkerId(orderedMarkers[nextIndex].id);
        return;
      }

      if (!selectedMarkerId) return;
      const marker = markers.find((m) => m.id === selectedMarkerId);
      if (!marker) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        openEditor(marker.id);
        return;
      }

      if (FORWARD_KEYS.has(e.key) || BACKWARD_KEYS.has(e.key)) {
        e.preventDefault();
        const timeline = timelines.find((t) => t.id === marker.lineId);
        if (!timeline) return;

        const stops = getLineStops(timeline.orientation, config);
        const newPosition = getNextStop(marker.position, stops, FORWARD_KEYS.has(e.key));
        if (newPosition !== marker.position) {
          updateMarker(marker.id, { position: newPosition }, 'move marker');
        }
      }
    },
    [orderedMarkers, markers, timelines, config, selectedMarkerId, setSelectedMarkerId, openEditor, updateMarker]
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
  interactionHandlersRef.current.move = handleMouseMove;
  interactionHandlersRef.current.click = handleClick;

  // Canvas renderer
  const canvasRef = useCanvasRenderer({
    lineGeometries,
    markers: markersWithGeometry,
    hoveredMarkerId,
    selectedMarkerId,
    hoverSnapPoint,
    narrativeMarkerIds: isNarrativeMode ? compileSlots : [],
  });

  // Return keyboard focus to the canvas once the marker popup closes, so
  // arrow-key navigation can continue right away.
  useEffect(() => {
    if (!isEditorOpen) {
      canvasRef.current?.focus();
    }
  }, [isEditorOpen, canvasRef]);

  return (
    <div
      id="canvas-container"
      className="thinking-surface flex-1 min-w-0 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: config.backgroundColor }}
    >
      {isNarrativeMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none rounded-full border border-blue-400/20 bg-slate-950/80 px-4 py-2 text-xs text-blue-100 shadow-xl backdrop-blur-md">
          Story mode · click thoughts to add or remove them from the path
        </div>
      )}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="absolute inset-0 w-full h-full cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-editor-accent"
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMarkerDragMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        onMouseDown={handlePathDragStart}
        onMouseUp={handlePathDragEnd}
        onKeyDown={handleCanvasKeyDown}
      />

      {quickCapture && (
        <form
          onSubmit={handleQuickCaptureSubmit}
          className="absolute z-20 -translate-y-1/2 animate-capture-bloom"
          style={{
            left: Math.min(Math.max(quickCapture.x + 20, 16), Math.max(16, canvasSize.width - 310)),
            top: Math.min(Math.max(quickCapture.y, 34), canvasSize.height - 34),
          }}
        >
          <div className="quick-capture-shell">
            <span className="quick-capture-dot" aria-hidden="true" />
            <input
              autoFocus
              value={quickCapture.value}
              onChange={(event) => setQuickCapture((current) => current ? { ...current, value: event.target.value } : null)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  finishQuickCapture(false);
                } else if (event.key === 'Enter' && event.shiftKey) {
                  event.preventDefault();
                  finishQuickCapture(true);
                }
              }}
              onBlur={() => finishQuickCapture(false)}
              className="quick-capture-input"
              placeholder="What’s the thought?"
              aria-label="Capture a thought"
            />
            <span className="quick-capture-key">Enter</span>
          </div>
          <p className="quick-capture-hint">Shift+Enter for the full editor</p>
        </form>
      )}

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
