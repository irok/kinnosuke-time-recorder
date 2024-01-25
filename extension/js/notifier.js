/**
 * デスクトップ通知を出すクラス
 * メソッドの戻り値はすべてPromise
 */
export default class Notifier {
  static async notify(message, options = {}) {
    const manifest = chrome.runtime.getManifest();
    return await chrome.notifications.create({
      type: 'basic',
      iconUrl: manifest.icons['128'],
      title: manifest.name,
      message, ...options
    });
  }

  static loginFailed() {
    return this.notify('ログインに失敗しました', {
      contextMessage: 'ログイン情報が正しくないか、勤之助がメンテナンス中の可能性があります。',
    });
  }

  static startWork(time) {
    return this.notify('出社しました', {
      contextMessage: time,
    });
  }

  static leaveWork(time) {
    return this.notify('退社しました', {
      contextMessage: time,
    });
  }

  static stampFailed() {
    return this.notify('処理に失敗しました');
  }

  static unexpectedError(title, detail) {
    return this.notify(`${ title }で想定外の状況が発生しました`, {
      contextMessage: `${ detail }\n時間をおいても改善しない場合は開発者にご連絡ください。`,
    });
  }

  static saveCredential() {
    return this.notify('保存しました');
  }

  static remindStamp() {
    return this.notify('今日はまだ打刻していません');
  }

  static message(message, contextMessage) {
    return this.notify(message, { contextMessage });
  }
}
