import { KeepAliveAlarm } from './constants.js';
import Kinnosuke from './kinnosuke.js';

/**
 * 拡張機能自体の初期化処理
 */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  switch (reason) {
    case chrome.runtime.OnInstalledReason.INSTALL: {
      // セッション維持のためのアラームをセットする
      const { name, periodInMinutes } = KeepAliveAlarm;
      await chrome.alarms.create(name, { periodInMinutes });

      // オプションページを開く
      await chrome.runtime.openOptionsPage()

      break;
    }
    case chrome.runtime.OnInstalledReason.UPDATE: {
      // 開発中の手動更新時に状態を反映する
      const app = await Kinnosuke.create();
      await app.keepAlive();

      /**
       * 拡張機能をアップデートした際の更新処理
       */
      const { version } = chrome.runtime.getManifest();
      switch (version) {
        case '4.0.2': {
          // 名前付きアラームに変更する
          const { name, periodInMinutes } = KeepAliveAlarm;
          if (!await chrome.alarms.get(name)) {
            await chrome.alarms.create(name, { periodInMinutes });
            await chrome.alarms.clear(); // 初期に登録していたアラームを削除
          }
          break;
        }
      }

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
 * スケジューリング実行
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case KeepAliveAlarm.name: {
      // 定期的にアクセスしてセッションを維持する
      const app = await Kinnosuke.create();
      await app.keepAlive();
      break;
    }
  }
});
