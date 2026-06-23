const { app, BrowserWindow, session, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let win;
let tray = null;
let isQuitting = false;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Messenger",
        icon: path.join(__dirname, 'icon.png'), // Icon cho cửa sổ
                            autoHideMenuBar: true,
                            webPreferences: {
                                nodeIntegration: false,
                            contextIsolation: true,
                            preload: path.join(__dirname, 'preload.js') // Load file preload
                            }
    });

    win.loadURL('https://www.messenger.com', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Khi nhấn nút đóng (X), ẩn app vào Tray thay vì thoát hẳn
    win.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            win.hide();
        }
    });
}

// Thiết lập System Tray (Khay hệ thống)
function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mở Messenger', click: () => win.show() },
                                               { type: 'separator' },
                                               { label: 'Thoát hẳn', click: () => {
                                                   isQuitting = true;
                                                   app.quit();
                                               }}
    ]);

    tray.setToolTip('CachyOS Messenger');
    tray.setContextMenu(contextMenu);

    // Click vào icon tray để hiện app
    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show();
    });
}

// Lắng nghe sự kiện đếm tin nhắn từ preload.js
ipcMain.on('update-badge', (event, count) => {
    if (process.platform === 'linux') {
        // Trên Linux, chúng ta cập nhật Tooltip của Tray hoặc tiêu đề cửa sổ
        // vì một số môi trường Desktop không hỗ trợ Badge số trực tiếp trên icon
        if (count) {
            tray.setToolTip(`Messenger (${count} tin nhắn chưa đọc)`);
            win.setTitle(`Messenger (${count})`);
        } else {
            tray.setToolTip('Messenger');
            win.setTitle('Messenger');
        }
    }
});

app.whenReady().then(() => {
    // Cấp quyền Media & Notification
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['media', 'notifications', 'fullscreen'];
        callback(allowed.includes(permission));
    });

    createWindow();
    createTray();
});

// Fix lỗi trên Linux khi đóng hết cửa sổ
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) {
        app.quit();
    }
});
