# Kinnosuke Time Recorder

万屋一家シリーズ web版勤怠管理システム「勤之助 ver.2」のタイムレコーダーを押すためのChrome拡張です。
勤之助はログインセッションのTTLがすごく短いのですが、この拡張を使うといちいちログインする必要なく、勤怠ボタンを押したり、勤之助を開いたりできます。

## インストール

Chrome ウェブストアから「[勤之助タイムレコーダー](https://chrome.google.com/webstore/detail/%E5%8B%A4%E4%B9%8B%E5%8A%A9%E3%82%BF%E3%82%A4%E3%83%A0%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%80%E3%83%BC/onohbjcjcdlmfheogadpfopadlmpicmk)」をインストールしてください。


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

## 開発について

```
git clone git@github.com:irok/KinnosukeTimeRecorder.git
npm install
```

chrome://extensions/ の「デベロッパーモード」をチェックして「パッケージ化されていない拡張機能を読み込む」を押し、KinnosukeTimeRecorder ディレクトリを選択してください。

## 更新履歴

- v2.1.5 (2017-02-09)
    - aes.js がパッケージに含まれていなかったのを修正
    - ついでにモジュールをアップデート
    - サードパーティライブラリの管理を bower から npm に変更
    - lintツールを jshint から eslint に変更

- v2.1.4 (2017-02-08)
    - Chromeがマテリアルデザインになってバッジの色が見にくくなったのを修正

- v2.1.3 (2014-10-16)
    - Chromeの仕様変更(?)に合わせCSSを修正した

- v2.1.2 (2014-08-18)
    - setTimeoutの利用を廃止した（プロセスが残る問題への対応）

- v2.1.1 (2014-08-01)
    - プラグインを再起動してもステータスが反映されるようにした

- v2.1.0 (2014-07-31)
    - Background PagesからEvent Pagesに変更した
        - ただし、Ajaxで勤之助へのログインを行うとプロセスが残ってしまう（原因特定できず）
    - 勤之助のページを開いて勤怠ボタンを押したのが反映されるよう修正した
    - gulpでビルドするようにした
    - jsライブラリをbowerで管理するようにし、リポジトリから外した

- v2.0.2 (2014-06-18)
    - 「打刻忘れ／訂正」申請がカスタムメニューである可能性があったので「各種申請」に変更

- v2.0.1 (2014-04-28)
    - 勤之助側で問題が生じていると勤之助を開けない問題を修正

- v2.0.0 (2014-04-10)
    - コードを整理して見通しをよくした
    - 未読のお知らせが分かるようにした

