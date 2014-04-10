(function(app){
	var KTR = app.KTR;

	// 設定を読み込んでフォームにセットする
	function restore() {
		KTR.credential.get(function(cstmid, userid, passwd){
			$("#cstmid").val(cstmid);
			$("#userid").val(userid);
			$("#passwd").val(passwd);
		});
	}

	// 設定を保存する
	function save() {
		KTR.credential.update(
			$("#cstmid").val(),
			$("#userid").val(),
			$("#passwd").val()
		);
		KTR.notify("保存しました。");

		KTR.service.logout(function(){
			KTR.status.update(null, true);
		});
	}

	$(function(){
		restore();
		$("#saveBtn").click(save);
	});
})(chrome.extension.getBackgroundPage());
