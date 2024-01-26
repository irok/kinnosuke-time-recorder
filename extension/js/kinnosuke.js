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
    let url = Kinnosuke.SiteUrl;
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
    instance.notifier = new Notifier();
    await instance.remindStamp();
    return instance;
  }

  // まだ出社してなければリマインドする
  async remindStamp() {
    const today = Kinnosuke.today();
    if (this.state.lastRemindDate() != today) {
      if (this.state.authorized()) {
        if (this.state.code() == State.Code.BEFORE) {
          await this.notifier.remindStamp();
        }
        await this.state.setLastRemindDate(today).save();
      }
    }
  }

  // ログイン
  async login() {
    const credential = await Credential.retrieve();
    if (credential.valid()) {
      try {
        const response = await this.client.login(credential);
        if (response.authorized()) {
          await this.state.update(response).save();
          await this.menus.update(response).save();
          return true;
        }
        await this.notifier.loginError();
      } catch (e) {
        await this.notifier.networkError(e.statusLine);
      }
    }
    await this.state.reset().save();
    return false;
  }

  // ログアウト
  async logout() {
    if (this.state.authorized()) {
      // 認証されていたらログアウトする (例外は握りつぶす)
      await this.client.logout().catch(_ => void _);
    }
    await this.state.reset().save();
    await this.menus.reset().save();
  }

  // セッションを維持する (alarmで定期実行される)
  async keepAlive() {
    // 前回が認証済みだったなら
    if (this.state.authorized()) {
      // 実際の状態を取得して更新する (通信エラー時は空のレスポンスを返す)
      const response = await this.client.getTop().catch(e => e.emptyResponse);
      this.state.update(response);

      // 認証済みなら状態を保存して終了
      if (this.state.authorized()) {
        await this.state.save();
        return;
      }
    }

    // 認証されていなければログインする
    await this.login();
  }

  // 出社
  async startWork() {
    const response = await this.stamp(Kinnosuke.StampingType.ON);
    if (response) {
      const time = response.startTime();
      if (time) {
        await this.notifier.startWork(time);
        return true;
      }
      await this.notifier.stampFailed();
    }
    return false;
  }

  // 退社
  async leaveWork() {
    const response = await this.stamp(Kinnosuke.StampingType.OFF);
    if (response) {
      const time = response.leaveTime();
      if (time) {
        await this.notifier.leaveWork(time);
        return true;
      }
      await this.notifier.stampFailed();
    }
    return false;
  }

  // 出社・退社の送信処理
  async stamp(stampingType, retry = false) {
    const token = this.state.csrfToken();
    if (token) {
      try {
        const response = await this.client.stamp(stampingType, token);
        if (response.authorized()) {
          await this.state.update(response).save();
          return response;
        }
      } catch (e) {
        await this.notifier.networkError(e.statusLine);
        return null;
      }
    }

    if (retry) {
      // リトライでも失敗したなら予期せぬ状態が発生している
      await this.notifier.unexpectedError('打刻処理',
        token ? 'リクエストが正常に受理されませんでした。'
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
 * 全てのメソッドがPromiseを通じてKinnosukeResponseを返す
 * ステータスコードが200-299以外の場合は例外を投げる
 */
class KinnosukeClient {
  async request(option) {
    const response = await fetch(Kinnosuke.SiteUrl, option);
    if (!response.ok) {
      throw {
        statusLine: `${response.status} ${response.statusText}`,
        emptyResponse: new KinnosukeResponse(''),
      };
    }
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
      y_companycd: credential.companycd(),
      y_logincd: credential.logincd(),
      password: credential.password(),
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

  // @returns boolean
  authorized() {
    return /<div class="user_name">/.test(this.html);
  }

  // @returns string or undefined
  startTime() {
    return />出社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.exec(this.html)?.[1];
  }

  // @returns string or undefined
  leaveTime() {
    return />退社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.exec(this.html)?.[1];
  }

  // @returns object or undefined
  csrfToken() {
    return /name="(?<key>__sectag_[0-9a-f]+)" value="(?<value>[0-9a-f]+)"/.exec(this.html)?.groups;
  }

  // 正規表現が長すぎるので分割しておいてくっつける
  static reMenu = new RegExp([
    /href="\.\/\?module=(?<module>[^&]+)&(?:amp;)?action=(?<action>[^"]+)">/,
    /.+?src="(?<icon>[^"]+)" alt="(?<title>[^"]+)"/
  ].map(_ => _.source).join(''), 's');

  // @returns array or undefined
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

    if (!parts) return;
    return parts.map((menu) => KinnosukeResponse.reMenu.exec(menu)?.groups)
      .filter((menu) => menu != null);
  }
}
