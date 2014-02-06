(function(bg)
{
  var KTR = bg.KTR, $m, $d;

  // 初期化
  function init() {
    var status = KTR.status.cache();
    if (status === null) {
      KTR.status.update(init);
      return;
    }

    // そちこちで使うのでとっておく
    $m = $("#modal");
    $d = $("#dialog");

    if (status.code !== KTR.STATUS.UNKNOWN) {
      // 出社
      if (status.start) {
        $("#action1").text("出社 " + status.start);
      }
      else {
        $("#action1").addClass("enabled").click(function(){
          confirmDialog("出社しますか？", function(){
            stamp(KTR.STAMP.ON);
          });
        });
      }

      // 退社
      if (status.leave) {
        $("#action2").text("退社 " + status.leave);
      }
      else {
        $("#action2").addClass("enabled").click(function(){
          confirmDialog("退社しますか？", function(){
            stamp(KTR.STAMP.OFF);
          });
        });
      }
    }

    // 勤之助を開く
    $("#service").click(function(){
      KTR.status.update(function(){
        window.open(KTR.service.url, "_blank");
      });
    });

    // 打刻忘れ／訂正
    $("#rectify").click(function(){
      KTR.status.update(function(){
        window.open(KTR.service.url + "?application_form_master_id=4&entry=1&module=application_form&action=editor&status=default&search_acceptation_status=1&application_remarks="+encodeURIComponent("打刻し忘れました。"), "_blank");
      });
    });

    // オプション
    $("#options").click(function(){
      window.open("/html/options.html", "_blank");
    });
  }

  // 確認ダイアログを開く
  function confirmDialog(msg, callback) {
    $m.show(100);
    $d.empty()
      .append($("<p/>").text(msg))
      .append($("<button/>").text("はい")  .click(closeDialog).click(callback))
      .append($("<button/>").text("いいえ").click(closeDialog))
      .show(100, function(){
        $d.css("top", ($m.innerHeight() - $d.innerHeight()) / 2);
      });
  }

  // ダイアログを閉じる
  function closeDialog() {
    $m.hide(100);
    $d.hide(100, function(){ $d.empty() });
  }

  // 打刻
  function stamp(type) {
    KTR.service.stamp(type, function(){
      location.reload(true);
    });
  }

  $(init);
}
)(chrome.extension.getBackgroundPage());
