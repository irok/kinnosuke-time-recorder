import { KeepAliveAlarm, WorkingStatus } from './constants.js';
import Badge from './badge.js';

/**
 * 状態を記憶しておくクラス
 */
export default class State {
  // セッション確認の有効時間
  // アラームの定期実行時間より少し長めにしておく
  static TTL = (KeepAliveAlarm.periodInMinutes + 3) * 60 * 1000;

  static async retrieve() {
    try {
      const { state } = await chrome.storage.local.get('state');
      return new State(JSON.parse(state));
    } catch {
      return new State();
    }
  }

  constructor({ code = WorkingStatus.UNKNOWN, authorizedTime = 0, ...rest } = {}) {
    this.data = { code, authorizedTime, ...rest };
    this.response = null;
  }

  // @returns enum
  code() {
    return this.data.code;
  }

  // @returns boolean
  authorized() {
    return Date.now() < this.data.authorizedTime + State.TTL;
  }

  // @returns string or undefined
  startTime() {
    return this.data.startTime;
  }

  // @returns string or undefined
  leaveTime() {
    return this.data.leaveTime;
  }

  // @returns string or undefined
  csrfToken() {
    return this.data.csrfToken;
  }

  // @returns string
  lastRemindDate() {
    return this.data.lastRemindDate ?? '';
  }

  // @returns this
  setLastRemindDate(date) {
    this.data.lastRemindDate = date;
    return this;
  }

  // @returns KinnosukeResponse or null
  recentResponse() {
    return this.response;
  }

  // KinnosukeResponseを元に状態を設定する (lastRemindDateだけは維持する)
  // 勤之助にアクセスする度に反映する
  // @returns this
  update(response) {
    if (!response.authorized()) {
      return this.reset();
    }

    const startTime = response.startTime();
    const leaveTime = response.leaveTime();
    this.data = {
      code: WorkingStatus[ leaveTime ? 'AFTER' : startTime ? 'ON_THE_JOB' : 'BEFORE' ],
      authorizedTime: Date.now(),
      startTime, leaveTime,
      csrfToken: response.csrfToken(),
      lastRemindDate: this.lastRemindDate(),
    };
    this.response = response;
    return this;
  }

  // 状態を初期化する
  // @returns this
  reset() {
    this.data = {
      code: WorkingStatus.UNKNOWN,
      authorizedTime: 0,
    };
    this.response = null;
    return this;
  }

  async save() {
    // Note: JSON.stringifyは値がundefinedなキーを出力しない
    const state = JSON.stringify(this.data);
    await chrome.storage.local.set({ state });

    // 状態を保存した際にバッジを更新する
    await Badge.update(this.code());
  }
}
