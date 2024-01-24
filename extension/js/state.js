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

  // セッション確認の有効時間
  static TTL = 10 * 60 * 1000;

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

  // KinnosukeResponseを元に状態を設定する
  // 勤之助にアクセスする度に反映する
  // lastRemindDateだけは維持
  // @returns this
  update(response) {
    if (response.authorized()) {
      const startTime = response.startTime();
      const leaveTime = response.leaveTime();
      this.data = {
        code: State.Code[ leaveTime ? 'AFTER' : startTime ? 'ON_THE_JOB' : 'BEFORE' ],
        authorizedTime: Date.now(),
        startTime, leaveTime,
        csrfToken: response.csrfToken(),
        lastRemindDate: this.data.lastRemindDate,
      };
    } else {
      this.reset();
    }
    return this;
  }

  // 状態を初期化する
  // lastRemindDateだけは維持
  // @returns this
  reset() {
    this.data = {
      code: State.Code.UNKNOWN,
      authorizedTime: 0,
      lastRemindDate: this.data.lastRemindDate,
    };
    return this;
  }

  async save() {
    // Note: JSON.stringifyは値がundefinedなキーを出力しない
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
      chrome.action.setBadgeBackgroundColor({ color: Badge.Color[code] }),
      chrome.action.setBadgeText({ text: code === State.Code.UNKNOWN ? '' : ' ' }),
      chrome.action.setTitle({ title: Badge.Title[code] }),
    ]);
  }
}
