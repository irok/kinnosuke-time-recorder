var dialogs = [], $dcon;

$(function() {
    $dcon = $('#modalDialogContainer');
    init();
});

/**
 * メニュー初期化
 */
function init() {
    const $service = $('#service');
    const $options = $('#options');

    // 認証情報があれば出社、退社を表示
    if (KTR.credential.valid()) {
        $('.inout-block').css('display', 'table');
    }

    // メニューを追加
    KTR.menuList.get((menus) => {
        menus.forEach((menu) => {
            $(`<li class="menu enabled" data-module="${menu.module}" data-action="${menu.action}"/>`)
                .append(`<img src="${KTR.service.url()}${menu.icon}"/>`)
                .append(menu.title)
                .insertBefore($service);
        });
    });

    // イベント設定
    $service.click(() => openKTR());
    $options.click(() => window.open('/html/options.html', '_blank'));
    $('.menu').click(function() {
        var $this = $(this);
        openKTR({
            module: $this.data('module'),
            action: $this.data('action')
        });
    });

    // 状態による内容の設定
    KTR.status.update((status) => {
        // 出社、退社
        updateMenu(status);

        // お知らせ
        if (status.information.recent) {
            $service.text('新しいお知らせ').addClass('attention');
        }
    });
}

/**
 * 出社、退社、お知らせの表示
 */
function updateMenu(status) {
    if (status.code === KTR.STATUS.UNKNOWN) {
        return;
    }

    if (status.start) {
        $('#action1').text('出社 ' + status.start).removeClass('enabled').unbind('click', startWork);
    } else {
        $('#action1').addClass('enabled').click(startWork);
    }

    if (status.leave) {
        $('#action2').text('退社 ' + status.leave).removeClass('enabled').unbind('click', leaveWork);
    } else {
        $('#action2').addClass('enabled').click(leaveWork);
    }
}

/**
 * 出社処理
 */
function startWork() {
    confirmDialog('出社しましたか？', stamp.bind(null, KTR.STAMP.ON));
}

/**
 * 退社処理
 */
function leaveWork() {
    confirmDialog('退社しますか？', stamp.bind(null, KTR.STAMP.OFF));
}

/**
 * 打刻
 */
function stamp(type) {
    KTR.service.stamp(type, updateMenu);
}

/**
 * 確認ダイアログを開く
 */
function confirmDialog(msg, callback) {
    openDialog(
        $('<p/>').text(msg),
        $('<button/>').addClass('confirm').text('はい')  .click(closeDialog).click(callback),
        $('<button/>').addClass('confirm').text('いいえ').click(closeDialog)
    );
}

/**
 * ダイアログを開く
 */
function openDialog() {
    var dialogId = 'modalDialog' + (dialogs.length + 1);
    var $diag = $('<div id="' + dialogId + '"/>').hide();
    var $m = $('<div/>').addClass('modal');
    var $d = $('<div/>').addClass('dialog');
    for (var i = 0, max = arguments.length; i < max; i++) {
        $d.append(arguments[i]);
    }
    $diag.append($m).append($d).appendTo($dcon);
    $diag.show(100, () => {
        $d.css('top', ($m.innerHeight() - $d.innerHeight()) / 2);
    });
    dialogs.push($diag);
}

/**
 * ダイアログを閉じる
 */
function closeDialog(recursive) {
    var $diag = dialogs.pop();
    if ($diag) {
        $diag.hide(100, () => {
            $diag.empty().remove();
            if (recursive) {
                closeDialog(true);
            }
        });
    }
}

/**
 * 勤之助を開く
 */
function openKTR(param) {
    var url = KTR.service.url();
    if (typeof param === 'object') {
        url += `?module=${param.module}&action=${param.action}`;
    }

    // 認証情報がなかったらそのまま開く
    if (!KTR.credential.valid()) {
        window.open(url, '_blank');
        return;
    }

    // ログインエラーなどが発生しても勤之助を開く
    var error_bak = KTR.error;
    var _open = (arg) => {
        KTR.error = error_bak;
        if (typeof arg === 'object') {
            KTR.information.changeStatusToRead(arg);
        }
        window.open(url, '_blank');
    };
    KTR.error = _open;
    KTR.status.update(_open, true);
}
