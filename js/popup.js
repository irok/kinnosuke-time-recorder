(function(bg)
{
  var KTR = bg.KTR, $dcon, dialogs = [];

  /**
   * 初期化
   */
  function init() {
    var status = KTR.status.cache();
    if (status === null) {
      KTR.status.update(init);
      return;
    }

    $dcon = $("#modalDialogContainer");

    // 出社、退社
    updateStatus(status);

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

  /**
   * 出社、退社の表示
   */
  function updateStatus(status) {
    $("#action1").text("出社").removeClass("enabled").unbind("click", start_work);
    $("#action2").text("退社").removeClass("enabled").unbind("click", leave_work);

    if (status.code !== KTR.STATUS.UNKNOWN) {
      if (status.start)
        $("#action1").text("出社 " + status.start);
      else
        $("#action1").addClass("enabled").click(start_work);

      // 退社
      if (status.leave)
        $("#action2").text("退社 " + status.leave);
      else
        $("#action2").addClass("enabled").click(leave_work);
    }
  }

  /**
   * 出社処理
   */
  function start_work() {
    confirmDialog("出社しましたか？", function(){
      stamp(KTR.STAMP.ON);
    });
  }

  /**
   * 退社処理
   */
  function leave_work() {
    confirmDialog("退社しますか？", function(){
      stamp(KTR.STAMP.OFF);
    });
  }

  /**
   * 確認ダイアログを開く
   */
  function confirmDialog(msg, callback) {
    var dialogId = dialogs.length + 1;
    var $diag = $('<div id="modalDialog'+dialogId+'"/>').hide();
    var $m = $("<div/>").addClass("modal");
    var $d = $("<div/>").addClass("dialog")
           .append($("<p/>").text(msg))
           .append($("<button/>").addClass("confirm").text("はい")  .click(closeDialog).click(callback))
           .append($("<button/>").addClass("confirm").text("いいえ").click(closeDialog));
    $diag.append($m).append($d).appendTo($dcon);
    $diag.show(100, function(){
      $d.css("top", ($m.innerHeight() - $d.innerHeight()) / 2);
    });
    dialogs.push($diag);
  }

  /**
   * ダイアログを閉じる
   */
  function closeDialog(recursive) {
    var $diag = dialogs.pop();
    if ($diag) {
      $diag.hide(100, function(){
        $diag.empty().remove();
        if (recursive)
          closeDialog(true);
      });
    }
  }

  /**
   * 打刻
   */
  function stamp(type) {
    KTR.service.stamp(type, updateStatus);
  }

  $(init);
}
)(chrome.extension.getBackgroundPage());
