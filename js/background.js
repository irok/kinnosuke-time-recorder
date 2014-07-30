/*global KTR */

// ブラウザ起動時にステータスを更新
chrome.runtime.onStartup.addListener(function() {
    KTR.status.update();
});

// コンテントスクリプトからのステータス更新通知
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var status = KTR.status.analyze(message.html);
    if (status.authorized && status.code !== KTR.STATUS.UNKNOWN) {
        KTR.status.apply_(status);
    }
    sendResponse();
});
