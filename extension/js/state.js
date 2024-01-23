/**
 * 状態を記憶しておくクラス
 */
export default class State {
  static Code = {
    UNKNOWN: 0,
    BEFORE: 1,
    ON_THE_JOB: 2,
    AFTER: 3,
  };
  static TTL = 10 * 60 * 1000;   // セッション確認の有効時間

  static async retrieve() {
    try {
      const { state } = await chrome.storage.local.get('state');
      return new State(JSON.parse(state));
    } catch {
      return new State();
    }
  }

  constructor({ code = State.Code.UNKNOWN, authorizedTime = 0, ...rest } = {}) {
    this.data = { code, authorizedTime, ...rest };
  }

  code() {
    return this.data.code;
  }

  authorized() {
    return Date.now() < this.data.authorizedTime + this.constructor.TTL;
  }

  startTime() {
    return this.data.startTime ?? null;
  }

  leaveTime() {
    return this.data.leaveTime ?? null;
  }

  lastRemindDate() {
    return this.data.lastRemindDate ?? '';
  }

  setLastRemindDate(date) {
    this.data.lastRemindDate = date;
    return this;
  }

  csrfToken() {
    return this.data.csrfToken ?? null;
  }

  update(response) {
    if (response.authorized()) {
      const startTime = response.startTime();
      const leaveTime = response.leaveTime();
      this.data = {
        code: this.constructor.Code[
          leaveTime ? 'AFTER' : startTime ? 'ON_THE_JOB' : 'BEFORE'
        ],
        authorizedTime: Date.now(),
        startTime, leaveTime,
        lastRemindDate: this.data.lastRemindDate,
        csrfToken: response.csrfToken(),
      };
    } else {
      this.reset();
    }
    return this;
  }

  reset() {
    this.data = {
      code: this.constructor.Code.UNKNOWN,
      authorizedTime: 0,
      lastRemindDate: this.data.lastRemindDate,
    };
    return this;
  }

  async save() {
    const state = JSON.stringify(this.data);
    await chrome.storage.local.set({ state });

    // 状態を保存した際にバッジを更新する
    await Badge.update(this.data.code);
  }
}

/**
 * バッジを設定するクラス
 */
class Badge {
  static Color = [
    '#fff', '#ffc800', '#60d880', '#46d'
  ];
  static Title = [
    '設定してください', '未出社', '出社', '退社'
  ];

  static update(code) {
    return Promise.all([
      chrome.action.setBadgeBackgroundColor({ color: this.Color[code] }),
      chrome.action.setBadgeText({ text: code === State.Code.UNKNOWN ? '' : ' ' }),
      chrome.action.setTitle({ title: this.Title[code] }),
    ]);
  }
}
