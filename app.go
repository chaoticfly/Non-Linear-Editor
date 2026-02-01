package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	currentFilePath string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// beforeClose is called when the user attempts to close the window via the X button.
// It shows a native confirmation dialog to prevent accidental data loss.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	dialog, err := runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         "Exit Likhi Lakeerain",
		Message:       "Are you sure you want to exit? Any unsaved changes will be lost.",
		DefaultButton: "No",
	})
	if err != nil {
		return false
	}
	return dialog != "Yes"
}

// QuitApp terminates the application (called from frontend after confirmation)
func (a *App) QuitApp() {
	runtime.Quit(a.ctx)
}

// Project represents a saved project state
type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Config       Config    `json:"config"`
	Markers      []Marker  `json:"markers"`
	CompileSlots []string  `json:"compileSlots"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Config represents editor configuration
type Config struct {
	HorizontalLines int    `json:"horizontalLines"`
	VerticalLines   int    `json:"verticalLines"`
	ShowHorizontal  bool   `json:"showHorizontal"`
	ShowVertical    bool   `json:"showVertical"`
	BackgroundColor string `json:"backgroundColor"`
	SnapThreshold   int    `json:"snapThreshold"`
	CanvasPadding   int    `json:"canvasPadding"`
}

// Marker represents a marker on the timeline
type Marker struct {
	ID        string    `json:"id"`
	LineID    string    `json:"lineId"`
	Position  float64   `json:"position"`
	Label     string    `json:"label"`
	Content   string    `json:"content"`
	Tags      []string  `json:"tags"`
	Category  string    `json:"category"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CompiledSection represents a section for export
type CompiledSection struct {
	Label    string   `json:"label"`
	Content  string   `json:"content"`
	Color    string   `json:"color"`
	Category string   `json:"category"`
	Tags     []string `json:"tags"`
}

// SaveProject saves a project to a file
func (a *App) SaveProject(project Project) (string, error) {
	// If we have a current file path, save to it
	if a.currentFilePath != "" {
		return a.saveToFile(project, a.currentFilePath)
	}
	// Otherwise, prompt for a new location
	return a.SaveProjectAs(project)
}

// SaveProjectAs saves a project to a new file location
func (a *App) SaveProjectAs(project Project) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Project",
		DefaultFilename: project.Name + ".nle",
		Filters: []runtime.FileFilter{
			{DisplayName: "Non-Linear Editor Projects", Pattern: "*.nle"},
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil // User cancelled
	}

	return a.saveToFile(project, filePath)
}

func (a *App) saveToFile(project Project, filePath string) (string, error) {
	project.UpdatedAt = time.Now()
	if project.CreatedAt.IsZero() {
		project.CreatedAt = time.Now()
	}

	data, err := json.MarshalIndent(project, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		return "", err
	}

	a.currentFilePath = filePath
	a.addToRecentProjects(filePath, project.Name)

	return filePath, nil
}

// LoadProject loads a project from a file
func (a *App) LoadProject() (*Project, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Project",
		Filters: []runtime.FileFilter{
			{DisplayName: "Non-Linear Editor Projects", Pattern: "*.nle"},
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil // User cancelled
	}

	return a.LoadProjectFromPath(filePath)
}

// LoadProjectFromPath loads a project from a specific path
func (a *App) LoadProjectFromPath(filePath string) (*Project, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var project Project
	err = json.Unmarshal(data, &project)
	if err != nil {
		return nil, err
	}

	a.currentFilePath = filePath
	a.addToRecentProjects(filePath, project.Name)

	return &project, nil
}

// GetCurrentFilePath returns the current file path
func (a *App) GetCurrentFilePath() string {
	return a.currentFilePath
}

// ClearCurrentFilePath clears the current file path (for New Project)
func (a *App) ClearCurrentFilePath() {
	a.currentFilePath = ""
}

// RecentProject represents a recently opened project
type RecentProject struct {
	Path     string    `json:"path"`
	Name     string    `json:"name"`
	OpenedAt time.Time `json:"openedAt"`
}

// GetRecentProjects returns the list of recently opened projects
func (a *App) GetRecentProjects() ([]RecentProject, error) {
	configDir, err := a.getConfigDir()
	if err != nil {
		return nil, err
	}

	recentFile := filepath.Join(configDir, "recent.json")
	data, err := os.ReadFile(recentFile)
	if err != nil {
		if os.IsNotExist(err) {
			return []RecentProject{}, nil
		}
		return nil, err
	}

	var recent []RecentProject
	err = json.Unmarshal(data, &recent)
	if err != nil {
		return nil, err
	}

	// Filter out projects that no longer exist
	validRecent := make([]RecentProject, 0)
	for _, r := range recent {
		if _, err := os.Stat(r.Path); err == nil {
			validRecent = append(validRecent, r)
		}
	}

	return validRecent, nil
}

func (a *App) addToRecentProjects(filePath, name string) error {
	configDir, err := a.getConfigDir()
	if err != nil {
		return err
	}

	recentFile := filepath.Join(configDir, "recent.json")

	recent, _ := a.GetRecentProjects()

	// Remove existing entry for this path
	filtered := make([]RecentProject, 0)
	for _, r := range recent {
		if r.Path != filePath {
			filtered = append(filtered, r)
		}
	}

	// Add to front
	filtered = append([]RecentProject{{
		Path:     filePath,
		Name:     name,
		OpenedAt: time.Now(),
	}}, filtered...)

	// Keep only last 10
	if len(filtered) > 10 {
		filtered = filtered[:10]
	}

	data, err := json.MarshalIndent(filtered, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(recentFile, data, 0644)
}

func (a *App) getConfigDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	appConfigDir := filepath.Join(configDir, "NonLinearEditor")
	err = os.MkdirAll(appConfigDir, 0755)
	if err != nil {
		return "", err
	}

	return appConfigDir, nil
}

// ExportODT exports the compiled content to ODT format
func (a *App) ExportODT(sections []CompiledSection) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export to ODT",
		DefaultFilename: "document.odt",
		Filters: []runtime.FileFilter{
			{DisplayName: "OpenDocument Text", Pattern: "*.odt"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil // User cancelled
	}

	err = createODT(filePath, sections)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// ExportHTML exports the compiled content to HTML format
func (a *App) ExportHTML(sections []CompiledSection) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export to HTML",
		DefaultFilename: "document.html",
		Filters: []runtime.FileFilter{
			{DisplayName: "HTML Files", Pattern: "*.html"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil // User cancelled
	}

	html := generateHTML(sections)
	err = os.WriteFile(filePath, []byte(html), 0644)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// categoryGroup holds sections belonging to the same category
type categoryGroup struct {
	Name     string
	Sections []CompiledSection
}

// groupByCategory groups sections by category, preserving first-appearance order
func groupByCategory(sections []CompiledSection) []categoryGroup {
	var groups []categoryGroup
	seen := map[string]int{}

	for _, section := range sections {
		cat := section.Category
		if idx, ok := seen[cat]; ok {
			groups[idx].Sections = append(groups[idx].Sections, section)
		} else {
			seen[cat] = len(groups)
			groups = append(groups, categoryGroup{Name: cat, Sections: []CompiledSection{section}})
		}
	}

	return groups
}

func generateHTML(sections []CompiledSection) string {
	html := `<!DOCTYPE html>
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
`

	groups := groupByCategory(sections)

	for _, group := range groups {
		if group.Name != "" {
			html += `<div class="category">
<h2 class="category-title">` + group.Name + `</h2>
`
		}

		for _, section := range group.Sections {
			html += `<div class="section">
<div class="section-header">
<div class="section-marker" style="background-color: ` + section.Color + `"></div>
<div class="section-title">` + section.Label + `</div>
</div>
`
			// Render tags if present
			if len(section.Tags) > 0 {
				html += `<div class="section-tags">
`
				for _, tag := range section.Tags {
					html += `<span class="section-tag">` + tag + `</span>
`
				}
				html += `</div>
`
			}

			html += `<div class="section-content">` + section.Content + `</div>
</div>
`
		}

		if group.Name != "" {
			html += `</div>
`
		}
	}

	html += `</body>
</html>`

	return html
}

// CreateMarker creates a new marker with auto-generated ID and timestamp
func (a *App) CreateMarker(lineID string, position float64, label string, color string) Marker {
	marker := Marker{
		ID:        uuid.New().String(),
		LineID:    lineID,
		Position:  position,
		Label:     label,
		Content:   "",
		Tags:      []string{},
		Category:  "",
		Color:     color,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	return marker
}

// UpdateMarker updates an existing marker's fields
func (a *App) UpdateMarker(id string, label string, content string, tags []string, category string, color string) Marker {
	marker := Marker{
		ID:        id,
		Label:     label,
		Content:   content,
		Tags:      tags,
		Category:  category,
		Color:     color,
		UpdatedAt: time.Now(),
	}
	return marker
}

// NewProject creates a new empty project
func (a *App) NewProject() Project {
	return Project{
		ID:   uuid.New().String(),
		Name: "Untitled Project",
		Config: Config{
			HorizontalLines: 5,
			VerticalLines:   10,
			ShowHorizontal:  true,
			ShowVertical:    true,
			BackgroundColor: "#0f172a",
			SnapThreshold:   10,
			CanvasPadding:   40,
		},
		Markers:      []Marker{},
		CompileSlots: []string{},
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}
