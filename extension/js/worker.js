import Kinnosuke from './kinnosuke.js';

/**
 * 拡張機能自体の初期化処理
 */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  switch (reason) {
    case chrome.runtime.OnInstalledReason.INSTALL: {
      // セッション維持のためのアラームをセットする
      await chrome.alarms.create({
        periodInMinutes: 10,
      });

      // オプションページを開く
      await chrome.runtime.openOptionsPage()

      break;
    }
    case chrome.runtime.OnInstalledReason.UPDATE: {
      const app = await Kinnosuke.create();
      await app.keepAlive();

      // 拡張機能をアップデートした際にデータの変換が必要な場合はここに処理を書く

      break;
    }
  }
});

/**
 * Chromeが起動したときの初期化処理
 */
chrome.runtime.onStartup.addListener(async () => {
  const app = await Kinnosuke.create();
  await app.keepAlive();
});

/**
 * 定期的にアクセスしてセッションを維持する
 */
chrome.alarms.onAlarm.addListener(async () => {
  const app = await Kinnosuke.create();
  await app.keepAlive();
});
