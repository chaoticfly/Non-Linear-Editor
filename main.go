package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist/*
var assets embed.FS

//go:embed build/appicon.png
var appIcon []byte

func main() {
	wailsApp := application.New(application.Options{
		Name:        "Likhi Lakeerain",
		Description: "Written Lines: A timeline-based marker editor",
		Assets:      application.AssetOptions{Handler: application.BundledAssetFileServer(assets)},
		Mac:         application.MacOptions{ApplicationShouldTerminateAfterLastWindowClosed: false},
	})

	service := NewApp(wailsApp)
	wailsApp.RegisterService(application.NewService(service))

	newWindow := func() application.Window { return nil }
	newWindow = func() application.Window {
		window := wailsApp.Window.NewWithOptions(application.WebviewWindowOptions{
			Name: "Likhi Lakeerain", Title: "Likhi Lakeerain",
			Width: 1280, Height: 800, URL: "/",
			BackgroundColour: application.NewRGB(15, 23, 42),
		})
		window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
			window.Hide()
			event.Cancel()
		})
		return window
	}

	mainWindow := newWindow()
	tray := wailsApp.SystemTray.New()
	tray.SetIcon(appIcon)
	tray.SetTooltip("Likhi Lakeerain")
	menu := wailsApp.NewMenu()
	menu.Add("Show Likhi Lakeerain").OnClick(func(*application.Context) {
		mainWindow.Show()
		mainWindow.Restore()
		mainWindow.Focus()
	})
	menu.AddSeparator()
	menu.Add("New Project Window").OnClick(func(*application.Context) { newWindow().Show() })
	menu.Add("Open Project...").OnClick(func(*application.Context) {
		mainWindow.Show()
		mainWindow.Restore()
		mainWindow.Focus()
		wailsApp.Event.Emit(trayOpenProjectEvent)
	})
	menu.AddSeparator()
	menu.Add("Quit").OnClick(func(*application.Context) { wailsApp.Quit() })
	tray.SetMenu(menu)

	if err := wailsApp.Run(); err != nil {
		log.Fatal(err)
	}
}
