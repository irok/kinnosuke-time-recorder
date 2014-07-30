/*global KTR */

var updated = false;
function updateStatus() {
    if (!updated) {
        KTR.status.update();
        updated = true;
    }
}

// ブラウザ起動時にステータスを更新
chrome.runtime.onStartup.addListener(updateStatus);

// 拡張再起動
window.addEventListener('load', updateStatus);

// コンテントスクリプトからのステータス更新通知
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var status = KTR.status.analyze(message.html);
    if (status.authorized && status.code !== KTR.STATUS.UNKNOWN) {
        KTR.status.apply_(status);
    }
    sendResponse();
});
