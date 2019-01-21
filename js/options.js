$(function() {
    restore();
    $('#saveBtn').click(save);
    $('#explain-btn').click(() => {
        $('.explain').fadeIn();
    });
});

// 設定を読み込んでフォームにセットする
function restore() {
    KTR.credential.get((cstmid, userid, passwd) => {
        $('#cstmid').val(cstmid);
        $('#userid').val(userid);
        $('#passwd').val(passwd);
    });

    $(`[name="site"]:eq(${KTR.site.get()})`).prop('checked', true);

    const worktype = KTR.worktype.get();
    $(`[name="work['show']"]:eq(${worktype.show})`).prop('checked', true);
    $(`[name="work['type']"]:eq(${worktype.type})`).prop('checked', true);

    const msg = KTR.message.get();
    $('#start').val(msg.start).prop('placeholder', KTR.MESSAGE.start);
    $('#leave').val(msg.leave).prop('placeholder', KTR.MESSAGE.leave);

    const alarms = KTR.alarms.get();
    $('#start-alarm-begin').val(alarms.startAlarmBegin);
    $('#start-alarm-end').val(alarms.startAlarmEnd);
    $('#leave-alarm-begin').val(alarms.leaveAlarmBegin);
    $('#leave-alarm-end').val(alarms.leaveAlarmEnd);

    const setting = KTR.tablesetting.get();
    for (key in setting) { $(`input[name="setting['${key}']"]`).val(setting[key]); }


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

    const worktype = {
        "show": Math.abs($(`[name="work['show']"]:checked`).val()),
        "type": Math.abs($(`[name="work['type']"]:checked`).val()),
    };
    KTR.worktype.update(worktype);

    if (worktype.show === 1) {
        var   flug     = false;
        const setting  = {};
        const required = ['fixed_day', 'actual_day', 'fixed_time', 'actual_time', 'today_start_time', 'today_actual_time'];
        $('[name^="setting"]').each((index, elm) => {
            const name    = $(elm).attr("name").replace("setting['", "").replace("']", "");
            setting[name] = Math.abs($(elm).val());
            if (required.includes(name) && $(elm).val() == 0) { flug = true; }
        });
        if (flug) { KTR.notify({ message: '必須項目を入力してください。' }); return; }
        KTR.tablesetting.update(setting);
    }


    KTR.notify({
        message: '保存しました。'
    });

    KTR.service.logout(() => {
        KTR.status.update(null, true);
    });
}
