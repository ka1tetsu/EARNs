# 貢献ガイド

このプロジェクトへの貢献をありがとうございます！以下のガイドラインに従ってください。

## バグ報告

バグを見つけた場合は、[GitHub Issues](https://github.com/yourusername/jpyc-poikatsu/issues) で報告してください。

**報告時に含めてください:**
- バグの説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、ブラウザなど）

## 機能提案

新しい機能を提案する場合は、[GitHub Issues](https://github.com/yourusername/jpyc-poikatsu/issues) で「Feature Request」として報告してください。

## プルリクエスト

### セットアップ

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

### コーディング規約

- TypeScript を使用してください
- `npm run lint` でコード品質をチェック
- 機能ごとにコンポーネントを分割
- わかりやすい変数名とコメントを使用

### テスト

- 新しい機能にはテストを追加してください
- 既存のテストが失敗しないことを確認してください

```bash
npm run build
npm run lint
```

## コミットメッセージのガイドライン

- 日本語で簡潔に記述
- 動作や機能の変更内容を明確に
- 例: `広告完了時のポイント付与ロジックを修正`

## ライセンス

このプロジェクトに貢献することで、あなたの貢献はMITライセンスの下でライセンスされることに同意します。
