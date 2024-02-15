import { KeepAliveAlarm } from './constants.js';
import Kinnosuke from './kinnosuke.js';

const migrations = [];

/**
 * 拡張機能のインストール／更新時の処理
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
      // 開発中の手動更新の際に状態を反映する
      const app = await Kinnosuke.create('update');
      await app.keepAlive();
      // 拡張機能をアップデートした際の更新処理
      for (const migration of migrations) {
        await migration();
      }
      break;
    }
  }
});

/**
 * Chromeが起動したときの処理
 */
chrome.runtime.onStartup.addListener(async () => {
  // 閉じてすぐ開くこともあるので login ではなく keepAlive を使う
  const app = await Kinnosuke.create('startup');
  await app.keepAlive();
});

/**
 * スケジューリング実行
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case KeepAliveAlarm.name: {
      // 定期的にアクセスしてセッションを維持する
      const app = await Kinnosuke.create('alarm');
      await app.keepAlive();
      break;
    }
  }
});

/**
 * v4.0.2
 * アラームを名前付きに変更する
 */
migrations.push(async () => {
  const { name, periodInMinutes } = KeepAliveAlarm;
  if (!await chrome.alarms.get(name)) {
    await chrome.alarms.create(name, { periodInMinutes });
    await chrome.alarms.clear(); // 以前のアラームを削除
  }
});
