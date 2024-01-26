import { WorkingStatus } from './constants.js';

/**
 * バッジを設定するクラス
 */
export default class Badge {
  static Settings = {
    [WorkingStatus.UNKNOWN]:    { color: '#ffffff', title: '設定してください' },
    [WorkingStatus.BEFORE]:     { color: '#ffc800', title: '未出社' },
    [WorkingStatus.ON_THE_JOB]: { color: '#60d880', title: '出社' },
    [WorkingStatus.AFTER]:      { color: '#4466dd', title: '退社' },
  };

  static update(code) {
    const { color, title } = Badge.Settings[code];

    return Promise.all([
      chrome.action.setBadgeBackgroundColor({ color }),
      chrome.action.setBadgeText({ text: code === WorkingStatus.UNKNOWN ? '' : ' ' }),
      chrome.action.setTitle({ title }),
    ]);
  }
}
