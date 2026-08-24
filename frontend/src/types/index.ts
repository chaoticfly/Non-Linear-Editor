export interface Marker {
  id: string;
  lineId: string;
  crossLineId?: string; // Perpendicular line id when placed at a grid intersection
  position: number; // 0-1 normalized position on line
  label: string;
  content: string; // Rich text HTML content
  tags: string[];
  category: string;
  color: string;
  linkedMarkerIds?: string[];
  writingStatus?: 'draft' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  config: EditorConfig;
  markers: Marker[];
  compileSlots: string[];
  narrativePaths?: NarrativePath[];
  activeNarrativePathId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NarrativePath {
  id: string;
  name: string;
  markerIds: string[];
}

export interface AutosaveEnvelope {
  project: Project;
  savedAt: string;
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
  crossLineId: string | null; // Perpendicular line id when the hit is a grid intersection
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

export interface BackgroundColorPreset {
  name: string;
  color: string;
}

// Low-chroma backgrounds keep long writing sessions comfortable while still
// giving each project a distinct atmosphere.
export const BACKGROUND_COLOR_PALETTES: Record<'dark' | 'light', BackgroundColorPreset[]> = {
  dark: [
    { name: 'Midnight Ink', color: '#0b0f14' },
    { name: 'Blue Hour', color: '#111827' },
    { name: 'Deep Fjord', color: '#10212b' },
    { name: 'Forest Night', color: '#11231c' },
    { name: 'Aubergine', color: '#211725' },
    { name: 'Cocoa', color: '#241b18' },
    { name: 'Graphite', color: '#202124' },
    { name: 'Storm', color: '#252936' },
  ],
  light: [
    { name: 'Porcelain', color: '#f7f7f5' },
    { name: 'Warm Paper', color: '#f4efe6' },
    { name: 'Oat Milk', color: '#eee8dc' },
    { name: 'Mist', color: '#e8eef2' },
    { name: 'Sage Wash', color: '#e5eee7' },
    { name: 'Sea Glass', color: '#e2efed' },
    { name: 'Lavender Haze', color: '#ece8f2' },
    { name: 'Blush', color: '#f3e7e5' },
  ],
};

export const DEFAULT_BACKGROUND_COLORS = [
  ...BACKGROUND_COLOR_PALETTES.dark,
  ...BACKGROUND_COLOR_PALETTES.light,
].map(({ color }) => color);

export const DEFAULT_CONFIG: EditorConfig = {
  horizontalLines: 3,
  verticalLines: 5,
  showHorizontal: true,
  showVertical: true,
  snapThreshold: 20,
  canvasPadding: 60,
  backgroundColor: BACKGROUND_COLOR_PALETTES.dark[0].color,
};
