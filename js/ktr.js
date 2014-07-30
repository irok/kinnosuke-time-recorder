/*global $ */

/**
 * Kinnosuke Time Recorder
 */
var KTR = (function() {
    /**
     * Constant
     */
    var KTR = {
        STATUS: {UNKNOWN:0, BEFORE:1, ON_THE_JOB:2, AFTER:3},
        BADGE: ['', '#ff7', '#7f7', '#77f'],
        TITLE: ['設定をしてください', '未出社', '出社', '退社'],
        STAMP:  {ON:1, OFF:2},
        ACTION: ['', '出社', '退社']
    };

    /**
     * No operation
     */
    var NOP = function(){};

    /**
     * 暗号化
     */
    var Crypto = (function() {
        var option = {
            // https://code.google.com/p/crypto-js/#The_Cipher_Output
            format: {stringify:function(a){var b={ct:a.ciphertext.toString(CryptoJS.enc.Base64)};a.iv&&(b.iv=a.iv.toString());a.salt&&(b.s=a.salt.toString());return JSON.stringify(b)},parse:function(a){a=JSON.parse(a);var b=CryptoJS.lib.CipherParams.create({ciphertext:CryptoJS.enc.Base64.parse(a.ct)});a.iv&&(b.iv=CryptoJS.enc.Hex.parse(a.iv));a.s&&(b.salt=CryptoJS.enc.Hex.parse(a.s));return b}}
        };
        var secret = function() {
            var s = localStorage.Secret;
            if (!s) {
                s = localStorage.Secret = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
            }
            return s;
        };

        // public interface
        return {
            encrypt: function(plaintext) {
                return CryptoJS.AES.encrypt(plaintext, secret(), option).toString();
            },
            decrypt: function(encrypted) {
                return CryptoJS.AES.decrypt(encrypted, secret(), option).toString(CryptoJS.enc.Utf8);
            }
        };
    })();

    /**
     * View管理
     */
    KTR.view = {
        update: function(status) {
            if (status.code === KTR.STATUS.UNKNOWN) {
                chrome.browserAction.setBadgeText({text:''});
            } else {
                chrome.browserAction.setBadgeText({text:' '});
                chrome.browserAction.setBadgeBackgroundColor({color:KTR.BADGE[status.code]});
            }
            chrome.browserAction.setTitle({title:KTR.TITLE[status.code]});
        }
    };

    /**
     * 通知
     */
    KTR.notify = function(opts) {
        var manifest = chrome.runtime.getManifest();
        var options = $.extend({
                          type: 'basic',
                          title: manifest.name,
                          iconUrl: manifest.icons['128'],
                          notifyId: '',
                          autoClear: false
                      }, opts);
        var notifyId  = options.notifyId;  delete options.notifyId;
        var autoClear = options.autoClear; delete options.autoClear;
        chrome.notifications.create(notifyId, options, function(id) {
            if (autoClear) {
                setTimeout(function() {
                    KTR.notify.clear(id);
                }, 3.5 * 1000);
            }
        });
    };
    KTR.notify.clear = function(id) {
        chrome.notifications.clear(id, NOP);
    };

    /**
     * エラー通知
     */
    KTR.error = function(msg) {
        KTR.notify({
            message: 'エラーが発生しました',
            contextMessage: msg
        });
    };

    /**
     * 勤怠催促の通知
     */
    KTR.firstAnnounce = function(status) {
        var today = (new Date()).toLocaleDateString();
        var last = localStorage.LastAnnounce;
        if (status.code === KTR.STATUS.BEFORE && last !== today) {
            KTR.notify({
                notifyId: 'KTR-Announce',
                message: '今日はまだWeb勤怠をつけていません。'
            });
            localStorage.LastAnnounce = today;
        }
    };
    KTR.clearAnnounce = function() {
        chrome.notifications.clear('KTR-Announce', NOP);
    };

    /**
     * 認証情報管理
     */
    KTR.credential = {
        get: function(callback) {
            var t = {cstmid:'', userid:'', passwd:''};
            try {
                t = JSON.parse(localStorage.Credential);
                t.passwd = Crypto.decrypt(t.encrypted);
            }
            catch (e) {}
            return callback(t.cstmid, t.userid, t.passwd);
        },
        update: function(cstmid, userid, passwd) {
            localStorage.Credential = JSON.stringify({
                cstmid: cstmid,
                userid: userid,
                encrypted: Crypto.encrypt(passwd)
            });
        },
        valid: function() {
            return KTR.credential.get(function(cstmid, userid, passwd) {
                return cstmid !== '' && userid !== '' && passwd !== '';
            });
        }
    };

    /**
     * 状態管理
     */
    KTR.status = {
        update: function(callback, force_connect) {
            var status;
            if (typeof callback !== 'function') {
                callback = NOP;
            }

            if (!force_connect && (status = status_cache()) !== null) {
                KTR.view.update(status);
                callback(status);
                return;
            }

            KTR.service.mytop(function(html) {
                callback(KTR.status.apply(html));
            });
        },
        apply: function(html) {
            return KTR.status.apply_(KTR.status.analyze(html));
        },
        apply_: function(status) {
            if (status.authorized) {
                KTR.firstAnnounce(status);
                status_cache(status);
            } else {
                status_cache(null);
            }
            KTR.view.update(status);
            return status;
        },
        analyze: function(html) {
            var status = {
                code: KTR.STATUS.UNKNOWN,
                authorized: /ログアウト/.test(html)
            };
            if (/<input type="hidden" name="action" value="timerecorder"/.test(html)) {
                status.code = KTR.STATUS.BEFORE;
                if (/>出社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.test(html)) {
                    status.start = RegExp.$1;
                    status.code = KTR.STATUS.ON_THE_JOB;
                }
                if (/>退社<br(?:\s*\/)?>\((\d\d:\d\d)\)/.test(html)) {
                    status.leave = RegExp.$1;
                    status.code = KTR.STATUS.AFTER;
                }
            }
            status.information = KTR.information.getStatus(html);

            return status;
        }
    };

    /**
     * 状態のキャッシュ（TTL=10min）
     */
    function status_cache() {
        if (arguments.length === 0) {
            try {
                var cache = JSON.parse(localStorage.StatusCache);
                if (cache.expires >= Date.now()) {
                    return cache.data;
                }
            }
            catch(e){}
            return null;
        }
        if (arguments[0] === null) {
            delete localStorage.StatusCache;
        } else {
            localStorage.StatusCache = JSON.stringify({
                data: arguments[0],
                expires: Date.now() + 10 * 60 * 1000
            });
        }
    }

    /**
     * お知らせ管理
     */
    KTR.information = {
        stable: { recent: false },
        lastDate: function() {
            return localStorage.LastInfo;
        },
        latestDate: function(html) {
            var matches = html.match(/<div class="notice_header">\n[^(]+\((\d{4})年(\d\d)月(\d\d)日&nbsp;(\d\d:\d\d)/);
            if (matches && matches.length === 5) {
                return matches[1]+'/'+matches[2]+'/'+matches[3]+' '+matches[4];
            }
            return null;
        },
        getStatus: function(html) {
            var last = KTR.information.lastDate(), latest = KTR.information.latestDate(html);
            if (latest && (!last || last < latest)) {
                return {
                    recent: true,
                    latest: latest
                };
            }
            return KTR.information.stable;
        },
        changeStatusToRead: function(status) {
            if (status.information.recent) {
                localStorage.LastInfo = status.information.latest;
                status.information = KTR.information.stable;
                status_cache(status);
            }
        }
    };

    /**
     * 勤之助の操作
     */
    KTR.service = {
        url: 'https://www.4628.jp/',

        // マイページトップにアクセスする
        mytop: function(callback) {
            $.get(KTR.service.url, function(html) {
                if (KTR.status.analyze(html).authorized) {
                    callback(html);
                    return;
                }
                KTR.service.login(callback)
            });
        },

        // ログインする
        login: function(callback) {
            if (!KTR.credential.valid()) {
                return;
            }

            var formData = KTR.credential.get(function(cstmid, userid, passwd) {
                return {
                    module: 'login',
                    y_companycd: cstmid,
                    y_logincd: userid,
                    password: passwd
                };
            });
            KTR.service.post(formData, function(html) {
                if (KTR.status.analyze(html).authorized) {
                    callback(html);
                    return;
                }
                KTR.error('ログインできませんでした。');
            });
        },

        // ログアウトする
        logout: function(callback) {
            var formData = {
                kihon_settei:'#', module:'logout', logout:'ログアウト'
            };
            KTR.service.post(formData, function(html) {
                KTR.status.apply(html);
                callback();
            });
        },

        // CSRFトークンを取得する
        getCsrfToken: function(callback) {
            KTR.service.mytop(function(html) {
                var matches = html.match(/name="(__sectag_[0-9a-f]+)" value="([0-9a-f]+)"/);
                if (matches && matches.length !== 3) {
                    KTR.error('CSRFトークンを取得できませんでした。');
                    return null;
                }
                callback({key:matches[1], value:matches[2]});
            });
        },

        // 出社・退社ボタンを押す
        stamp: function(type, callback) {
            KTR.service.getCsrfToken(function(token) {
                var formData = {
                    module: 'timerecorder',
                    action: 'timerecorder',
                    scrollbody_tr: 200,
                    timerecorder_stamping_type: type
                };
                formData[token.key] = token.value;

                KTR.service.post(formData, function(html) {
                    var status = KTR.status.apply(html);
                    if (
                        type === KTR.STAMP.ON  && !status.start ||
                        type === KTR.STAMP.OFF && !status.leave
                    ) {
                        KTR.error('処理に失敗しました。');
                        return;
                    }
                    KTR.notify({
                        message: KTR.ACTION[type] + 'しました。',
                        contextMessage: ['', status.start, status.leave][type],
                        autoClear: true
                    });
                    KTR.clearAnnounce();
                    callback(status);
                });
            });
        },

        // POSTリクエストを送信する
        post: function(formData, callback) {
            $.post(KTR.service.url, formData, callback, 'html');
        }
    };

    return KTR;
})();
