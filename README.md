# Messenger Desktop

A lightweight, native-feeling Facebook Messenger client tailored for Windows and Arch-based Linux (CachyOS), built with Electron. 

## ✨ Features

* **Cross-Platform Support:** Run from a single codebase and build native installers for both Windows (`.exe`) and Linux (`.pacman`).
* **Full Messenger Capabilities:** Texting, voice calls, and video calls are fully supported with automatic WebRTC permission handling (Camera/Microphone).
* **System Tray Integration:** Closes to the system tray to run seamlessly in the background without cluttering your taskbar.
* **Smart Notifications:** Displays unread message counts directly on the system tray tooltip and window title. Uses native Windows notifications.
* **Single Instance Lock:** Prevents accidental multiple instances. Clicking the app icon while it's running in the tray will automatically bring the active window to the front.

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your system. 
For Arch/CachyOS users:
```bash
sudo pacman -S nodejs npm
```

### Installation & Development

1. Clone this repository (or extract the source code) and navigate into the project directory.
2. Install the required development dependencies:
   ```bash
   npm install
   ```
3. Run the app in development mode to test:
   ```bash
   npm start
   ```

## 📦 Building for Production

This project uses `electron-builder` to package the application. Ensure you have cleared the `dist/` folder before running a new build to avoid mixed installation files.

### Build for Linux (Arch/CachyOS)
```bash
npm run build:linux
```
Once complete, install the generated `.pacman` package globally:
```bash
sudo pacman -U dist/*.pacman
```
*To uninstall later: `sudo pacman -R messenger-desktop`*

### Build for Windows
```bash
npm run build:win
```
This will generate an `.exe` installer inside the `dist` folder. 
*(Note: If you are building for Windows from a Linux machine, ensure you have `wine` installed: `sudo pacman -S wine`)*

### Build for Both Platforms
```bash
npm run build:all
```

## 🛠️ Built With

* [Electron](https://www.electronjs.org/) - The framework used to wrap the web app.
* [Electron Builder](https://www.electron.build/) - Used for cross-platform packaging and installer generation.

## 👤 Author

**Cid Highwind** Email: ducvd89@gmail.com
