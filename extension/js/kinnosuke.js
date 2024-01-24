import Credential from './credential.js';
import Menus from './menus.js';
import Notifier from './notifier.js';
import State from './state.js';

/**
 * 勤之助を操作するクラス
 */
export default class Kinnosuke {
  static SiteUrl = 'https://www.e4628.jp/';
  static StampingType = {
    ON: 1,
    OFF: 2,
  };

  // AM5:00を1日の開始とする日付文字列を返す
  static today() {
    const now = new Date();
    if (now.getHours() < 5) {
      now.setDate(now.getDate() - 1);
    }
    return `${ now.getFullYear() }-${ now.getMonth() + 1 }-${ now.getDate() }`;
  }

  // 勤之助を開く
  static open({ module, action } = {}) {
    let url = this.SiteUrl;
    if (module && action) {
      url += `?module=${ module }&action=${ action }`;
    }
    window.open(url, '_blank');
  }

  // コンストラクタにasyncは使えないので生成メソッドを用意する
  static async create() {
    const instance = new Kinnosuke();
    instance.client = new KinnosukeClient();
    instance.menus = await Menus.retrieve();
    instance.state = await State.retrieve();
    await instance.remindStamp();
    return instance;
  }

  // menusを返す
  getMenus() {
    return this.menus.items();
  }

  // stateを返す
  getState() {
    return this.state;
  }

  // まだ出社してなければリマインドする
  async remindStamp() {
    const today = this.constructor.today();
    if (this.state.lastRemindDate() != today) {
      await this.state.setLastRemindDate(today).save();
      if (this.state.code() == State.Code.BEFORE) {
        await Notifier.remindStamp();
      }
    }
  }

  // ログイン
  async login() {
    const credential = await Credential.retrieve();
    if (credential.valid()) {
      const response = await this.client.login(credential);
      if (response.authorized()) {
        await this.state.update(response).save();
        await this.menus.update(response).save();
        return true;
      }
      await Notifier.loginFailed();
    }
    await this.state.reset().save();
    return false;
  }

  // ログアウト
  async logout() {
    if (this.state.authorized()) {
      await this.client.logout();
    }
    await this.state.reset().save();
    await this.menus.reset().save();
  }

  // セッションを維持する (alarmで定期実行される)
  async keepAlive() {
    // 前回が認証済みだったなら
    if (this.state.authorized()) {
      // 実際の状態を取得して更新する
      const response = await this.client.getTop();
      this.state.update(response);

      // 認証済みなら状態を保存して終了
      if (this.state.authorized()) {
        await this.state.save();
        return;
      }
    }

    //認証されていなければログインする
    await this.login();
  }

  // 出社
  async startWork() {
    const response = await this.stamp(this.constructor.StampingType.ON);
    if (response) {
      const time = response.startTime();
      if (time) {
        await Notifier.startWork(time);
        return true;
      }
      await Notifier.stampFailed();
    }
    return false;
  }

  // 退社
  async leaveWork() {
    const response = await this.stamp(this.constructor.StampingType.OFF);
    if (response) {
      const time = response.leaveTime();
      if (time) {
        await Notifier.leaveWork(time);
        return true;
      }
      await Notifier.stampFailed();
    }
    return false;
  }

  // 出社・退社の送信処理
  async stamp(stampingType, retry = false) {
    const token = this.state.csrfToken();
    if (token) {
      const response = await this.client.stamp(stampingType, token);
      if (response.authorized()) {
        await this.state.update(response).save();
        return response;
      }
    }

    if (retry) {
      // リトライでも失敗したなら予期せぬ状態が発生している
      await Notifier.unexpectedError('打刻処理',
        token ? '打刻リクエストが認証されませんでした。'
              : 'トークンが見つかりませんでした。'
      );
    } else {
      // 初回ならログインし直して再実行する
      if (await this.login()) {
        return this.stamp(stampingType, true);
      }
    }
    return null;
  }
}

/**
 * 勤之助との通信を行うクラス
 * 全てのメソッドがPromiseを返す
 */
class KinnosukeClient {
  async request(option) {
    const response = await fetch(Kinnosuke.SiteUrl, option);
    if (!response.ok)
      throw new Error(`Request failed. (${response.status} ${response.statusText})`);
    return new KinnosukeResponse(await response.text());
  }

  // サイトトップのHTMLを返す
  // ログインしていればトップページ、いなければログインページが返る
  getTop() {
    return this.request({
      cache: 'no-store',
      credentials: 'include',
    });
  }

  post(params) {
    return this.request({
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: Object.entries(params)
        .map(([ key, value ]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    });
  }

  // ログイン
  login(credential) {
    return this.post({
      module: 'login',
      y_companycd: credential.companycd,
      y_logincd: credential.logincd,
      password: credential.password,
      trycnt: 1,
    });
  }

  // ログアウト
  logout() {
    return this.post({
      module: 'logout',
    });
  }

  // タイムレコーダーを押す
  stamp(stampingType, token) {
    return this.post({
      module: 'timerecorder',
      action: 'timerecorder',
      [token.key]: token.value,
      timerecorder_stamping_type: stampingType,
    });
  }
}

/**
 * 勤之助のHTMLから情報を取り出すクラス
 */
class KinnosukeResponse {
  constructor(html) {
    this.html = html;
  }

  authorized() {
    return /<div class="user_name">/.test(this.html);
  }

  startTime() {
    return />出社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.exec(this.html)?.[1] ?? null;
  }

  leaveTime() {
    return />退社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.exec(this.html)?.[1] ?? null;
  }

  csrfToken() {
    return /name="(?<key>__sectag_[0-9a-f]+)" value="(?<value>[0-9a-f]+)"/.exec(this.html)?.groups ?? null;
  }

  static reMenu = new RegExp([
    /href="\.\/\?module=(?<module>[^&]+)&(?:amp;)?action=(?<action>[^"]+)">/,
    /.+?src="(?<icon>[^"]+)" alt="(?<title>[^"]+)"/
  ].map(_ => _.source).join(''), 's');

  menuList() {
    let pos, parts;

    // メニュー左側表示
    if ((pos = this.html.search(/<table border="0" cellpadding="0" cellspacing="0" width="120">/)) !== -1) {
      const part = this.html.substr(pos);
      parts = part.substr(0, part.search(/<\/table>/)).split(/<\/tr>/);
    }
    // メニュー上部表示
    else if ((pos = this.html.search(/<td align="center" valign="top" width="72">/)) !== -1) {
      const part = this.html.substr(pos);
      parts = part.substr(0, part.search(/<\/tr>/)).split(/<\/td>/);
    }

    if (parts) {
      return parts.map((menu) => this.constructor.reMenu.exec(menu)?.groups ?? null)
        .filter((menu) => menu !== null);
    }
    return null;
  }
}
