/**
 * Kinnosuke Time Recorder
 */
var KTR = {
  STATUS: {UNKNOWN:0, BEFORE:1, ON_THE_JOB:2, AFTER:3},
  BADGE: ["", "#ff7", "#7f7", "#77f"],
  TITLE: ["設定をしてください", "未出社", "出社", "退社"],
  STAMP:  {ON:1, OFF:2},
  ACTION: ["", "出社", "退社"],

  // Manifest
  manifest: chrome.runtime.getManifest(),

  // NOP
  NOP: function(){},

  // JsonFormatter
  // https://code.google.com/p/crypto-js/#The_Cipher_Output
  JsonFormatter: {stringify:function(a){var b={ct:a.ciphertext.toString(CryptoJS.enc.Base64)};a.iv&&(b.iv=a.iv.toString());a.salt&&(b.s=a.salt.toString());return JSON.stringify(b)},parse:function(a){a=JSON.parse(a);var b=CryptoJS.lib.CipherParams.create({ciphertext:CryptoJS.enc.Base64.parse(a.ct)});a.iv&&(b.iv=CryptoJS.enc.Hex.parse(a.iv));a.s&&(b.salt=CryptoJS.enc.Hex.parse(a.s));return b}}
};

/**
 * 認証情報
 */
KTR.credential = {
  __data: {},
  get: function(key) {
    var t = KTR.credential.__data;
    if (key === "passwd" && typeof t[key] !== "string") {
      var secret = KTR.credential.__secret();
      t[key] = CryptoJS.AES.decrypt(t.encrypted, secret, {format: KTR.JsonFormatter}).toString(CryptoJS.enc.Utf8);
    }
    return t[key];
  },
  update: function(cstmid, userid, passwd) {
    var secret = KTR.credential.__secret();
    KTR.credential.__data = {
      cstmid: cstmid,
      userid: userid,
      encrypted: CryptoJS.AES.encrypt(passwd, secret, {format: KTR.JsonFormatter}).toString()
    };
    localStorage["Credential"] = JSON.stringify(KTR.credential.__data);
  },
  valid: function() {
    var t = KTR.credential.__data;
    return t.cstmid !== "" && t.userid !== "" && KTR.credential.get("passwd") !== "";
  },
  retrieve: function() {
    try {
      var t = KTR.credential.__data = JSON.parse(localStorage["Credential"]);
      if (typeof t.encrypted === "undefined") {
        KTR.credential.update(t.cstmid, t.userid, t.passwd);
      }
    }
    catch (e) { KTR.credential.update("", "", "") }
  },
  __secret: function() {
    var pp = localStorage["Secret"];
    if (!pp) {
      pp = localStorage["Secret"] = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
    }
    return pp;
  }
};
KTR.credential.retrieve();

/**
 * 通知
 */
KTR.firstAnnounce = function(status) {
  var today = (new Date()).toLocaleDateString();
  var last = localStorage["LastAnnounce"];
  if (status.code === KTR.STATUS.BEFORE && last !== today) {
    KTR.notify("今日はまだWeb勤怠をつけていません。", {duration:0});
    localStorage["LastAnnounce"] = today;
  }
};
KTR.error = function(msg) {
  KTR.notify(msg, {title:"エラー", duration:0});
};
KTR.notify = function(msg, opts) {
  var notifyId = "KTR-notify" + (++KTR.notify.count);
  var options = $.extend({}, KTR.notify.defaultOptions,
    (typeof opts === "object" ? opts : {}), {message:msg}
  );
  var duration = options.duration;
  delete options.duration;

  chrome.notifications.create(
    notifyId, options,
    duration > 0 ? KTR.notify.clear.bind(this, duration) : KTR.NOP
  );
}
$.extend(KTR.notify, {
  clear: function(duration, id) {
    setTimeout(function(){ chrome.notifications.clear(id, KTR.NOP) }, duration);
  },
  defaultOptions: {
    type: "basic",
    title: "情報",
    iconUrl: KTR.manifest.icons["128"],
    duration: 3500
  },
  count: 0
});

/**
 * 状態管理
 */
KTR.status = {
  forceUpdate: function(callback) {
    KTR.service.logout(function(){
      callback();
      KTR.status.update(KTR.NOP);
    });
  },
  update: function(callback) {
    if (KTR.credential.valid()) {
      KTR.service.login(KTR.status.__update.bind(this, callback));
    } else {
      KTR.status.__update(callback);
    }
  },
  __update: function(callback, html) {
    var status = KTR.status.cache(KTR.status.extract(html));
    KTR.view.update(status);
    KTR.firstAnnounce(status);
    if (typeof callback === "function") {
      callback(status);
    }
  },
  extract: function(html) {
    var status = {
      code: KTR.STATUS.UNKNOWN
    };
    if (/出社/.test(html) && /退社/.test(html)) {
      status.code = KTR.STATUS.BEFORE;
      if (/>出社<br\/>\((\d\d:\d\d)\)/.test(html)) {
        status.start = RegExp.$1;
        status.code = KTR.STATUS.ON_THE_JOB;
      }
      if (/>退社<br\/>\((\d\d:\d\d)\)/.test(html)) {
        status.leave = RegExp.$1;
        status.code = KTR.STATUS.AFTER;
      }
    }
    return status;
  },
  cache: function(data) {
    if (typeof data === "object") {
      KTR.status.cache.data = $.extend(data, {
        expires: Date.now() + KTR.status.cache.ttl
      });
    }
    else {
      data = KTR.status.cache.data;
      if (data === null || data.expires < Date.now()) {
        return KTR.status.cache.data = null;
      }
    }
    return $.extend({}, data);
  }
};
$.extend(KTR.status.cache, {
  data: null,
  ttl: 30 * 60 * 1000
});

/**
 * View管理
 */
KTR.view = {
  update: function(status) {
    if (status.code === KTR.STATUS.UNKNOWN) {
      chrome.browserAction.setBadgeText({text:""});
    }
    else {
      chrome.browserAction.setBadgeText({text:" "});
      chrome.browserAction.setBadgeBackgroundColor({color:KTR.BADGE[status.code]});
    }
    chrome.browserAction.setTitle({title:KTR.TITLE[status.code]});
  }
};

/**
 * 勤之助の操作
 */
KTR.service = {
  url: "https://www.4628.jp/",

  // 出社・退社ボタンを押す
  stamp: function(type, callback) {
    KTR.service.getCsrfToken(function(token){
      var formData = {
        module: "timerecorder",
        action: "timerecorder",
        scrollbody_tr: 200,
        timerecorder_stamping_type: type
      };
      formData[token.key] = token.value;

      KTR.service.post(formData, function(html){
        var status = KTR.status.extract(html);
        if (
          type === KTR.STAMP.ON  && !status.start ||
          type === KTR.STAMP.OFF && !status.leave
        ) {
          KTR.error("処理に失敗しました。");
          return;
        }
        KTR.view.update(KTR.status.cache(status));
        KTR.notify(KTR.ACTION[type] + "しました。");
        callback(status);
      });
    });
  },

  // CSRFトークンを取得する
  getCsrfToken: function(callback) {
    KTR.service.login(function(html){
      var matches = html.match(/name="(__sectag_[0-9a-f]+)" value="([0-9a-f]+)"/);
      if (matches.length !== 3) {
        KTR.error("CSRFトークンを取得できませんでした。");
        return null;
      }
      callback({key:matches[1], value:matches[2]});
    });
  },

  // ログイン直後のページを取得する（必要ならログインする）
  login: function(callback) {
    $.get(KTR.service.url, function(html){
      // ログイン済みならそのままcallbackを呼ぶ
      if (/ログアウト/.test(html)) {
        callback(html);
        return;
      }

      // ログインする
      var formData = {
        y_companycd: KTR.credential.get("cstmid"),
        y_logincd:   KTR.credential.get("userid"),
        password:    KTR.credential.get("passwd"),
        login_save:1, Submit:"ログイン", module:"login"
      };
      KTR.service.post(formData, function(html){
        if (/value="ログイン"/.test(html)) {
          KTR.error("ログインできませんでした。");
          return;
        }
        callback(html);
      });
    });
  },

  // ログインしていたらログアウトする
  logout: function(callback) {
    $.get(KTR.service.url, function(html){
      // ログインしてなければそのままcallbackを呼ぶ
      if (!/ログアウト/.test(html)) {
        callback();
        return;
      }

      var formData = {
        kihon_settei:"#", logout:"ログアウト", module:"logout"
      };
      KTR.service.post(formData, function(html){
        callback();
      });
    });
  },

  // POSTリクエストを送信する
  post: function(formData, callback) {
    return $.ajax({
      type: "POST",
      url: KTR.service.url,
      data: formData,
      dataType: "html",
      cache: false,
      success: callback,
      error: function(jqXHR, textStatus, errorThrown){
        KTR.error(textStatus + ": " + errorThrown);
      }
    })
  }
};
