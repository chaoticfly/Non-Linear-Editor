import { Point, LineGeometry, HitTestResult, EditorConfig, Timeline } from '../types';

export function calculateLineGeometries(
  timelines: Timeline[],
  config: EditorConfig,
  canvasWidth: number,
  canvasHeight: number
): LineGeometry[] {
  const { canvasPadding } = config;
  const geometries: LineGeometry[] = [];

  const horizontalLines = timelines.filter(t => t.orientation === 'horizontal');
  const verticalLines = timelines.filter(t => t.orientation === 'vertical');

  // Calculate horizontal lines (evenly distributed vertically)
  if (horizontalLines.length > 0) {
    const usableHeight = canvasHeight - 2 * canvasPadding;
    const spacing = horizontalLines.length > 1
      ? usableHeight / (horizontalLines.length - 1)
      : 0;

    horizontalLines.forEach((line, i) => {
      const y = horizontalLines.length === 1
        ? canvasHeight / 2
        : canvasPadding + i * spacing;

      geometries.push({
        id: line.id,
        orientation: 'horizontal',
        start: { x: canvasPadding, y },
        end: { x: canvasWidth - canvasPadding, y },
        index: line.index,
      });
    });
  }

  // Calculate vertical lines (evenly distributed horizontally)
  if (verticalLines.length > 0) {
    const usableWidth = canvasWidth - 2 * canvasPadding;
    const spacing = verticalLines.length > 1
      ? usableWidth / (verticalLines.length - 1)
      : 0;

    verticalLines.forEach((line, i) => {
      const x = verticalLines.length === 1
        ? canvasWidth / 2
        : canvasPadding + i * spacing;

      geometries.push({
        id: line.id,
        orientation: 'vertical',
        start: { x, y: canvasPadding },
        end: { x, y: canvasHeight - canvasPadding },
        index: line.index,
      });
    });
  }

  return geometries;
}

export function distanceToLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

export function nearestPointOnLine(point: Point, lineStart: Point, lineEnd: Point): Point {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = 0;
  if (lenSq !== 0) {
    param = Math.max(0, Math.min(1, dot / lenSq));
  }

  return {
    x: lineStart.x + param * C,
    y: lineStart.y + param * D,
  };
}

export function positionToNormalized(
  snapPoint: Point,
  lineGeometry: LineGeometry
): number {
  const { start, end, orientation } = lineGeometry;

  if (orientation === 'horizontal') {
    const totalLength = end.x - start.x;
    return totalLength === 0 ? 0 : (snapPoint.x - start.x) / totalLength;
  } else {
    const totalLength = end.y - start.y;
    return totalLength === 0 ? 0 : (snapPoint.y - start.y) / totalLength;
  }
}

export function normalizedToPosition(
  normalized: number,
  lineGeometry: LineGeometry
): Point {
  const { start, end } = lineGeometry;
  return {
    x: start.x + normalized * (end.x - start.x),
    y: start.y + normalized * (end.y - start.y),
  };
}

export function findLineIntersection(
  horizontalLine: LineGeometry,
  verticalLine: LineGeometry
): Point | null {
  // Horizontal line has constant Y, vertical line has constant X
  const y = horizontalLine.start.y;
  const x = verticalLine.start.x;

  // Check if intersection is within bounds of both lines
  const hMinX = Math.min(horizontalLine.start.x, horizontalLine.end.x);
  const hMaxX = Math.max(horizontalLine.start.x, horizontalLine.end.x);
  const vMinY = Math.min(verticalLine.start.y, verticalLine.end.y);
  const vMaxY = Math.max(verticalLine.start.y, verticalLine.end.y);

  if (x >= hMinX && x <= hMaxX && y >= vMinY && y <= vMaxY) {
    return { x, y };
  }

  return null;
}

export function hitTest(
  clickPoint: Point,
  lineGeometries: LineGeometry[],
  threshold: number
): HitTestResult {
  const horizontalLines = lineGeometries.filter(l => l.orientation === 'horizontal');
  const verticalLines = lineGeometries.filter(l => l.orientation === 'vertical');

  let closestDistance = Infinity;
  let closestLine: LineGeometry | null = null;
  let closestSnapPoint: Point | null = null;

  // First, check for intersections if both h and v lines exist
  if (horizontalLines.length > 0 && verticalLines.length > 0) {
    for (const hLine of horizontalLines) {
      for (const vLine of verticalLines) {
        const intersection = findLineIntersection(hLine, vLine);
        if (intersection) {
          const dx = clickPoint.x - intersection.x;
          const dy = clickPoint.y - intersection.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < closestDistance && distance <= threshold) {
            closestDistance = distance;
            closestLine = hLine; // Use horizontal line as primary for position calculation
            closestSnapPoint = intersection;
          }
        }
      }
    }
  }

  // If no intersection found within threshold, check regular lines
  if (closestDistance > threshold) {
    for (const line of lineGeometries) {
      const distance = distanceToLine(clickPoint, line.start, line.end);

      if (distance < closestDistance && distance <= threshold) {
        closestDistance = distance;
        closestLine = line;
        closestSnapPoint = nearestPointOnLine(clickPoint, line.start, line.end);
      }
    }
  }

  if (closestLine && closestSnapPoint) {
    return {
      hit: true,
      lineId: closestLine.id,
      position: positionToNormalized(closestSnapPoint, closestLine),
      snapPoint: closestSnapPoint,
    };
  }

  return {
    hit: false,
    lineId: null,
    position: 0,
    snapPoint: null,
  };
}

export function getMarkerScreenPosition(
  lineId: string,
  position: number,
  lineGeometries: LineGeometry[]
): Point | null {
  const line = lineGeometries.find(l => l.id === lineId);
  if (!line) return null;

  return normalizedToPosition(position, line);
}
