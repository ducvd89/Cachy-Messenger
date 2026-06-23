const { app, BrowserWindow, session, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let win;
let tray = null;
let isQuitting = false;

// 1. Yêu cầu Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Nếu không lấy được lock, nghĩa là ứng dụng đang chạy rồi -> Thoát ngay instance mới này
    app.quit();
} else {
    // 2. Lắng nghe sự kiện khi instance thứ hai cố tình mở
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            // Nếu cửa sổ đang ẩn ở System Tray, hiển thị lại
            if (!win.isVisible()) win.show();
            // Nếu cửa sổ đang bị thu nhỏ (minimize), khôi phục lại
            if (win.isMinimized()) win.restore();
            // Đưa cửa sổ lên phía trước để người dùng sử dụng
            win.focus();
        }
    });

    // Hàm tạo cửa sổ chính
    function createWindow() {
        win = new BrowserWindow({
            width: 1200,
            height: 800,
            title: "Messenger",
            icon: path.join(__dirname, 'icon.png'),
                                autoHideMenuBar: true,
                                webPreferences: {
                                    nodeIntegration: false,
                                    contextIsolation: true,
                                    preload: path.join(__dirname, 'preload.js')
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

        // Click vào icon tray để hiện/ẩn app
        tray.on('click', () => {
            win.isVisible() ? win.hide() : win.show();
        });
    }

    // Lắng nghe sự kiện đếm tin nhắn từ preload.js
    ipcMain.on('update-badge', (event, count) => {
        if (process.platform === 'linux') {
            if (count) {
                tray.setToolTip(`Messenger (${count} tin nhắn chưa đọc)`);
                win.setTitle(`Messenger (${count})`);
            } else {
                tray.setToolTip('Messenger');
                win.setTitle('Messenger');
            }
        }
    });

    // Khởi chạy ứng dụng khi môi trường đã sẵn sàng
    app.whenReady().then(() => {
        // Cấp quyền Media & Notification
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['media', 'notifications', 'fullscreen'];
            callback(allowed.includes(permission));
        });

        createWindow();
        createTray();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin' && isQuitting) {
            app.quit();
        }
    });
}
