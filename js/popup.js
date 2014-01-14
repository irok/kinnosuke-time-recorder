(function(bg)
{
  var KTR = bg.KTR;

  // 初期化
  function init() {
    var status = KTR.status.cache();
    if (status === null) {
      KTR.status.update(init);
      return;
    }

    if (status.code !== KTR.STATUS.UNKNOWN) {
      // 出社
      if (status.start) {
        $("#action1").text("出社 " + status.start);
      }
      else {
        $("#action1").addClass("enabled").click(function(){
          if (confirm("出社ボタンを押しますか？")) {
            KTR.service.stamp(KTR.STAMP.ON);
          }
        });
      }

      // 退社
      if (status.leave) {
        $("#action2").text("退社 " + status.leave);
      }
      else {
        $("#action2").addClass("enabled").click(function(){
          if (confirm("退社ボタンを押しますか？")) {
            KTR.service.stamp(KTR.STAMP.OFF);
          }
        });
      }
    }

    // 勤之助を開く
    $("#service").click(function(){
      KTR.status.update(function(){
        open(KTR.service.url, "_blank");
      })
    });

    // 設定
    $("#options").click(function(){
      open("/html/options.html", "_blank");
    });
  }

  $(init);
}
)(chrome.extension.getBackgroundPage());
