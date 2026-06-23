# CachyMessenger

A lightweight, native-feeling Facebook Messenger client tailored for CachyOS and Arch Linux, built with Electron.

## ✨ Features

* **Full Messenger Capabilities:** Texting, voice calls, and video calls are fully supported.
* **System Tray Integration:** Closes to the system tray to run seamlessly in the background.
* **Unread Badge Notifications:** Displays unread message counts directly on the system tray tooltip and window title.
* **Hardware & Permission Access:** Automatic handling of Microphone, Camera, and Notification permissions for a smooth WebRTC experience.
* **Native Arch Package:** Pre-configured to build directly into a `.pacman` package for clean installation and removal via the `pacman` package manager.

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your system:

```bash
sudo pacman -S nodejs npm

Installation & Development
Clone this repository (or extract the source code) and navigate into the project directory.

Install the required development dependencies:

Bash
   npm install
Run the app in development mode to test:

Bash
   npm start
📦 Building and Installing
To build the application into a native Arch Linux package (.pacman):

Run the build command:

Bash
   npm run build
Once the build is complete, you will find the generated package in the dist folder. Install it globally on your system using pacman:

Bash
   sudo pacman -U dist/*.pacman
(Note: If the output is a .pkg.tar.zst file, adjust the install command accordingly).

To uninstall the application later, simply run:

Bash
sudo pacman -R cachy-messenger
🛠️ Built With
Electron - The framework used to wrap the web app.

Electron Builder - Used for packaging the app for Linux.

👤 Author
Cid Highwind

Email: ducvd89@gmail.com
