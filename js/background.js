/*global KTR */

// ブラウザ起動時にブラウザアクションを更新
chrome.runtime.onStartup.addListener(function() {
    if (!KTR.view.update_from_cache()) {
        KTR.status.update(function() {
            // 起動時にAjax通信するとプロセスが残ってしまう問題への対応
            // chrome.runtime.reload();
        });
    }
});

// ページの読み込み完了時にもブラウザアクションを更新
window.addEventListener('load', function() {
    KTR.view.update_from_cache();
});

// コンテントスクリプトからのステータス更新通知
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (KTR.credential.valid()) {
        var status = KTR.status.scrape(message.html);
        if (status.authorized && status.code !== KTR.STATUS.UNKNOWN) {
            KTR.status.change(status);
        }
	}
    sendResponse();
});
