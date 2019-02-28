$(function() {
    restore();
    $('#saveBtn').click(save);
});

// 設定を読み込んでフォームにセットする
function restore() {
    KTR.credential.get((cstmid, userid, passwd) => {
        $('#cstmid').val(cstmid);
        $('#userid').val(userid);
        $('#passwd').val(passwd);
    });

    $(`[name="site"]:eq(${KTR.site.get()})`).prop('checked', true);

    const msg = KTR.message.get();
    $('#start').val(msg.start).prop('placeholder', KTR.MESSAGE.start);
    $('#leave').val(msg.leave).prop('placeholder', KTR.MESSAGE.leave);

    const alarms = KTR.alarms.get();
    $('#start-alarm-begin').val(alarms.startAlarmBegin);
    $('#start-alarm-end').val(alarms.startAlarmEnd);
    $('#leave-alarm-begin').val(alarms.leaveAlarmBegin);
    $('#leave-alarm-end').val(alarms.leaveAlarmEnd);

    /**
     * ログイン後
     */
    if (KTR.credential.valid()) {
        KTR.service._request(
            {method: 'GET'},
            '?module=timesheet&action=browse',
            (html) => {
                const summaryCols = KTR.workInfo.workTableColumns(html, 'summary');
                const dayCols     = Object.keys(summaryCols).filter( (key) => { return key.match('日'); });
                dayCols.forEach((val) => {
                    $('#holiday-check').append(`<div><label><input type="checkbox" name="holidays[]" value="${val}">${val}</label></div>`);
                });
                document.querySelector('#after-logged-in').style.display = 'block';
            }
        );
    }
}

// 設定を保存する
function save() {
    KTR.credential.update(
        $('#cstmid').val(),
        $('#userid').val(),
        $('#passwd').val()
    );
    KTR.site.update($('[name="site"]:checked').val());
    KTR.message.update({
        start: $('#start').val(),
        leave: $('#leave').val()
    });
    KTR.alarms.update({
        startAlarmBegin: $('#start-alarm-begin').val(),
        startAlarmEnd: $('#start-alarm-end').val(),
        leaveAlarmBegin: $('#leave-alarm-begin').val(),
        leaveAlarmEnd: $('#leave-alarm-end').val()
    });

    KTR.notify({
        message: '保存しました。'
    });

    KTR.service.logout(() => {
        KTR.status.update(null, true);
    });
}
