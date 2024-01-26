/**
 * 勤之助のHTMLから情報を取り出すクラス
 */
export default class KinnosukeResponse {
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

    if (parts) {
      // 正規表現が長すぎるので分割しておいてくっつける
      const reMenu = [
        /href="\.\/\?module=(?<module>[^&]+)&(?:amp;)?action=(?<action>[^"]+)">/,
        /.+?src="(?<icon>[^"]+)" alt="(?<title>[^"]+)"/
      ].map(_ => _.source).join('');

      return parts.map((menu) => RegExp(reMenu, 's').exec(menu)?.groups)
        .filter((menu) => menu != null);
    }
    return;
  }
}
