# Kinnosuke Time Recorder

Web版勤怠管理システム「[勤之助](https://www.4628.jp/)」のタイムレコーダーを押すためのChrome Extensionです。
勤之助はログインセッションのTTLがすごく短いのですが、このExtensionを使うといちいちログインする必要なく、勤怠ボタンを押したり、勤之助を開いたりできます。

## インストール

1. [KinnosukeTimeRecorder.crx](https://github.com/irok/KinnosukeTimeRecorder/raw/master/KinnosukeTimeRecorder.crx) をダウンロードします。（警告が出たり出なかったりします。）
2. Chromeの拡張機能ページ（chrome://extensions）を開き、先ほどのファイルをドラッグ&ドロップします。
3. インストールが完了するとツールバーに ![勤](https://github.com/irok/KinnosukeTimeRecorder/raw/master/images/icon19.png) アイコンが表示されます。（クリックするとメニューが開きます。）

## 使い方

- まずはメニューから「オプション」を開き、勤之助のログイン情報を入力します。
- 出社、退社したらメニューの「出社」や「退社」をクリックしてください。
- ![勤之助](https://github.com/irok/KinnosukeTimeRecorder/raw/master/images/icon19.png) のところに表示される小さな ■ は現在の状態を表しています。
  - 黄：未出社
  - 緑：出社
  - 青：退社

## 安全性について

- ログイン情報はlocalStorageに保存します。どこかのサーバーに送信したりはしません。（勤之助には送信します。）
- パスワードは暗号化した状態で保存しますが、暗号キーもlocalStorageに保存するので、マスターキーなしでブラウザにパスワード保存しているのと大して変わりません。（デベロッパーツールでうっかりlocalStorageを開いても生のパスワードは見られずにすむ、程度の効果です。）

