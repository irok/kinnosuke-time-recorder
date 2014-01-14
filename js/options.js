(function(bg)
{
  var KTR = bg.KTR;

  // 設定を読み込んでフォームにセットする
  function restore() {
    $("#cstmid").val(KTR.credential.get("cstmid"));
    $("#userid").val(KTR.credential.get("userid"));
    $("#passwd").val(KTR.credential.get("passwd"));
  }

  // 設定を保存する
  function save() {
    KTR.credential.update(
      $("#cstmid").val(),
      $("#userid").val(),
      $("#passwd").val()
    );
    KTR.status.update(function(status){
      KTR.notify("保存しました。");
    });
  }

  $(function(){
    restore();
    $("#saveBtn").click(save);
  });
}
)(chrome.extension.getBackgroundPage());
