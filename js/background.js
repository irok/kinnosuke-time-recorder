// ブラウザ起動時にブラウザアクションを更新
chrome.runtime.onStartup.addListener(() => {
    if (!KTR.view.update_from_cache()) {
        KTR.status.update(() => {
            // 起動時にAjax通信するとプロセスが残ってしまう問題への対応
            // chrome.runtime.reload();
        });
    }
});

// ページの読み込み完了時にもブラウザアクションを更新
window.addEventListener('load', () => {
    KTR.view.update_from_cache();
});

// コンテントスクリプトからのステータス更新通知
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (KTR.credential.valid()) {
        var status = KTR.status.scrape(message.html);
        if (status.authorized && status.code !== KTR.STATUS.UNKNOWN) {
            KTR.status.change(status);
        }
    }
    sendResponse();
});

chrome.alarms.create('alerm', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(function() {
    const manifest = chrome.runtime.getManifest();
    const notificationId = Math.floor(Math.random() * 9007199254740992) + 1;

    const alerms = KTR.alarms.get();
    const format = 'hh:mm'
    const now = moment(moment(), format)

    let args = {
        type: 'basic',
        title: manifest.name,
        iconUrl: manifest.icons['48'],
        priority: 1
    };

    if (alerms.startAlarmBegin && alerms.startAlarmEnd) {
        const begin = moment(alerms.startAlarmBegin, format);
        const end = moment(alerms.startAlarmEnd, format);

        if (now.isBetween(begin, end)) {
            args = Object.assign({message: '出勤しましたか？'}, args)
            chrome.notifications.create(`notification_${notificationId}`, args);
        }
    }

    if (alerms.leaveAlarmBegin && alerms.leaveAlarmEnd) {
        const begin = moment(alerms.leaveAlarmBegin, format);
        const end = moment(alerms.leaveAlarmEnd, format);

        if (now.isBetween(begin, end)) {
            args = Object.assign({message: '退勤しましたか？'}, args)
            chrome.notifications.create(`notification_${notificationId}`, args);
        }
    }
});
