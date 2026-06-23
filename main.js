const { app, BrowserWindow, session, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

// [DÀNH RIÊNG CHO WINDOWS] Đăng ký ID để hiện thông báo Native
if (process.platform === 'win32') {
    app.setAppUserModelId('com.cachyos.messenger'); // Đảm bảo khớp với appId trong package.json
}

let win;
let tray = null;
let isQuitting = false;

// --- CHỐNG MỞ NHIỀU CỬA SỔ (SINGLE INSTANCE LOCK) ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Lắng nghe sự kiện khi ứng dụng cố tình mở thêm instance thứ 2
    app.on('second-instance', () => {
        if (win) {
            if (!win.isVisible()) win.show();
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    // --- KHỞI TẠO CỬA SỔ CHÍNH ---
    function createWindow() {
        // Tự động chọn file Icon cho cửa sổ dựa trên hệ điều hành
        const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';

        win = new BrowserWindow({
            width: 1200,
            height: 800,
            title: "Messenger",
            icon: path.join(__dirname, iconName),
                                autoHideMenuBar: true,
                                webPreferences: {
                                    nodeIntegration: false,
                                    contextIsolation: true,
                                    preload: path.join(__dirname, 'preload.js')
                                }
        });

        // Load trang chủ Messenger kèm Fake User-Agent để mở khóa gọi video trên Linux
        win.loadURL('https://www.messenger.com', {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // Xử lý khi nhấn nút (X): Ẩn xuống Tray thay vì thoát
        win.on('close', (event) => {
            if (!isQuitting) {
                event.preventDefault();
                win.hide();
            }
        });
    }

    // --- KHỞI TẠO SYSTEM TRAY (KHAY HỆ THỐNG) ---
    function createTray() {
        // Tự động chọn file Icon cho Tray
        const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
        tray = new Tray(path.join(__dirname, iconName));

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Mở Messenger', click: () => win.show() },
                                                   { type: 'separator' },
                                                   { label: 'Thoát hẳn', click: () => {
                                                       isQuitting = true;
                                                       app.quit();
                                                   }}
        ]);

        tray.setToolTip('Messenger');
        tray.setContextMenu(contextMenu);

        // Click vào icon ở tray để hiện/ẩn app
        tray.on('click', () => {
            win.isVisible() ? win.hide() : win.show();
        });
    }

    // --- LẮNG NGHE SỰ KIỆN ĐẾM TIN NHẮN (TỪ PRELOAD.JS) ---
    ipcMain.on('update-badge', (event, count) => {
        const titleText = count ? `Messenger (${count})` : 'Messenger';
        const tooltipText = count ? `Messenger (${count} tin nhắn chưa đọc)` : 'Messenger';

        if (win) win.setTitle(titleText);
        if (tray) tray.setToolTip(tooltipText);

        // [Dành cho Ubuntu/macOS nếu có dock] Hiện số chấm đỏ
        if (app.setBadgeCount) {
            app.setBadgeCount(count ? parseInt(count) : 0);
        }
    });

    // --- CHẠY ỨNG DỤNG ---
    app.whenReady().then(() => {
        // Tự động cấp quyền Media (Mic/Cam) & Notification cho tính năng WebRTC
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['media', 'notifications', 'fullscreen'];
            callback(allowed.includes(permission));
        });

        createWindow();
        createTray();
    });

    // Fix lỗi tiến trình bị treo trên Linux/Windows khi đã đóng hết cửa sổ
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin' && isQuitting) {
            app.quit();
        }
    });
}
