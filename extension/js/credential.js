import CryptoJS from './vendor/crypto-js.js';

/**
 * 認証情報を暗号化して管理するクラス
 */
export default class Credential {
  static async retrieve() {
    try {
      const { credential } = await chrome.storage.sync.get('credential');
      const { companycd, logincd, encrypted, secret } = JSON.parse(credential);
      return new Credential(companycd, logincd, encrypted, secret);
    } catch {
      return new Credential();
    }
  }

  constructor(companycd = '', logincd = '', password = '', secret = null) {
    this.data = { companycd, logincd, encrypted: password, secret };

    if (secret === null) {
      this.data.secret = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
      this.data.encrypted = CryptoJS.AES.encrypt(password, this.data.secret).toString();
    }
  }

  companycd() {
    return this.data.companycd;
  }

  logincd() {
    return this.data.logincd;
  }

  password() {
    const { encrypted, secret } = this.data;
    return CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
  }

  async save() {
    const credential = JSON.stringify(this.data);
    await chrome.storage.sync.set({ credential });
  }

  valid() {
    return this.companycd !== '' && this.logincd !== '' && this.password !== '';
  }
}
