import { LineGeometry, Point, MarkerWithGeometry } from '../../types';

export interface DrawConfig {
  lineColor: string;
  lineWidth: number;
  markerRadius: number;
  hoverMarkerRadius: number;
  labelFont: string;
  labelColor: string;
}

export const DEFAULT_DRAW_CONFIG: DrawConfig = {
  lineColor: '#475569',
  lineWidth: 2,
  markerRadius: 12,
  hoverMarkerRadius: 16,
  labelFont: '12px Inter, system-ui, sans-serif',
  labelColor: '#94a3b8',
};

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string = DEFAULT_DRAW_CONFIG.lineColor,
  width: number = DEFAULT_DRAW_CONFIG.lineWidth
) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

export function drawLines(
  ctx: CanvasRenderingContext2D,
  geometries: LineGeometry[],
  config: DrawConfig = DEFAULT_DRAW_CONFIG
) {
  geometries.forEach((line) => {
    drawLine(ctx, line.start, line.end, config.lineColor, config.lineWidth);
  });
}

export function drawLineLabels(
  ctx: CanvasRenderingContext2D,
  geometries: LineGeometry[],
  config: DrawConfig = DEFAULT_DRAW_CONFIG
) {
  ctx.font = config.labelFont;
  ctx.fillStyle = config.labelColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  geometries.forEach((line) => {
    const label = line.orientation === 'horizontal'
      ? `H${line.index + 1}`
      : `V${line.index + 1}`;

    if (line.orientation === 'horizontal') {
      // Label at the left of horizontal lines
      ctx.textAlign = 'right';
      ctx.fillText(label, line.start.x - 15, line.start.y);
    } else {
      // Label at the top of vertical lines
      ctx.textAlign = 'center';
      ctx.fillText(label, line.start.x, line.start.y - 15);
    }
  });
}

export function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  radius: number = DEFAULT_DRAW_CONFIG.markerRadius,
  isHovered: boolean = false,
  isSelected: boolean = false
) {
  const actualRadius = isHovered ? DEFAULT_DRAW_CONFIG.hoverMarkerRadius : radius;

  // Outer glow for selected markers
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, actualRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = `${color}40`;
    ctx.fill();
  }

  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, actualRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Border
  ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : '#00000040';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(x - actualRadius * 0.25, y - actualRadius * 0.25, actualRadius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();

  // Draw label above marker
  if (label) {
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const labelY = y - actualRadius - 8;
    const textMetrics = ctx.measureText(label);
    const padding = 6;
    const bgWidth = textMetrics.width + padding * 2;
    const bgHeight = 20;

    // Background pill for label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - bgWidth / 2, labelY - bgHeight, bgWidth, bgHeight, 4);
    ctx.fill();

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, labelY - 3);
  }
}

export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MarkerWithGeometry[],
  hoveredMarkerId: string | null,
  selectedMarkerId: string | null,
  config: DrawConfig = DEFAULT_DRAW_CONFIG
) {
  // Draw non-hovered markers first
  markers
    .filter((m) => m.id !== hoveredMarkerId)
    .forEach((marker) => {
      drawMarker(
        ctx,
        marker.screenX,
        marker.screenY,
        marker.color,
        marker.label,
        config.markerRadius,
        false,
        marker.id === selectedMarkerId
      );
    });

  // Draw hovered marker on top
  const hoveredMarker = markers.find((m) => m.id === hoveredMarkerId);
  if (hoveredMarker) {
    drawMarker(
      ctx,
      hoveredMarker.screenX,
      hoveredMarker.screenY,
      hoveredMarker.color,
      hoveredMarker.label,
      config.markerRadius,
      true,
      hoveredMarker.id === selectedMarkerId
    );
  }
}

export function drawHoverIndicator(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string = '#3b82f6'
) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = `${color}80`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
