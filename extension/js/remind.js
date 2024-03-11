/**
 * 出社リマインドの日時をを記憶しておくクラス
 */
export default class Remind {
  static async retrieve() {
    try {
      const { remind } = await chrome.storage.local.get('remind');
      return new Remind(JSON.parse(remind));
    } catch {
      return new Remind();
    }
  }

  constructor(data = {}) {
    this.data = data;
  }

  // @returns string
  lastDate() {
    return this.data.lastDate ?? '';
  }

  // @returns this
  // sourceとtimeStampはデバッグ用
  setLastDate(lastDate, source) {
    this.data = {
      lastDate, source,
      timeStamp: (new Date()).toLocaleString('ja-JP', {
        timeZone: 'JST',
        timeZoneName: 'short'
      }),
    };
    return this;
  }

  // @returns this
  reset() {
    this.data = {};
    return this;
  }

  async save() {
    const remind = JSON.stringify(this.data);
    await chrome.storage.local.set({ remind });
  }
}
