// ウィンドウが生成されたらステータスを更新する
chrome.windows.onCreated.addListener(KTR.status.update);

// ステータスを更新する
KTR.status.update();

