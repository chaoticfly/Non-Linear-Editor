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
  lineColor: '#55545f',
  lineWidth: 1,
  markerRadius: 10,
  hoverMarkerRadius: 14,
  labelFont: '11px Aptos, Segoe UI, sans-serif',
  labelColor: '#777681',
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
  // A broad ghost stroke gives each line the softness of graphite/thread.
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.055)';
  ctx.lineWidth = width + 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(start.x, start.y - 0.45);
  ctx.lineTo(end.x, end.y - 0.45);
  ctx.strokeStyle = 'rgba(245, 240, 232, 0.08)';
  ctx.lineWidth = 0.55;
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
  isSelected: boolean = false,
  writingStatus: 'draft' | 'complete' = 'draft'
) {
  const actualRadius = isHovered ? DEFAULT_DRAW_CONFIG.hoverMarkerRadius : radius;

  // Layered, restrained light rather than a flat UI dot.
  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(x, y, actualRadius + (isSelected ? 10 : 6), 0, Math.PI * 2);
    const halo = ctx.createRadialGradient(x, y, actualRadius * 0.4, x, y, actualRadius + 10);
    halo.addColorStop(0, `${color}45`);
    halo.addColorStop(1, `${color}00`);
    ctx.fillStyle = halo;
    ctx.fill();
  }

  const ink = ctx.createRadialGradient(
    x - actualRadius * 0.3,
    y - actualRadius * 0.35,
    actualRadius * 0.1,
    x,
    y,
    actualRadius
  );
  ink.addColorStop(0, '#ffffffcc');
  ink.addColorStop(0.16, color);
  ink.addColorStop(1, `${color}b8`);
  ctx.beginPath();
  ctx.arc(x, y, actualRadius, 0, Math.PI * 2);
  ctx.fillStyle = ink;
  ctx.shadowColor = `${color}7a`;
  ctx.shadowBlur = isHovered || isSelected ? 16 : 7;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Border
  ctx.strokeStyle = isHovered || isSelected ? 'rgba(245, 243, 255, 0.82)' : 'rgba(7, 7, 10, 0.7)';
  ctx.lineWidth = 1.25;
  ctx.stroke();

  if (writingStatus === 'draft') {
    ctx.beginPath();
    ctx.arc(x, y, actualRadius + 4, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Keep labels readable without turning every thought into a heavy badge.
  if (label) {
    const limit = isHovered || isSelected ? 42 : 24;
    const visibleLabel = label.length > limit ? `${label.slice(0, limit).trim()}…` : label;
    ctx.font = `${isHovered || isSelected ? '600' : '500'} 12px Aptos, Segoe UI, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const labelX = x + actualRadius + 8;
    const textMetrics = ctx.measureText(visibleLabel);
    const padding = 7;
    const bgWidth = textMetrics.width + padding * 2;
    const bgHeight = 24;

    ctx.fillStyle = isHovered || isSelected
      ? 'rgba(13, 13, 18, 0.94)'
      : 'rgba(13, 13, 18, 0.48)';
    ctx.beginPath();
    ctx.roundRect(labelX - padding, y - bgHeight / 2, bgWidth, bgHeight, 7);
    ctx.fill();

    ctx.fillStyle = isHovered || isSelected ? '#f1efeb' : 'rgba(218, 215, 210, 0.78)';
    ctx.fillText(visibleLabel, labelX, y + 0.5);
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
        marker.id === selectedMarkerId,
        marker.writingStatus || 'draft'
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
      hoveredMarker.id === selectedMarkerId,
      hoveredMarker.writingStatus || 'draft'
    );
  }
}

export function drawNarrativePath(
  ctx: CanvasRenderingContext2D,
  orderedMarkers: MarkerWithGeometry[]
) {
  if (orderedMarkers.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cubicPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const mt = 1 - t;
    return {
      x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
      y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
    };
  };
  const cubicTangent = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => ({
    x: 3 * (1 - t) ** 2 * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t ** 2 * (p3.x - p2.x),
    y: 3 * (1 - t) ** 2 * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t ** 2 * (p3.y - p2.y),
  });

  for (let index = 0; index < orderedMarkers.length - 1; index++) {
    const from = orderedMarkers[index];
    const to = orderedMarkers[index + 1];
    const dx = to.screenX - from.screenX;
    const dy = to.screenY - from.screenY;
    const distance = Math.hypot(dx, dy);
    if (distance < 44) continue;

    const ux = dx / distance;
    const uy = dy / distance;
    const gap = 22;
    const start = { x: from.screenX + ux * gap, y: from.screenY + uy * gap };
    const end = { x: to.screenX - ux * gap, y: to.screenY - uy * gap };
    const bend = Math.min(52, distance * 0.16) * (index % 2 === 0 ? 1 : -1);
    const px = -uy;
    const py = ux;
    const control1 = { x: start.x + dx * 0.3 + px * bend, y: start.y + dy * 0.3 + py * bend };
    const control2 = { x: end.x - dx * 0.3 + px * bend, y: end.y - dy * 0.3 + py * bend };

    const strokeCurve = (color: string, width: number, blur = 0, shadowColor = 'rgba(139, 148, 255, 0.48)') => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = blur;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Layered translucent light makes the route read like drifting pigment,
    // distinct from the crisp structural grid without a diagram-like outline.
    strokeCurve('rgba(226, 228, 233, 0.08)', 15, 28, 'rgba(220, 222, 228, 0.38)');
    strokeCurve('rgba(232, 233, 237, 0.20)', 7, 19, 'rgba(226, 228, 233, 0.46)');
    strokeCurve('rgba(244, 244, 246, 0.62)', 1.6, 11, 'rgba(238, 239, 242, 0.56)');

    // A small open chevron reads as direction without becoming a diagram icon.
    const arrowT = 0.72;
    const arrow = cubicPoint(start, control1, control2, end, arrowT);
    const tangent = cubicTangent(start, control1, control2, end, arrowT);
    const angle = Math.atan2(tangent.y, tangent.x);
    const wing = 7;
    ctx.beginPath();
    ctx.moveTo(
      arrow.x - Math.cos(angle - 0.62) * wing,
      arrow.y - Math.sin(angle - 0.62) * wing
    );
    ctx.lineTo(arrow.x, arrow.y);
    ctx.lineTo(
      arrow.x - Math.cos(angle + 0.62) * wing,
      arrow.y - Math.sin(angle + 0.62) * wing
    );
    ctx.strokeStyle = 'rgba(229, 197, 105, 0.96)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  orderedMarkers.forEach((marker, index) => {
    ctx.beginPath();
    ctx.arc(marker.screenX, marker.screenY, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0c10';
    ctx.fill();
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 10px Aptos, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), marker.screenX, marker.screenY + 0.5);
  });
  ctx.restore();
}

export function drawHoverIndicator(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string = '#8297ff'
) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
  ctx.strokeStyle = `${color}24`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = `${color}80`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
