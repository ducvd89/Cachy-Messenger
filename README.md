# Cachy-Messenger

A lightweight Facebook Messenger desktop client for Arch Linux and CachyOS, built with Electron.

## ✨ Features

- 🖥️ **Native Desktop App** - Run Facebook Messenger as a dedicated desktop application
- 📌 **System Tray Integration** - Access Messenger from the system tray for quick access
- 🔔 **Unread Message Counter** - Real-time badge updates on the window title and tray icon
- 🎯 **Single Instance Lock** - Prevents multiple app instances from running simultaneously
- 🔐 **Security First** - Disabled Node integration and enabled context isolation for enhanced security
- 🎨 **Minimalist UI** - Clean interface with auto-hidden menu bar
- 📱 **Responsive Design** - Optimized window size (1200x800) for comfortable messaging
- 🎤 **Full Multimedia Support** - Voice calls, video calls, and notifications fully supported
- 📦 **Native Arch Package** - Pre-configured to build into `.pacman` packages for clean installation

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your system:

```bash
sudo pacman -S nodejs npm
```

### Installation & Development

1. **Clone the repository:**

```bash
git clone https://github.com/ducvd89/Cachy-Messenger.git
cd Cachy-Messenger
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run the app in development mode:**

```bash
npm start
```

## 📦 Building and Installing

To build the application into a native Arch Linux package (.pacman):

1. **Build the package:**

```bash
npm run build
```

2. **Install the generated package:**

```bash
sudo pacman -U dist/*.pacman
```

(Note: If the output is a `.pkg.tar.zst` file, adjust the command accordingly)

3. **Uninstall the application:**

```bash
sudo pacman -R cachy-messenger
```

## 📁 File Structure

```
Cachy-Messenger/
├── main.js              # Main Electron process
├── preload.js           # Preload script for secure IPC
├── package.json         # Project configuration and dependencies
├── icon.png             # Application icon
└── README.md            # This file
```

## ⚙️ Configuration

### Window Settings

Edit `main.js` to customize the window properties:

```javascript
win = new BrowserWindow({
    width: 1200,        // Window width
    height: 800,        // Window height
    title: "Messenger", // Window title
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
    }
});
```

### User Agent

The app uses a Chrome-based user agent to ensure compatibility:

```javascript
userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
```

## 🔐 Security Features

- ✅ **Node Integration Disabled** - Prevents direct Node.js access from renderer process
- ✅ **Context Isolation Enabled** - Isolates preload script from renderer context
- ✅ **Secure IPC** - Uses Inter-Process Communication for safe message passing
- ✅ **Permission Handler** - Explicit permission requests for media and notifications

## 🎯 Usage

### Keyboard Shortcuts

- **Close Window:** Click the X button (minimizes to tray instead of closing)
- **Quit Application:** Right-click tray icon → "Thoát hẳn" (Exit completely)
- **Toggle Window:** Click the tray icon to show/hide the window

### System Tray Features

- **Show/Hide:** Click the tray icon to toggle window visibility
- **Unread Counter:** Tray tooltip displays unread message count on Linux
- **Quick Menu:** Right-click for quick access to open and exit options

## 🔧 Permissions

The application requests the following permissions:

- **Media** - For voice and video calls
- **Notifications** - For message alerts
- **Fullscreen** - For media sharing and immersive experiences

These permissions are automatically granted for seamless messaging experience.

## 🐛 Troubleshooting

### App Won't Start

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Check that `icon.png` exists in the root directory

3. Verify Node.js version compatibility:
   ```bash
   node --version
   ```

4. Clear npm cache if needed:
   ```bash
   npm cache clean --force
   npm install
   ```

### System Tray Not Showing

- Make sure your system tray/notification area is enabled
- On some Linux desktops, you may need to configure tray settings in your desktop environment
- Ensure the icon file (`icon.png`) is present and valid

### Unread Message Counter Not Working

- Verify `preload.js` is properly configured
- Check the console for errors: `Ctrl+Shift+I` in the app
- Ensure the `update-badge` IPC listener is working in `main.js`

### Build Fails

- Check that `electron-builder` is installed: `npm install`
- Verify you have write permissions in the project directory
- Check available disk space for build output

## 📚 Dependencies

- **electron** `^28.0.0` - Framework for building desktop apps
- **electron-builder** `^24.0.0` - Tool for packaging and building installers for Linux

## 👤 Author

**Cid Highwind**  
Email: ducvd89@gmail.com

## 📄 License

ISC License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request with improvements or bug fixes.

## ⚠️ Disclaimer

This is an unofficial Facebook Messenger client. Use at your own risk and ensure compliance with Facebook's Terms of Service. The developers are not responsible for any account issues or terms of service violations resulting from the use of this application.

## 🔗 Related

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder Documentation](https://www.electron.build/)
- [CachyOS Project](https://cachyos.org/)
