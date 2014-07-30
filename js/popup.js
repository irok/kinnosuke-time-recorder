/*global KTR,$ */

var dialogs = [], $dcon;

$(function() {
    $dcon = $('#modalDialogContainer');
    init();
});

/**
 * メニュー初期化
 */
function init() {
    // 勤之助を開く
    $('#service').click(function(){ openKTR() });

    // 各種申請
    $('#appform').click(function(){ openApplicationForm() });

    // オプション
    $('#options').click(function() {
        window.open('/html/options.html', '_blank');
    });

    // 状態による内容の設定
    KTR.status.update(function(status) {
        // 出社、退社
        updateMenu(status);

        // お知らせ
        if (status.information.recent) {
            $('#service').text('新しいお知らせ').addClass('attention');
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
    confirmDialog('出社しましたか？', stamp.bind(this, KTR.STAMP.ON));
}

/**
 * 退社処理
 */
function leaveWork() {
    confirmDialog('退社しますか？', stamp.bind(this, KTR.STAMP.OFF));
}

/**
 * 打刻
 */
function stamp(type) {
    KTR.service.stamp(type, updateMenu);
}

/**
 * 各種申請
 */
function openApplicationForm() {
    openKTR({
        module: 'application_form',
        action: 'application_form',
    });
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
    $diag.show(100, function() {
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
        $diag.hide(100, function() {
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
    var url = KTR.service.url;
    if (typeof param === 'object') {
        url += '?' + $.map(Object.keys(param), function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(param[key]);
        }).join('&')
    }

    // ログインエラーなどが発生しても勤之助を開く
    var error_bak = KTR.error;
    var _open = function(arg) {
        KTR.error = error_bak;
        if (typeof arg === 'object') {
            KTR.information.changeStatusToRead(arg);
        }
        window.open(url, '_blank');
    };
    KTR.error = _open;
    KTR.status.update(_open, true);
}

