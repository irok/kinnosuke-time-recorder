/**
 * メニュー内容を記憶しておくクラス
 */
export default class Menus {
  static async retrieve() {
    try {
      const { menus } = await chrome.storage.local.get('menus');
      return new Menus(JSON.parse(menus));
    } catch {
      return new Menus();
    }
  }

  constructor(menus = []) {
    this.menus = menus;
  }

  items() {
    return this.menus ?? [];
  }

  update(response) {
    this.menus = response.authorized() ? response.menuList() : null;
    return this;
  }

  reset() {
    this.menus = [];
    return this;
  }

  async save() {
    const menus = JSON.stringify(this.menus);
    await chrome.storage.local.set({ menus });
  }
}
