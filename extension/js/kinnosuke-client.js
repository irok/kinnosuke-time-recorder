import { SiteUrl } from './constants.js';
import KinnosukeResponse from './kinnosuke-response.js';

/**
 * 勤之助との通信を行うクラス
 * 全てのメソッドがPromiseを通じてKinnosukeResponseを返す
 * ステータスコードが200-299以外の場合は例外を投げる
 */
export default class KinnosukeClient {
  async request(option) {
    const response = await fetch(SiteUrl, option);
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
