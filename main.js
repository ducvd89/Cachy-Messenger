const { app, BrowserWindow, session, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

if (process.platform === 'win32') {
    app.setAppUserModelId('com.cachyos.messenger');
}

let win;
let tray = null;
let isQuitting = false;

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

        let retryCount = 0;
        const maxRetries = 10;

        const loadMessenger = () => {
            win.loadURL('https://www.messenger.com', {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }).catch(() => {
                // Lỗi catch ở đây thường do URL không hợp lệ, lỗi rớt mạng thực tế xử lý ở did-fail-load
            });
        };

        // Bắt đầu tải trang lần đầu
        loadMessenger();

        // Nếu tải trang thành công, reset bộ đếm về 0
        win.webContents.on('did-finish-load', () => {
            retryCount = 0;
        });

        // Lắng nghe sự kiện rớt mạng hoặc không tải được trang
        win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            // Chỉ đếm các lỗi ở khung trang chính (main frame), bỏ qua lỗi của các ảnh/iframe con
            if (!isMainFrame) return;

            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Mất mạng. Đang thử kết nối lại... Lần ${retryCount}/${maxRetries}`);
                setTimeout(() => {
                    if (win) loadMessenger();
                }, 5000);
            } else {
                // Hiển thị Popup báo lỗi hệ thống
                dialog.showErrorBox(
                    'Lỗi kết nối mạng',
                    'Không thể kết nối đến Messenger sau 10 lần thử. Vui lòng kiểm tra lại đường truyền Internet.\n\nBạn có thể click chuột phải vào biểu tượng ứng dụng ở góc phải màn hình và chọn "Tải lại trang (Refresh)" khi mạng đã ổn định.'
                );

                // Tùy chọn: Hiển thị một trang báo lỗi trực tiếp trên giao diện app cho đỡ trống
                win.loadURL(`data:text/html;charset=utf-8,
                            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background-color:#1e1e1e;color:white;text-align:center;">
                            <div>
                            <h2>Không có kết nối Internet 🌐</h2>
                            <p>Vui lòng kiểm tra lại mạng và làm mới ứng dụng.</p>
                            </div>
                            </body>
                            `);
            }
        });

        win.on('close', (event) => {
            if (!isQuitting) {
                event.preventDefault();
                win.hide();
            }
        });
    }

    function createTray() {
        const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
        tray = new Tray(path.join(__dirname, iconName));

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Mở Messenger', click: () => win.show() },
                                                   {
                                                       label: 'Tải lại trang (Refresh)',
                                                   click: () => {
                                                       if (win) {
                                                           // Gọi lại hàm reload, bộ đếm retryCount sẽ được làm mới nếu load thành công
                                                           win.reload();
                                                           if (!win.isVisible()) win.show();
                                                       }
                                                   }
                                                   },
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

    ipcMain.on('update-badge', (event, count) => {
        const titleText = count ? `Messenger (${count})` : 'Messenger';
        const tooltipText = count ? `Messenger (${count} tin nhắn chưa đọc)` : 'Messenger';

        if (win) win.setTitle(titleText);
        if (tray) tray.setToolTip(tooltipText);

        if (app.setBadgeCount) {
            app.setBadgeCount(count ? parseInt(count) : 0);
        }
    });

    app.whenReady().then(() => {
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
