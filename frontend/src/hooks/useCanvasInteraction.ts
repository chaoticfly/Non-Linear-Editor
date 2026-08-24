import { useState, useCallback, useRef, MouseEvent } from 'react';
import { LineGeometry, Point, HitTestResult, MarkerWithGeometry } from '../types';
import { hitTest } from '../utils/geometry';

interface UseCanvasInteractionProps {
  lineGeometries: LineGeometry[];
  markers: MarkerWithGeometry[];
  snapThreshold: number;
  onMarkerClick: (markerId: string) => void;
  onLineClick: (lineId: string, position: number, crossLineId: string | null) => void;
}

interface UseCanvasInteractionResult {
  hoveredMarkerId: string | null;
  hoverSnapPoint: Point | null;
  handleMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void;
  handleMouseLeave: () => void;
  handleClick: (e: MouseEvent<HTMLCanvasElement>) => void;
}

export function useCanvasInteraction({
  lineGeometries,
  markers,
  snapThreshold,
  onMarkerClick,
  onLineClick,
}: UseCanvasInteractionProps): UseCanvasInteractionResult {
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoverSnapPoint, setHoverSnapPoint] = useState<Point | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);

  const getCanvasPoint = useCallback((e: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = e.currentTarget;
    if (!canvasRectRef.current) {
      canvasRectRef.current = canvas.getBoundingClientRect();
    }
    const rect = canvasRectRef.current;

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const findHoveredMarker = useCallback(
    (point: Point): string | null => {
      // Check if hovering over any marker (with a generous hit area)
      const markerHitRadius = 15;

      for (const marker of markers) {
        const dx = point.x - marker.screenX;
        const dy = point.y - marker.screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= markerHitRadius) {
          return marker.id;
        }
      }

      return null;
    },
    [markers]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      // Update cached rect on each move for accuracy
      canvasRectRef.current = e.currentTarget.getBoundingClientRect();
      const point = getCanvasPoint(e);

      // First check if hovering over a marker
      const markerId = findHoveredMarker(point);
      if (markerId) {
        setHoveredMarkerId(markerId);
        setHoverSnapPoint(null);
        return;
      }

      setHoveredMarkerId(null);

      // Then check if near a line
      const result: HitTestResult = hitTest(point, lineGeometries, snapThreshold);
      setHoverSnapPoint(result.hit ? result.snapPoint : null);
    },
    [getCanvasPoint, findHoveredMarker, lineGeometries, snapThreshold]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredMarkerId(null);
    setHoverSnapPoint(null);
    canvasRectRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      canvasRectRef.current = e.currentTarget.getBoundingClientRect();
      const point = getCanvasPoint(e);

      // First check if clicking on a marker
      const markerId = findHoveredMarker(point);
      if (markerId) {
        onMarkerClick(markerId);
        return;
      }

      // Then check if clicking near a line
      const result: HitTestResult = hitTest(point, lineGeometries, snapThreshold);
      if (result.hit && result.lineId) {
        onLineClick(result.lineId, result.position, result.crossLineId);
      }
    },
    [getCanvasPoint, findHoveredMarker, lineGeometries, snapThreshold, onMarkerClick, onLineClick]
  );

  return {
    hoveredMarkerId,
    hoverSnapPoint,
    handleMouseMove,
    handleMouseLeave,
    handleClick,
  };
}
