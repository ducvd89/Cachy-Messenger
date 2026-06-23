const { app, BrowserWindow, session, Tray, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// [WINDOWS] Đăng ký ID để hiện thông báo Native
if (process.platform === 'win32') {
    app.setAppUserModelId('com.cachyos.messenger');
}

let win;
let tray = null;
let isQuitting = false;

// --- XỬ LÝ LỆNH THOÁT TRÊN MACOS (Cmd + Q) ---
app.on('before-quit', () => {
    isQuitting = true;
});

// --- CHỐNG MỞ NHIỀU CỬA SỔ ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) {
            if (!win.isVisible()) win.show();
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    function createWindow() {
        // [ĐA NỀN TẢNG] Nhận diện Icon: Mac dùng .png/.icns, Win dùng .ico, Linux dùng .png
        let iconName = 'icon.png';
        if (process.platform === 'win32') iconName = 'icon.ico';
        // (Build macOS sẽ dùng icon.icns cấu hình trong package.json, ở dev dùng icon.png là đủ)

        win = new BrowserWindow({
            width: 1200,
            height: 800,
            title: "Messenger",
            icon: path.join(__dirname, iconName),
                                autoHideMenuBar: true, // Ẩn menu mặc định trên Win/Linux
                                webPreferences: {
                                    nodeIntegration: false,
                                    contextIsolation: true,
                                    preload: path.join(__dirname, 'preload.js')
                                }
        });

        // --- XỬ LÝ MENU CHO MACOS ---
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
                        { role: 'quit' } // Phím tắt Cmd + Q hoạt động ở đây
                    ]
                },
                {
                    label: 'Edit', // Bắt buộc phải có để Cmd+C, Cmd+V hoạt động
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

        // --- XỬ LÝ MỞ LINK & POPUP GỌI ĐIỆN ---
        win.webContents.setWindowOpenHandler(({ url }) => {
            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.hostname.includes('messenger.com') || parsedUrl.hostname.includes('facebook.com')) {
                    return {
                        action: 'allow',
                        overrideBrowserWindowOptions: {
                            autoHideMenuBar: true,
                            icon: path.join(__dirname, iconName),
                                             webPreferences: {
                                                 nodeIntegration: false,
                                                 contextIsolation: true
                                             }
                        }
                    };
                } else {
                    shell.openExternal(url);
                    return { action: 'deny' };
                }
            } catch (err) {
                shell.openExternal(url);
                return { action: 'deny' };
            }
        });

        win.webContents.on('will-navigate', (event, url) => {
            try {
                const parsedUrl = new URL(url);
                if (!parsedUrl.hostname.includes('messenger.com') && !parsedUrl.hostname.includes('facebook.com')) {
                    event.preventDefault();
                    shell.openExternal(url);
                }
            } catch (err) {
                console.error("Lỗi URL: ", err);
            }
        });

        // --- LOGIC KẾT NỐI VÀ TẢI TRANG ---
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
                console.log(`Mất mạng. Đang thử kết nối lại... Lần ${retryCount}/${maxRetries}`);
                setTimeout(() => { if (win) loadMessenger(); }, 5000);
            } else {
                dialog.showErrorBox(
                    'Lỗi kết nối mạng',
                    'Không thể kết nối đến Messenger. Vui lòng kiểm tra lại đường truyền và chọn "Tải lại trang" từ khay hệ thống.'
                );
                win.loadURL(`data:text/html;charset=utf-8,
                            <body style="display:flex;justify-content:center;align-items:center;height:100vh;background-color:#1e1e1e;color:white;">
                            <h2>Không có kết nối Internet 🌐</h2>
                            </body>
                            `);
            }
        });

        // Xử lý khi nhấn nút Đóng (X)
        win.on('close', (event) => {
            if (!isQuitting) {
                event.preventDefault();
                win.hide(); // Ẩn xuống Tray trên Win/Linux, hoặc xuống Dock trên Mac
            }
        });
    }

    // --- KHỞI TẠO SYSTEM TRAY ---
    function createTray() {
        let iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';

        tray = new Tray(path.join(__dirname, iconName));

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Mở Messenger', click: () => win.show() },
                                                   { label: 'Tải lại trang (Refresh)', click: () => { if (win) { win.reload(); win.show(); } } },
                                                   { type: 'separator' },
                                                   { label: 'Thoát hẳn', click: () => {
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

    // --- CẬP NHẬT THÔNG BÁO ---
    ipcMain.on('update-badge', (event, count) => {
        const titleText = count ? `Messenger (${count})` : 'Messenger';
        const tooltipText = count ? `Messenger (${count} tin nhắn chưa đọc)` : 'Messenger';

        if (win) win.setTitle(titleText);
        if (tray) tray.setToolTip(tooltipText);

        // [MACOS / UBUNTU] Hiển thị chấm đỏ đếm số trên thanh Dock
        if (app.setBadgeCount) {
            app.setBadgeCount(count ? parseInt(count) : 0);
        }
    });

    // --- CHẠY ỨNG DỤNG ---
    app.whenReady().then(() => {
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['media', 'notifications', 'fullscreen'];
            callback(allowed.includes(permission));
        });

        createWindow();
        createTray();

        // [MACOS] Xử lý khi click vào icon ứng dụng trên thanh Dock
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            } else if (win && !win.isVisible()) {
                win.show();
            }
        });
    });

    // Xử lý đóng tất cả cửa sổ
    app.on('window-all-closed', () => {
        // Trên Mac, app thường sống trong nền dù đã đóng hết cửa sổ
        if (process.platform !== 'darwin' && isQuitting) {
            app.quit();
        }
    });
}
