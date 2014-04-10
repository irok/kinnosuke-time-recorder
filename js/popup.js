(function(app){
	var KTR = app.KTR, dialogs = [], $dcon;

	/**
	 * メニュー初期化
	 */
	function init(status) {
		// 出社、退社
		updateStatus(status);

		// 勤之助を開く
		$('#service').click(function(){ openKTR() });
		if (status.information.recent) {
			$('#service').text('新しいお知らせ').addClass('attention');
		}

		// 打刻忘れ／訂正
		$('#rectify').click(function(){
			openKTR({
				application_form_master_id: 4,
				entry: 1,
				module: 'application_form',
				action: 'editor',
				status: 'default',
				search_acceptation_status: 1,
				application_remarks: '打刻し忘れました。'
			})
		});

		// オプション
		$('#options').click(function(){
			window.open('/html/options.html', '_blank');
		});
	}

	/**
	* 出社、退社、お知らせの表示
	*/
	function updateStatus(status) {
		if (status.code === KTR.STATUS.UNKNOWN)
			return;

		if (status.start)
			$('#action1').text('出社 ' + status.start)
			             .removeClass('enabled').unbind('click', startWork);
		else
			$('#action1').addClass('enabled').click(startWork);

		if (status.leave)
			$('#action2').text('退社 ' + status.leave)
			             .removeClass('enabled').unbind('click', leaveWork);
		else
			$('#action2').addClass('enabled').click(leaveWork);
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
		KTR.service.stamp(type, updateStatus);
	}

	/**
	 * 確認ダイアログを開く
	 */
	function confirmDialog(msg, callback) {
		var dialogId = 'modalDialog' + (dialogs.length + 1);
		var $diag = $('<div id="'+dialogId+'"/>').hide();
		var $m = $('<div/>').addClass('modal');
		var $d = $('<div/>').addClass('dialog')
		                    .append( $('<p/>').text(msg) )
		                    .append( $('<button/>').addClass('confirm').text('はい')  .click(closeDialog).click(callback) )
		                    .append( $('<button/>').addClass('confirm').text('いいえ').click(closeDialog) );
		$diag.append($m).append($d).appendTo($dcon);
		$diag.show(100, function(){
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
			$diag.hide(100, function(){
				$diag.empty().remove();
				if (recursive)
					closeDialog(true);
			});
		}
	}

	/**
	 * 勤之助を開く
	 */
	function openKTR(param) {
		var url = KTR.service.url;
		if (typeof param === 'object') {
			url += '?' + $.map(Object.keys(param), function(key){
				return encodeURIComponent(key) + '=' + encodeURIComponent(param[key]);
			}).join('&')
		}
		KTR.status.update(function(status){
			KTR.information.changeStatusToRead(status);
			window.open(url, '_blank');
		});
	}

	$(function(){
		$dcon = $('#modalDialogContainer');
		KTR.status.update(init);
	});
})(chrome.extension.getBackgroundPage());
