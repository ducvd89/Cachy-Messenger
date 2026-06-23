# Messenger Desktop

A lightweight, native-feeling Facebook Messenger client tailored for Windows, macOS, and Linux. Built with Electron, it brings the full Messenger experience to your desktop with smart features and system integrations.

## ✨ Features

* **Cross-Platform Support:** Run from a single codebase and build native installers for Windows (`.exe`), macOS (`.dmg`), and Linux (`.pacman`).
* **System Tray & Dock Integration:** Minimizes to the system tray (or macOS Dock) to run seamlessly in the background. Quick actions available via right-click menu.
* **Smart Notifications:** Displays unread message counts directly on the system tray tooltip, window title, and macOS/Ubuntu dock badges. Uses native system notifications.
* **Intelligent Window Handling:** * Safely opens external links (like YouTube or news articles) in your default web browser.
    * Native support for Messenger's Video and Audio calls (WebRTC) via dedicated internal popup windows.
* **Auto-Reconnect (Network Resilience):** Automatically detects network drops and attempts to reconnect silently in the background. Provides a friendly offline screen if the connection drops completely.
* **Single Instance Lock:** Prevents accidental multiple instances from opening and consuming excess memory.

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

### Build for Windows
```bash
npm run build:win
```

### Build for macOS
```bash
npm run build:mac
```
*(Note: You must run this command on a macOS machine to successfully build a `.dmg` file).*

### Build for All Platforms (Win/Linux)
```bash
npm run build:all
```

## 🛠️ Built With

* [Electron](https://www.electronjs.org/) - The framework used to wrap the web app.
* [Electron Builder](https://www.electron.build/) - Used for cross-platform packaging and installer generation.

## 👤 Author

**Cid Highwind** Email: ducvd89@gmail.com
