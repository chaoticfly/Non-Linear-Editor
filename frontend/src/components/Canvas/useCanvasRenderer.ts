import { useRef, useEffect, useCallback } from 'react';
import { LineGeometry, MarkerWithGeometry, Point } from '../../types';
import {
  clearCanvas,
  drawLines,
  drawLineLabels,
  drawMarkers,
  drawHoverIndicator,
  drawNarrativePath,
} from './canvasUtils';

interface UseCanvasRendererProps {
  lineGeometries: LineGeometry[];
  markers: MarkerWithGeometry[];
  hoveredMarkerId: string | null;
  selectedMarkerId: string | null;
  hoverSnapPoint: Point | null;
  narrativeMarkerIds?: string[];
}

export function useCanvasRenderer({
  lineGeometries,
  markers,
  hoveredMarkerId,
  selectedMarkerId,
  hoverSnapPoint,
  narrativeMarkerIds = [],
}: UseCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual canvas size in memory (scaled for retina)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);

    // Clear canvas
    clearCanvas(ctx, rect.width, rect.height);

    // Draw lines
    drawLines(ctx, lineGeometries);

    // Draw line labels
    drawLineLabels(ctx, lineGeometries);

    // Draw hover indicator (before markers so it appears behind)
    if (hoverSnapPoint && !hoveredMarkerId) {
      drawHoverIndicator(ctx, hoverSnapPoint);
    }

    // Draw markers
    drawNarrativePath(
      ctx,
      narrativeMarkerIds
        .map((id) => markers.find((marker) => marker.id === id))
        .filter((marker): marker is MarkerWithGeometry => Boolean(marker))
    );
    drawMarkers(ctx, markers, hoveredMarkerId, selectedMarkerId);
  }, [lineGeometries, markers, hoveredMarkerId, selectedMarkerId, hoverSnapPoint, narrativeMarkerIds]);

  useEffect(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule render on next animation frame
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return canvasRef;
}
