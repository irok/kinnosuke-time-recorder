import { SiteUrl, StampingType, WorkingStatus } from './constants.js';
import Credential from './credential.js';
import KinnosukeClient from './kinnosuke-client.js'
import Menus from './menus.js';
import Notifier from './notifier.js';
import Remind from './remind.js';
import State from './state.js';

/**
 * 勤之助を操作するクラス
 */
export default class Kinnosuke {
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
    let url = SiteUrl;
    if (module && action) {
      url += `?module=${ module }&action=${ action }`;
    }
    window.open(url, '_blank');
  }

  // コンストラクタにasyncは使えないので生成メソッドを用意する
  static async create(source = '') {
    const instance = new Kinnosuke();
    instance.source = source;
    instance.client = new KinnosukeClient();
    instance.notifier = new Notifier();
    instance.state = await State.retrieve();
    instance.menus = await Menus.retrieve();
    instance.remind = await Remind.retrieve();
    return instance;
  }

  // ログイン
  // @returns boolean
  async login() {
    const credential = await Credential.retrieve();
    if (credential.valid()) {
      try {
        const response = await this.client.login(credential);
        if (response.authorized()) {
          await this.state.update(response).save();
          await this.menus.update(response).save();
          await this.remindStamp();
          return true;
        }
        await this.notifier.loginFailed();
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
      await this.client.logout().catch(_ => void 0);
    }
    await this.state.reset().save();
    await this.menus.reset().save();
    await this.remind.reset().save();
  }

  // セッションを維持する (alarmで定期実行される)
  // @returns boolean
  async keepAlive() {
    // 前回が認証済みだったなら
    if (this.state.authorized()) {
      // 実際の状態を取得して更新する (通信エラー時は空のレスポンスを返す)
      const response = await this.client.getTop().catch(e => e.emptyResponse);
      this.state.update(response);

      // 認証済みなら状態を保存して終了
      if (this.state.authorized()) {
        await this.state.save();
        await this.remindStamp();
        return true;
      }
    }

    // 認証されていなければログインする
    return await this.login();
  }

  // まだ出社してなければリマインドする
  async remindStamp() {
    const today = Kinnosuke.today();
    if (this.remind.lastDate() != today && this.state.code() === WorkingStatus.BEFORE) {
      await this.notifier.remindStamp(this.source);
      await this.remind.setLastDate(today, this.source).save();
    }
  }

  // 出社
  async startWork() {
    const response = await this.stamp(StampingType.ON);
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
    const response = await this.stamp(StampingType.OFF);
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
