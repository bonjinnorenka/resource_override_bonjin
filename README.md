# URL Rewrite

正規表現を使ってURLをリダイレクト/書き換えできるブラウザ拡張機能です。  
DevToolsのパネルから操作でき、Chrome・Firefox両対応しています。

## 機能

- 🔀 **正規表現によるURLリダイレクト** - 正規表現パターンでURLをマッチし、別のURLに書き換え
- ✅ **ルールごとの有効/無効切り替え** - 個別のルールをワンクリックで切り替え
- 🌐 **グローバルON/OFF** - 拡張機能全体の有効/無効を一括切り替え
- 🛠️ **DevToolsパネル** - 開発者ツールのタブとして統合されたUI

## インストール

### Chrome

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このディレクトリを選択

### Firefox

1. `about:debugging#/runtime/this-firefox` を開く
2. 「一時的なアドオンを読み込む」をクリック
3. このディレクトリの `manifest.json` を選択

## 使い方

1. ブラウザのDevTools（F12）を開く
2. 「URL Rewrite」タブを選択
3. パターンと置換先URLを入力してルールを追加
4. 各ルールの有効/無効を個別に切り替え可能

### ルールの例

| パターン | 置換先 | 説明 |
|---------|--------|------|
| `^https://example\.com/(.*)` | `https://dev.example.com/\1` | 本番URLを開発環境にリダイレクト |
| `^https://cdn\.example\.com/js/(.*)` | `http://localhost:3000/\1` | CDNのJSをローカルサーバーに切り替え |

## ファイル構成

```
├── manifest.json      # 拡張機能の設定ファイル
├── background.js      # バックグラウンドService Worker
├── devtools.html      # DevToolsページ
├── devtools.js        # DevToolsパネル作成
├── panel.html         # パネルUI
├── panel.js           # パネルのロジック
├── panel.css          # パネルのスタイル
└── icons/             # アイコン画像
```

## 技術詳細

- **Manifest V3** 対応
- **declarativeNetRequest API** を使用したURL書き換え
- **storage API** でルールを永続化
- Chrome/Firefox両対応（browserAPI互換レイヤー使用）

## ライセンス

MIT
