const { app, BrowserWindow, session, Tray, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// [WINDOWS] Register App User Model ID for native notifications
if (process.platform === 'win32') {
    app.setAppUserModelId('com.cachyos.messenger');
}

let win;
let tray = null;
let isQuitting = false;

// --- HANDLE MACOS QUIT COMMAND (Cmd + Q) ---
app.on('before-quit', () => {
    isQuitting = true;
});

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Define icon path globally
    const iconPath = process.platform === 'win32' ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon.png');

    // --- HELPER: EXTRACT AND OPEN EXTERNAL LINKS ---
    const handleExternalLink = (urlToOpen) => {
        try {
            const parsed = new URL(urlToOpen);
            // Check for Facebook link shims
            if ((parsed.hostname === 'l.facebook.com' || parsed.hostname === 'lm.facebook.com') && parsed.pathname === '/l.php') {
                const originalUrl = parsed.searchParams.get('u');
                if (originalUrl) {
                    // searchParams.get() already decodes the URL. No need for decodeURIComponent.
                    shell.openExternal(originalUrl);
                    return;
                }
            }
            // Standard external links
            shell.openExternal(urlToOpen);
        } catch (err) {
            if (urlToOpen.startsWith('http')) shell.openExternal(urlToOpen);
        }
    };

    // --- GLOBAL WEB CONTENTS GUARD (Monitors Main Window & All Popups) ---
    app.on('web-contents-created', (event, contents) => {
        // Intercept new window creations (e.g., target="_blank" or window.open)
        contents.setWindowOpenHandler(({ url }) => {
            // Allow about:blank (used by Messenger as a stepping stone for calls and popups)
            if (url === 'about:blank' || url.startsWith('about:')) {
                return {
                    action: 'allow',
                    overrideBrowserWindowOptions: {
                        autoHideMenuBar: true,
                        icon: iconPath,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true
                        }
                    }
                };
            }

            try {
                const parsedUrl = new URL(url);
                const isLinkShim = (parsedUrl.hostname === 'l.facebook.com' || parsedUrl.hostname === 'lm.facebook.com') && parsedUrl.pathname === '/l.php';

                // Allow internal links (excluding tracking shims)
                if (!isLinkShim && (parsedUrl.hostname.includes('messenger.com') || parsedUrl.hostname.includes('facebook.com'))) {
                    return {
                        action: 'allow',
                        overrideBrowserWindowOptions: {
                            autoHideMenuBar: true,
                            icon: iconPath,
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true
                            }
                        }
                    };
                } else {
                    handleExternalLink(url);
                    return { action: 'deny' };
                }
            } catch (err) {
                handleExternalLink(url);
                return { action: 'deny' };
            }
        });

        // Intercept all in-page navigations and redirects
        const navigateHandler = (event, url) => {
            if (url === 'about:blank' || url.startsWith('about:')) return;

            try {
                const parsedUrl = new URL(url);
                const isLinkShim = (parsedUrl.hostname === 'l.facebook.com' || parsedUrl.hostname === 'lm.facebook.com') && parsedUrl.pathname === '/l.php';

                // Block external links or Facebook shims from loading inside the app
                if (isLinkShim || (!parsedUrl.hostname.includes('messenger.com') && !parsedUrl.hostname.includes('facebook.com'))) {
                    event.preventDefault();
                    handleExternalLink(url);

                    // If this navigation happened inside a temporary popup window, close the popup to prevent a blank screen
                    if (win && contents !== win.webContents) {
                        const popupWin = BrowserWindow.fromWebContents(contents);
                        if (popupWin) popupWin.close();
                    }
                }
            } catch (err) {
                console.error("URL Parsing Error: ", err);
            }
        };

        contents.on('will-navigate', navigateHandler);
        contents.on('will-redirect', navigateHandler);
    });

    app.on('second-instance', () => {
        if (win) {
            if (!win.isVisible()) win.show();
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    function createWindow() {
        win = new BrowserWindow({
            width: 1200,
            height: 800,
            title: "Messenger",
            icon: iconPath,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        // --- MACOS MENU CONFIGURATION ---
        if (process.platform === 'darwin') {
            const template = [
                {
                    label: app.name,
                    submenu: [
                        { role: 'about' },
                        { type: 'separator' },
                        { role: 'services' },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        { role: 'quit' }
                    ]
                },
                {
                    label: 'Edit',
                    submenu: [
                        { role: 'undo' },
                        { role: 'redo' },
                        { type: 'separator' },
                        { role: 'cut' },
                        { role: 'copy' },
                        { role: 'paste' },
                        { role: 'selectAll' }
                    ]
                }
            ];
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        }

        // --- CONNECTION & PAGE LOADING LOGIC ---
        let retryCount = 0;
        const maxRetries = 10;

        const loadMessenger = () => {
            win.loadURL('https://www.messenger.com', {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }).catch(() => {});
        };

        loadMessenger();

        win.webContents.on('did-finish-load', () => { retryCount = 0; });

        win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            if (!isMainFrame) return;

            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Network disconnected. Retrying... Attempt ${retryCount}/${maxRetries}`);
                setTimeout(() => { if (win) loadMessenger(); }, 5000);
            } else {
                dialog.showErrorBox(
                    'Network Error',
                    'Cannot connect to Messenger. Please check your internet connection and select "Reload" from the system tray.'
                );
                win.loadURL(`data:text/html;charset=utf-8,
                            <body style="display:flex;justify-content:center;align-items:center;height:100vh;background-color:#1e1e1e;color:white;font-family:sans-serif;">
                            <div style="text-align:center;">
                            <h2>No Internet Connection 🌐</h2>
                            <p>Please check your network and refresh the application.</p>
                            </div>
                            </body>
                            `);
            }
        });

        // Handle Close (X) button
        win.on('close', (event) => {
            if (!isQuitting) {
                event.preventDefault();
                win.hide();
            }
        });
    }

    // --- SYSTEM TRAY INITIALIZATION ---
    function createTray() {
        tray = new Tray(iconPath);

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show Messenger', click: () => win.show() },
                                                   { label: 'Reload', click: () => { if (win) { win.reload(); win.show(); } } },
                                                   { type: 'separator' },
                                                   { label: 'Quit', click: () => {
                                                       isQuitting = true;
                                                       app.quit();
                                                   }}
        ]);

        tray.setToolTip('Messenger');
        tray.setContextMenu(contextMenu);

        tray.on('click', () => {
            win.isVisible() ? win.hide() : win.show();
        });
    }

    // --- NOTIFICATION BADGE UPDATE ---
    ipcMain.on('update-badge', (event, count) => {
        const titleText = count ? `Messenger (${count})` : 'Messenger';
        const tooltipText = count ? `Messenger (${count} unread messages)` : 'Messenger';

        if (win) win.setTitle(titleText);
        if (tray) tray.setToolTip(tooltipText);

        if (app.setBadgeCount) {
            app.setBadgeCount(count ? parseInt(count) : 0);
        }
    });

    // --- APP INITIALIZATION ---
    app.whenReady().then(() => {
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['media', 'notifications', 'fullscreen'];
            callback(allowed.includes(permission));
        });

        createWindow();
        createTray();

        // [MACOS] Handle click on Dock icon
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            } else if (win && !win.isVisible()) {
                win.show();
            }
        });
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin' && isQuitting) {
            app.quit();
        }
    });
}
