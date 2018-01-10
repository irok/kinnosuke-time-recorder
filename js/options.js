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

    KTR.notify({
        message: '保存しました。'
    });

    KTR.service.logout(() => {
        KTR.status.update(null, true);
    });
}
