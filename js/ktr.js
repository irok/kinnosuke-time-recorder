/**
 * Kinnosuke Time Recorder
 */
((root) => {
    /**
     * Constant
     */
    const KTR = root.KTR = {
        STATUS: {UNKNOWN: 0, BEFORE: 1, ON_THE_JOB: 2, AFTER: 3},
        BADGE: ['#fff', '#ffc800', '#60d880', '#46d'],
        TITLE: ['設定をしてください', '未出社', '出社', '退社'],
        STAMP:  {ON: 1, OFF: 2},
        ACTION: ['', '出社', '退社'],
        MESSAGE: {
            start: '出社しましたか？',
            leave: '退社しますか？'
        },
        CACHE_TTL: 4 * 60 * 60 * 1000,
        HOSTS: [
            'https://www.4628.jp/',
            'https://www.e4628.jp/'
        ]
    };

    /**
     * No operation
     */
    const NOP = () => void(0);

    /**
     * 暗号化
     */
    const Crypto = (() => {
        // https://code.google.com/p/crypto-js/#The_Cipher_Output
        const option = {
            format: {
                stringify(cipherParams) {
                    // create json object with ciphertext
                    const jsonObj = {
                        ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
                    };

                    // optionally add iv and salt
                    if (cipherParams.iv) {
                        jsonObj.iv = cipherParams.iv.toString();
                    }
                    if (cipherParams.salt) {
                        jsonObj.s = cipherParams.salt.toString();
                    }

                    // stringify json object
                    return JSON.stringify(jsonObj);
                },
                parse(jsonStr) {
                    // parse json string
                    const jsonObj = JSON.parse(jsonStr);

                    // extract ciphertext from json object, and create cipher params object
                    const cipherParams = CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
                    });

                    // optionally extract iv and salt
                    if (jsonObj.iv) {
                        cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
                    }
                    if (jsonObj.s) {
                        cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
                    }

                    return cipherParams;
                }
            }
        };

        const secret = () => {
            let s = localStorage.Secret;
            if (!s) {
                s = localStorage.Secret = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
            }
            return s;
        };

        // public interface
        return {
            encrypt(plaintext) {
                return CryptoJS.AES.encrypt(plaintext, secret(), option).toString();
            },
            decrypt(encrypted) {
                return CryptoJS.AES.decrypt(encrypted, secret(), option).toString(CryptoJS.enc.Utf8);
            }
        };
    })();

    /**
     * debug
     */
    KTR.debug = {
        messages: [],
        add(msg) {
            KTR.debug.messages.push(msg);
        },
        clear() {
            KTR.debug.messages.length = 0;
        },
        save(msg) {
            let t = [];
            try {
                t = JSON.parse(localStorage.debug);
            }
            catch (e) {}        // eslint-disable-line no-empty

            KTR.debug.add(msg);
            t.push({
                date: Date.now(),
                messages: KTR.debug.messages
            });
            localStorage.debug = JSON.stringify(t);
            KTR.debug.clear();
        }
    };

    /**
     * View管理
     */
    KTR.view = {
        update(status) {
            const ba = chrome.browserAction;
            let enabled;
            if (status === null || status.code === KTR.STATUS.UNKNOWN) {
                ba.setBadgeText({text: ''});
                ba.setTitle({title: KTR.TITLE[KTR.STATUS.UNKNOWN]});
                enabled = false;
            } else {
                ba.setBadgeText({text: ' '});
                ba.setBadgeBackgroundColor({color: KTR.BADGE[status.code]});
                ba.setTitle({title: KTR.TITLE[status.code]});
                KTR.firstAnnounce(status);
                enabled = true;
            }
            return enabled;
        },
        update_from_cache() {
            return KTR.view.update(status_cache());
        }
    };

    /**
     * 通知
     */
    KTR.notify = (opts) => {
        const args = [];
        const manifest = chrome.runtime.getManifest();

        if (opts.id) {
            args.push(opts.id);
            delete opts.id;
        }
        args.push(Object.assign({
            type: 'basic',
            title: manifest.name,
            iconUrl: manifest.icons['48'],
        }, opts));

        chrome.notifications.create(...args);
    };

    chrome.notifications.onClicked.addListener((id) => {
        chrome.notifications.clear(id);
    });

    /**
     * エラー通知
     */
    KTR.error = (msg) => {
        KTR.notify({
            message: 'エラーが発生しました',
            contextMessage: msg
        });
    };

    /**
     * 勤怠催促の通知
     */
    KTR.firstAnnounce = (status) => {
        const today = (new Date()).toLocaleDateString();
        const last = localStorage.LastAnnounce;
        if (status.code === KTR.STATUS.BEFORE && last !== today) {
            KTR.notify({
                id: 'KTR-Announce',
                message: '今日はまだWeb勤怠をつけていません。'
            });
            localStorage.LastAnnounce = today;
        }
    };
    KTR.clearAnnounce = () => {
        chrome.notifications.clear('KTR-Announce');
    };

    /**
     * 認証情報管理
     */
    KTR.credential = {
        get(cb) {
            const t = {cstmid: '', userid: '', passwd: ''};
            try {
                Object.assign(t, JSON.parse(localStorage.Credential));
                t.passwd = Crypto.decrypt(t.encrypted);
            }
            catch (e) {}        // eslint-disable-line no-empty
            return cb(t.cstmid, t.userid, t.passwd);
        },
        update(cstmid, userid, passwd) {
            localStorage.Credential = JSON.stringify({
                cstmid: cstmid,
                userid: userid,
                encrypted: Crypto.encrypt(passwd)
            });
        },
        valid() {
            return KTR.credential.get((cstmid, userid, passwd) => {
                return cstmid !== '' && userid !== '' && passwd !== '';
            });
        }
    };

    /**
     * サイト情報
     */
    KTR.site = {
        get() {
            let siteId = localStorage.SiteId;
            if (typeof siteId === 'undefined') {
                siteId = localStorage.SiteId = 0;
            }
            return siteId;
        },
        update(siteId) {
            localStorage.SiteId = siteId;
        }
    };

    /**
     * メッセージ情報
     */
    KTR.message = {
        get(key) {
            const msg = Object.assign({}, KTR.MESSAGE);
            try {
                Object.assign(msg, JSON.parse(localStorage.Message));
            }
            catch (e) {}        // eslint-disable-line no-empty
            return typeof key !== 'undefined' ? msg[key] : msg;
        },
        update(msg) {
            localStorage.Message = JSON.stringify(msg);
        }
    };

    /**
     * アラーム情報
     */
    KTR.alarms = {
        get() {
            let alarms = localStorage.Alarms;
            if (typeof alarms === 'undefined') {
                alarms = localStorage.Alarms = JSON.stringify({});
            }
            return JSON.parse(alarms);
        },
        update(alarms) {
            localStorage.Alarms = JSON.stringify(alarms);
        }
    };

    /**
     * メニュー管理
     */
    KTR.menuList = {
        get(cb) {
            let t = [];
            try {
                t = JSON.parse(localStorage.MenuList);
            }
            catch (e) {}        // eslint-disable-line no-empty
            return cb(t);
        },
        update(menus) {
            if (Array.isArray(menus) && menus.length > 0) {
                localStorage.MenuList = JSON.stringify(menus);
            }
        }
    };

    /**
     * 状態管理
     */
    KTR.status = {
        update(cb, force_connect = false) {
            if (!KTR.credential.valid()) {
                KTR.status.scan('');
                return;
            }

            let status;
            if (typeof cb !== 'function') {
                cb = NOP;
            }

            if (!force_connect && (status = status_cache()) !== null) {
                KTR.view.update(status);
                cb(status);
                return;
            }

            KTR.service.mytop((html) => {
                cb(KTR.status.scan(html));
            });
        },
        scan(html) {
            return KTR.status.change(KTR.status.scrape(html));
        },
        change(status) {
            status_cache(status.authorized ? status : null);
            KTR.view.update(status);
            return status;
        },
        scrape(html) {
            const status = {
                code: KTR.STATUS.UNKNOWN,
                authorized: /<div class="user_name">/.test(html),
                information: KTR.information.getStatus(html)
            };

            // 出退社時刻
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

            // メニューリスト
            let menuPos, menus;
            if ((menuPos = html.search(/<td align="center" valign="top" width="72">/)) !== -1) {
                const part = html.substr(menuPos);
                menus = part.substr(0, part.search(/<\/tr>/)).split(/<\/td>/);
            }
            else if ((menuPos = html.search(/<table border="0" cellpadding="0" cellspacing="0" width="120">/)) !== -1) {
                const part = html.substr(menuPos);
                menus = part.substr(0, part.search(/<\/table>/)).split(/<\/tr>/);
            }

            if (menus) {
                status.menus = [];
                menus.forEach((menu) => {
                    if (/<img src="([^"]+)" alt="([^"]+)"/.test(menu)) {
                        const {$1: icon, $2: title} = RegExp;
                        /href="\.\/\?module=(.+?)&(?:amp;)?action=(.+?)"/.test(menu);
                        const {$1: module, $2: action} = RegExp;
                        status.menus.push({title, icon, module, action});
                    }
                });
            }

            return status;
        }
    };

    /**
     * 状態のキャッシュ
     */
    function status_cache() {
        if (arguments.length === 0) {
            try {
                const cache = JSON.parse(localStorage.StatusCache);
                if (cache.expires >= Date.now()) {
                    return cache.data;
                }
            }
            catch(e) {}         // eslint-disable-line no-empty
            return null;
        }
        if (arguments[0] === null) {
            delete localStorage.StatusCache;
        } else {
            const expires = Date.now() + KTR.CACHE_TTL;
            const data = Object.assign({}, arguments[0]);
            delete data.menus;
            localStorage.StatusCache = JSON.stringify({data, expires});
        }
    }

    /**
     * お知らせ管理
     */
    KTR.information = {
        stable: {recent: false},
        lastDate() {
            return localStorage.LastInfo;
        },
        latestDate(html) {
            const matches = html.match(/<div class="notice_header">\n[^(]+\((\d{4})年(\d\d)月(\d\d)日&nbsp;(\d\d:\d\d)/);
            if (matches && matches.length === 5) {
                return `${matches[1]}/${matches[2]}/${matches[3]} ${matches[4]}`;
            }
            return null;
        },
        getStatus(html) {
            const last = KTR.information.lastDate(), latest = KTR.information.latestDate(html);
            if (latest && (!last || last < latest)) {
                return {
                    recent: true,
                    latest: latest
                };
            }
            return KTR.information.stable;
        },
        changeStatusToRead(status) {
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
        url: () => KTR.HOSTS[KTR.site.get()],

        // マイページトップにアクセスする
        mytop(cb) {
            KTR.service.get((html) => {
                if (KTR.status.scrape(html).authorized)
                    {cb(html);}
                else
                    {KTR.service.login(cb);}
            });
        },

        // ログインする
        login(cb, isRetry = false) {
            if (!KTR.credential.valid()) {
                return;
            }

            const query = KTR.credential.get((cstmid, userid, passwd) => {
                return {
                    module: 'login',
                    y_companycd: cstmid,
                    y_logincd: userid,
                    password: passwd
                };
            });
            KTR.service.post(query, (html) => {
                const status = KTR.status.scrape(html);
                if (status.authorized) {
                    KTR.menuList.update(status.menus);
                    cb(html);
                    return;
                }
                else if (/セッションタイムアウト/.test(html)) {
                    if (!isRetry) {
                        KTR.service.login(cb, true);
                        return;
                    }
                }
                KTR.error('ログインできませんでした。');
            });
        },

        // ログアウトする
        logout(cb) {
            const query = {
                kihon_settei: '#', module: 'logout', logout: 'ログアウト'
            };
            KTR.service.post(query, (html) => {
                KTR.status.scan(html);
                cb();
            });
        },

        // CSRFトークンを取得する
        getCsrfToken(cb) {
            KTR.service.mytop((html) => {
                const matches = html.match(/name="(__sectag_[0-9a-f]+)" value="([0-9a-f]+)"/);
                if (matches && matches.length !== 3) {
                    KTR.error('CSRFトークンを取得できませんでした。');
                    return null;
                }
                cb({key: matches[1], value: matches[2]});
            });
        },

        // 出社・退社ボタンを押す
        stamp(type, cb) {
            KTR.service.getCsrfToken((token) => {
                const query = {
                    module: 'timerecorder',
                    action: 'timerecorder',
                    scrollbody_tr: 200,
                    timerecorder_stamping_type: type,
                    [token.key]: token.value
                };
                KTR.service.post(query, (html) => {
                    const status = KTR.status.scan(html);
                    if (
                        type === KTR.STAMP.ON  && !status.start ||
                        type === KTR.STAMP.OFF && !status.leave
                    ) {
                        KTR.error('処理に失敗しました。');
                        return;
                    }
                    KTR.notify({
                        message: KTR.ACTION[type] + 'しました。',
                        contextMessage: ['', status.start, status.leave][type]
                    });
                    KTR.clearAnnounce();
                    cb(status);
                });
            });
        },

        // GETリクエストを送信する
        get(cb) {
            KTR.service._request({
                method: 'GET'
            }, cb);
        },

        // POSTリクエストを送信する
        post(obj, cb) {
            KTR.service._request({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: Object.keys(obj).map((key) => `${key}=${encodeURIComponent(obj[key])}`).join('&')
            }, cb);
        },

        _request(init, cb) {
            fetch(KTR.service.url(), Object.assign({
                cache: 'no-store',
                credentials: 'include'
            }, init))
                .then((res) => res.text())
                .then(cb)
                .catch(KTR.service.error);
        },

        // ネットワークエラー
        error({message}) {
            KTR.error(message);
        }
    };
})(this);
