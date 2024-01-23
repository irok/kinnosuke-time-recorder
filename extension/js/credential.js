import CryptoJS from './vendor/crypto-js.js';

/**
 * 認証情報を暗号化して管理するクラス
 * using crypto-js
 * https://code.google.com/p/crypto-js/#The_Cipher_Output
 */
export default class Credential {
  static async retrieve() {
    try {
      const { credential } = await chrome.storage.sync.get('credential');
      const { companycd, logincd, encrypted, secret } = JSON.parse(credential);
      const password = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
      return new Credential(companycd, logincd, password);
    } catch {
      return new Credential();
    }
  }

  constructor(companycd = '', logincd = '', password = '') {
    this.companycd = companycd;
    this.logincd = logincd;
    this.password = password;
  }

  async save() {
    const { companycd, logincd, password } = this;
    const secret = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
    const encrypted = CryptoJS.AES.encrypt(password, secret).toString();
    const credential = JSON.stringify({ companycd, logincd, encrypted, secret });
    await chrome.storage.sync.set({ credential });
  }

  valid() {
    return this.companycd !== '' && this.logincd !== '' && this.password !== '';
  }
}
