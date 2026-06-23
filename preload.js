const { ipcRenderer } = require('electron');

// Hàm kiểm tra số thông báo từ tiêu đề trang (Ví dụ: (5) Messenger)
function updateUnreadCount() {
    const title = document.title;
    const match = title.match(/\((\d+)\)/);
    const count = match ? match[1] : "";
    ipcRenderer.send('update-badge', count);
}

// Theo dõi sự thay đổi của tiêu đề trang
window.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(updateUnreadCount);
    observer.observe(document.querySelector('title'), {
        childList: true
    });
});
