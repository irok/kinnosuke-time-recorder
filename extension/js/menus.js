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

  // @returns array
  items() {
    return this.menus;
  }

  // KinnosukeResponseを元にメニュー情報を設定する
  // 勤之助にログイン試行した際に反映する
  // @returns this
  update(response) {
    if (!response.authorized()) {
      return this.reset();
    }

    this.menus = response.menuList();
    return this;
  }

  // メニュー情報を削除する
  // @returns this
  reset() {
    this.menus = [];
    return this;
  }

  async save() {
    const menus = JSON.stringify(this.menus);
    await chrome.storage.local.set({ menus });
  }
}
