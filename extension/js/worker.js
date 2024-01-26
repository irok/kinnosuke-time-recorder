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

      // ここから下に拡張機能をアップデートした際の更新処理を書く

      /**
       * v4.0.2
       * アラームを名前付きに変更する
       */
      const { name, periodInMinutes } = KeepAliveAlarm;
      if (!await chrome.alarms.get(name)) {
        await chrome.alarms.create(name, { periodInMinutes });
        await chrome.alarms.clear(); // 初期に登録していたアラームを削除
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
  await app.keepAlive(); // 閉じてすぐ開くこともあるので login ではなく keepAlive を使う
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
