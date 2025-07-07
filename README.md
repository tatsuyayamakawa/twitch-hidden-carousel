# Twitch Hidden Carousel

Twitch のトップページのカルーセルをワンクリックで非表示/表示切り替えできる Chrome 拡張機能です。

## 🚀 新機能（v2.0.0）

- **リロード不要**: ページをリロードせずに即座に反映
- **BGM 停止**: カルーセル内の音声・動画を完全停止
- **ワンクリック切り替え**: 拡張機能アイコンから簡単操作
- **状態保持**: ブラウザ再起動後も設定を記憶
- **リアルタイム監視**: 動的に追加されるカルーセルも自動で処理

## 📦 インストール

### 開発版（推奨）

1. このリポジトリをクローンまたはダウンロード
2. Chrome 拡張機能管理ページ（`chrome://extensions/`）を開く
3. 右上の「開発者モード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードしたフォルダを選択

### Chrome Web Store

https://chromewebstore.google.com/detail/twitch-hide-carousel/fjkloidbkbkoojfananpkkgoankilkko

## 🎯 使用方法

1. [Twitch](https://www.twitch.tv/)を開く
2. 拡張機能のアイコンをクリック
3. 「カルーセルを非表示」ボタンをクリック
4. カルーセルが瞬時に非表示になります
5. 再度ボタンをクリックで表示に戻ります

## ✨ 機能

- **カルーセル非表示**: トップページの大きなカルーセルを非表示
- **音声停止**: カルーセル内の BGM や動画音声を完全停止
- **設定保持**: ブラウザを閉じても設定を記憶
- **高速動作**: MutationObserver による効率的な DOM 監視
- **エラーハンドリング**: 問題発生時の適切な対応

## 🔧 技術仕様

- **Manifest Version**: 3
- **対応ページ**: `https://www.twitch.tv/*`
- **権限**: `storage`, `activeTab`
- **主要 API**: MutationObserver, Chrome Storage API

## 🛠️ 開発

### ファイル構成

```
twitch-hidden-carousel/
├── manifest.json          # 拡張機能の設定
├── content.js             # メインロジック
├── popup.html             # ポップアップUI
├── popup.js               # ポップアップの動作
├── icons/                 # アイコンファイル
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### デバッグ方法

1. F12 でデベロッパーツールを開く
2. Console タブでログを確認
3. 拡張機能管理ページでエラーを確認

## 📝 変更履歴

### v2.0.0 (2024-07-07)

- リロード不要の実装
- BGM 停止機能の追加
- ワンクリック切り替え機能
- UI の大幅改善
- エラーハンドリングの強化

### v1.0.0

- 基本的なカルーセル非表示機能

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## ⚠️ 注意事項

- この拡張機能は Twitch 公式ではありません
- Twitch の仕様変更により動作しなくなる可能性があります
- 問題が発生した場合は [Issues](https://github.com/tatsuyayamakawa/twitch-hidden-carousel/issues) で報告してください

## 📞 サポート

- GitHub Issues: [報告・要望](https://github.com/tatsuyayamakawa/twitch-hidden-carousel/issues)
- 作者: [@tatsuyayamakawa](https://github.com/tatsuyayamakawa)
