export interface Marker {
  id: string;
  lineId: string;
  position: number; // 0-1 normalized position on line
  label: string;
  content: string; // Rich text HTML content
  tags: string[];
  category: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  config: EditorConfig;
  markers: Marker[];
  compileSlots: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompiledSection {
  label: string;
  content: string;
  color: string;
  category: string;
  tags: string[];
}

export interface Timeline {
  id: string;
  orientation: 'horizontal' | 'vertical';
  index: number; // Position in the grid
  label?: string;
}

export interface EditorConfig {
  horizontalLines: number;
  verticalLines: number;
  showHorizontal: boolean;
  showVertical: boolean;
  snapThreshold: number; // Pixels for click detection
  canvasPadding: number; // Padding from canvas edges
  backgroundColor: string; // Canvas background color
}

export interface Point {
  x: number;
  y: number;
}

export interface LineGeometry {
  id: string;
  orientation: 'horizontal' | 'vertical';
  start: Point;
  end: Point;
  index: number;
}

export interface HitTestResult {
  hit: boolean;
  lineId: string | null;
  position: number; // 0-1 normalized
  snapPoint: Point | null;
}

export interface MarkerWithGeometry extends Marker {
  screenX: number;
  screenY: number;
}

export const DEFAULT_MARKER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export const DEFAULT_BACKGROUND_COLORS = [
  // Dark themes
  '#0f172a', // slate-900 (default)
  '#1e293b', // slate-800
  '#18181b', // zinc-900
  '#171717', // neutral-900
  '#1c1917', // stone-900
  '#1e1b4b', // indigo-950
  '#172554', // blue-950
  '#134e4a', // teal-900
  // Light themes
  '#ffffff', // white
  '#f8fafc', // slate-50
  '#f1f5f9', // slate-100
  '#fefce8', // yellow-50
  '#ecfdf5', // emerald-50
  '#eff6ff', // blue-50
  '#faf5ff', // purple-50
  '#fdf2f8', // pink-50
];

export const DEFAULT_CONFIG: EditorConfig = {
  horizontalLines: 3,
  verticalLines: 5,
  showHorizontal: true,
  showVertical: true,
  snapThreshold: 20,
  canvasPadding: 60,
  backgroundColor: '#0f172a',
};
