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

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('alerm', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(function() {
    if (!KTR.credential.valid()) {
        return
    }

    const manifest = chrome.runtime.getManifest();
    const notificationId = Math.floor(Math.random() * 9007199254740992) + 1;

    const alerms = KTR.alarms.get();
    const format = 'hh:mm:ss'
    const now = moment(moment(), format)
    let args = {
        type: 'basic',
        title: manifest.name,
        iconUrl: manifest.icons['48'],
        priority: 1
    };

    KTR.service.mytop((html) => {
        const status = KTR.status.scan(html).code
        // 出勤前かつ出勤アラートの設定がある場合
        if (status == KTR.STATUS.BEFORE && alerms.startAlarmBegin && alerms.startAlarmEnd) {
            const begin = moment(`${alerms.startAlarmBegin}:00`, format);
            const end = moment(`${alerms.startAlarmEnd}:59`, format);

            if (now.isBetween(begin, end)) {
                args = Object.assign({message: KTR.MESSAGE.start}, args)
                chrome.notifications.create(`notification_${notificationId}`, args);
            }
        }

        // 出勤中かつ退勤アラートの設定がある場合
        if (status == KTR.STATUS.ON_THE_JOB && alerms.leaveAlarmBegin && alerms.leaveAlarmEnd) {
            const begin = moment(`${alerms.leaveAlarmBegin}:00`, format);
            const end = moment(`${alerms.leaveAlarmEnd}:59`, format);

            if (now.isBetween(begin, end)) {
                args = Object.assign({message: KTR.MESSAGE.leave}, args)
                chrome.notifications.create(`notification_${notificationId}`, args);
            }
        }
    });
});
