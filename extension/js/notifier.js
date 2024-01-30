/**
 * デスクトップ通知を出すクラス
 * メソッドの戻り値はすべてPromise
 */
export default class Notifier {
  // 多重通知を避ける時間
  static CooldownTime = 3 * 1000;

  // 多重通知防止判定 (通知してはダメな場合に true が返る)
  static async isDuringCooldown(key) {
    const now = Date.now();
    const data = {};
    try {
      const { notifier } = await chrome.storage.session.get('notifier');
      Object.assign(data, JSON.parse(notifier));

      // 前回通知から一定時間の間ならクールダウンタイム
      const time = data[key];
      if (time && now < time + Notifier.CooldownTime) {
        return true;
      }
    } catch {}

    // 通知した時間を記録
    const notifier = JSON.stringify({ ...data, [key]: now });
    await chrome.storage.session.set({ notifier });

    return false;
  }

  // 通知を出す
  async notify(message, { contextMessage, cooldown = false } = {}) {
    if (cooldown && await Notifier.isDuringCooldown(message)) {
      return;
    }

    // 通知する
    const manifest = chrome.runtime.getManifest();
    return chrome.notifications.create({
      type: 'basic',
      iconUrl: manifest.icons['128'],
      title: manifest.name,
      message, contextMessage,
    });
  }

  saveCredential() {
    return this.notify('保存しました');
  }

  remindStamp() {
    return this.notify('今日はまだ出社していません', {
      cooldown: true,
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

  loginFailed() {
    return this.notify('ログインに失敗しました', {
      contextMessage: 'ログイン情報が正しくないか、勤之助がメンテナンス中の可能性があります。',
      cooldown: true,
    });
  }

  stampFailed() {
    return this.notify('勤怠処理に失敗しました');
  }

  networkError(detail) {
    return this.notify('通信中にエラーが発生しました', {
      contextMessage: detail,
      cooldown: true,
    });
  }

  unexpectedError(title, detail) {
    return this.notify(`${ title }で想定外の状況が発生しました`, {
      contextMessage: `${ detail }\n時間をおいても改善しない場合は開発者にご連絡ください。`,
      cooldown: true,
    });
  }
}
