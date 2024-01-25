/**
 * デスクトップ通知を出すクラス
 * メソッドの戻り値はすべてPromise
 */
export default class Notifier {
  constructor() {
    this.notified = {};
  }

  async notify(message, options = {}) {
    // 同じ通知は2度出さない
    if (this.notified[message]) return;
    this.notified[message] = true;

    // 通知する
    const manifest = chrome.runtime.getManifest();
    return chrome.notifications.create({
      type: 'basic',
      iconUrl: manifest.icons['128'],
      title: manifest.name,
      message, ...options
    });
  }

  loginFailed() {
    return this.notify('ログインに失敗しました', {
      contextMessage: 'ログイン情報が正しくないか、勤之助がメンテナンス中の可能性があります。',
    });
  }

  startWork(time) {
    return this.notify('出社しました', {
      contextMessage: time,
    });
  }

  leaveWork(time) {
    return this.notify('退社しました', {
      contextMessage: time,
    });
  }

  stampFailed() {
    return this.notify('処理に失敗しました');
  }

  unexpectedError(title, detail) {
    return this.notify(`${ title }で想定外の状況が発生しました`, {
      contextMessage: `${ detail }\n時間をおいても改善しない場合は開発者にご連絡ください。`,
    });
  }

  networkError(detail) {
    return this.notify('通信中にエラーが発生しました', {
      contextMessage: detail,
    });
  }

  saveCredential() {
    return this.notify('保存しました');
  }

  remindStamp() {
    return this.notify('今日はまだ打刻していません');
  }

  message(message, contextMessage) {
    return this.notify(message, { contextMessage });
  }
}
