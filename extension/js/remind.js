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

  constructor({ lastDate } = {}) {
    this.data = { lastDate };
  }

  // @returns string
  lastDate() {
    return this.data.lastDate ?? '';
  }

  // @returns this
  setLastDate(date) {
    this.data.lastDate = date;
    return this;
  }

  // @returns this
  reset() {
    delete this.data.lastDate;
    return this;
  }

  async save() {
    const remind = JSON.stringify(this.data);
    await chrome.storage.local.set({ remind });
  }
}
