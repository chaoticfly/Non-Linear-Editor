// Wails service wrapper
// This file provides a unified API for both Wails desktop and web browser contexts

import { Project, CompiledSection } from '../types';

// Check if running in Wails context
const isWails = () => typeof (window as any).go !== 'undefined';

// Type definitions for Wails bindings (auto-generated when running wails dev)
declare global {
  interface Window {
    go?: {
      main: {
        App: {
          SaveProject: (project: Project) => Promise<string>;
          SaveProjectAs: (project: Project) => Promise<string>;
          LoadProject: () => Promise<Project | null>;
          LoadProjectFromPath: (path: string) => Promise<Project>;
          GetCurrentFilePath: () => Promise<string>;
          ClearCurrentFilePath: () => Promise<void>;
          GetRecentProjects: () => Promise<RecentProject[]>;
          CreateMarker: (lineID: string, position: number, label: string, color: string) => Promise<any>;
          UpdateMarker: (id: string, label: string, content: string, tags: string[], category: string, color: string) => Promise<any>;
          NewProject: () => Promise<Project>;
          ExportODT: (sections: CompiledSection[]) => Promise<string>;
          ExportHTML: (sections: CompiledSection[]) => Promise<string>;
          QuitApp: () => Promise<void>;
        };
      };
    };
  }
}

export interface RecentProject {
  path: string;
  name: string;
  openedAt: string;
}

// Storage key for browser fallback
const STORAGE_KEY = 'nonlinear-editor-project';
const RECENT_KEY = 'nonlinear-editor-recent';

// Save project
export async function saveProject(project: Project): Promise<string | null> {
  if (isWails() && window.go) {
    const result = await window.go.main.App.SaveProject(project);
    return result || null;
  }

  // Browser fallback: save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  return 'localStorage';
}

// Save project as (always prompt for location)
export async function saveProjectAs(project: Project): Promise<string | null> {
  if (isWails() && window.go) {
    const result = await window.go.main.App.SaveProjectAs(project);
    return result || null;
  }

  // Browser fallback: download as file
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name || 'project'}.nle`;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

// Load project (open dialog)
export async function loadProject(): Promise<Project | null> {
  if (isWails() && window.go) {
    const result = await window.go.main.App.LoadProject();
    return result || null;
  }

  // Browser fallback: file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nle,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const text = await file.text();
      try {
        const project = JSON.parse(text) as Project;
        resolve(project);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

// Load project from path (for recent projects)
export async function loadProjectFromPath(path: string): Promise<Project | null> {
  if (isWails() && window.go) {
    try {
      const result = await window.go.main.App.LoadProjectFromPath(path);
      return result || null;
    } catch {
      return null;
    }
  }

  // Browser fallback: not supported
  return null;
}

// Get recent projects
export async function getRecentProjects(): Promise<RecentProject[]> {
  if (isWails() && window.go) {
    try {
      return await window.go.main.App.GetRecentProjects();
    } catch {
      return [];
    }
  }

  // Browser fallback: get from localStorage
  try {
    const recent = localStorage.getItem(RECENT_KEY);
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

// Clear current file path (for new project)
export async function clearCurrentFilePath(): Promise<void> {
  if (isWails() && window.go) {
    await window.go.main.App.ClearCurrentFilePath();
  }
}

// Export to ODT
export async function exportODT(sections: CompiledSection[]): Promise<string | null> {
  if (isWails() && window.go) {
    const result = await window.go.main.App.ExportODT(sections);
    return result || null;
  }

  // Browser fallback: show message
  alert('ODT export is only available in the desktop app. Use "Copy to Clipboard" for now.');
  return null;
}

// Export to HTML
export async function exportHTML(sections: CompiledSection[]): Promise<string | null> {
  if (isWails() && window.go) {
    const result = await window.go.main.App.ExportHTML(sections);
    return result || null;
  }

  // Browser fallback: generate and download HTML
  const html = generateBrowserHTML(sections);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.html';
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

function generateBrowserHTML(sections: CompiledSection[]): string {
  // Group sections by category, preserving first-appearance order
  const groups: { name: string; sections: CompiledSection[] }[] = [];
  const seen: Record<string, number> = {};
  for (const section of sections) {
    const cat = section.category || '';
    if (cat in seen) {
      groups[seen[cat]].sections.push(section);
    } else {
      seen[cat] = groups.length;
      groups.push({ name: cat, sections: [section] });
    }
  }

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Document</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
.category { margin-bottom: 2.5em; }
.category-title { font-size: 1.5em; font-weight: 700; color: #222; border-bottom: 2px solid #ddd; padding-bottom: 0.3em; margin-bottom: 1.2em; }
.section { margin-bottom: 2em; padding-bottom: 1em; border-bottom: 1px solid #eee; }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5em; }
.section-marker { width: 12px; height: 12px; border-radius: 50%; }
.section-title { font-size: 1.2em; font-weight: 600; color: #333; }
.section-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.8em; }
.section-tag { font-size: 0.75em; color: #666; background: #f1f5f9; border-radius: 4px; padding: 2px 8px; }
.section-content { color: #444; }
</style>
</head>
<body>
`;

  for (const group of groups) {
    if (group.name) {
      html += `<div class="category">
<h2 class="category-title">${group.name}</h2>
`;
    }

    for (const section of group.sections) {
      html += `<div class="section">
<div class="section-header">
<div class="section-marker" style="background-color: ${section.color}"></div>
<div class="section-title">${section.label || 'Untitled'}</div>
</div>
`;
      if (section.tags && section.tags.length > 0) {
        html += `<div class="section-tags">
`;
        for (const tag of section.tags) {
          html += `<span class="section-tag">${tag}</span>
`;
        }
        html += `</div>
`;
      }

      html += `<div class="section-content">${section.content}</div>
</div>
`;
    }

    if (group.name) {
      html += `</div>
`;
    }
  }

  html += `</body>
</html>`;

  return html;
}

// Check if running in desktop context
export function isDesktopApp(): boolean {
  return isWails();
}

// Create a new marker
export async function createMarker(lineID: string, position: number, label: string, color: string) {
  if (isWails() && window.go) {
    return await window.go.main.App.CreateMarker(lineID, position, label, color);
  }
  return null;
}

// Update an existing marker
export async function updateMarker(id: string, label: string, content: string, tags: string[], category: string, color: string) {
  if (isWails() && window.go) {
    return await window.go.main.App.UpdateMarker(id, label, content, tags, category, color);
  }
  return null;
}

// Create a new project
export async function newProject(): Promise<Project | null> {
  if (isWails() && window.go) {
    try {
      return await window.go.main.App.NewProject();
    } catch {
      return null;
    }
  }

  // Browser fallback: create default project
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: 'Untitled Project',
    config: {
      horizontalLines: 5,
      verticalLines: 10,
      showHorizontal: true,
      showVertical: true,
      backgroundColor: '#0f172a',
      snapThreshold: 10,
      canvasPadding: 40,
    },
    markers: [],
    compileSlots: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Project;
}

// Get current file path
export async function getCurrentFilePath(): Promise<string> {
  if (isWails() && window.go) {
    try {
      return await window.go.main.App.GetCurrentFilePath();
    } catch {
      return '';
    }
  }
  return '';
}

// Quit the application
export async function quit(): Promise<void> {
  if (isWails() && window.go) {
    try {
      await window.go.main.App.QuitApp();
    } catch {
      window.close();
    }
  }
}
