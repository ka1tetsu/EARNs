# JPYC ポイ活アプリ

動画広告を視聴してJPYCポイント（仮想通貨相当）を稼ぐモバイルウェブアプリです。

## 📖 ドキュメント

**重要なドキュメント:**

- 📋 [実装要件書](IMPLEMENTATION_REQUIREMENTS.md) - Web公開、自動送金、動画広告実装の全要件
- 🛠️ [バックエンド実装例](BACKEND_EXAMPLE.ts) - Node.js/Express のサンプルコード
- 📝 [スマートコントラクト](JPYC.sol) - Solidity 実装例
- 🤝 [貢献ガイド](CONTRIBUTING.md) - プロジェクト参加方法
- 📅 [実装完了レポート](IMPLEMENTATION_REPORT.md) - 既実装機能の詳細

## 機能

### 📺 広告視聴でポイント獲得
- 3本の動画広告を視聴すると1JPYC獲得
- リアルタイムで進捗を確認可能
- 広告視聴履歴を記録

### 💰 JPYC交換機能
- **10JPYC以上**で交換可能
- **10の倍数単位**での交換
- **MetaMask ウォレット接続**対応
- **自動送金**機能実装
- 交換内容の確認画面
- トランザクション履歴管理

### 📊 詳細な統計情報
- 累計獲得ポイント
- 総視聴本数
- 交換履歴の管理
- ウォレット接続状態

### 🛍️ マルチページ対応
- **ホーム**: ポイント残高と進捗確認
- **広告**: 広告視聴ページ
- **交換**: JPYCをウォレットに交換（ウォレット連携機能搭載）
- **履歴**: 全トランザクション履歴
- **プロフィール**: ユーザー情報と設定

### 🔗 Web3 連携
- MetaMask ウォレット接続
- Ethereum/Polygon ネットワーク対応
- ERC-20 トークン送金
- トランザクションハッシュ記録

## 技術スタック

- **フレームワーク**: React 19
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite
- **ルーティング**: React Router DOM v7
- **アイコン**: Lucide React

## セットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リント実行
npm lint
```

開発サーバーは [http://localhost:5173](http://localhost:5173) で起動します。

## プロジェクト構造

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── BannerAd.tsx    # バナー広告
│   ├── BottomNav.tsx   # ボトムナビゲーション
│   └── VideoAdModal.tsx # 動画広告モーダル
├── pages/              # ページコンポーネント
│   ├── HomePage.tsx
│   ├── AdsPage.tsx
│   ├── ShopPage.tsx    # 交換ページ
│   ├── HistoryPage.tsx
│   ├── ProfilePage.tsx
│   ├── TermsPage.tsx
│   └── PrivacyPage.tsx
├── store/              # 状態管理
│   └── useStore.ts     # Zustandなし、useStateベースの店舗ロジック
├── App.tsx             # メインアプリケーション
└── main.tsx
```

## 使い方

1. **広告を視聴**: ホームページまたは広告ページから「広告を見る」をタップ
2. **3本完了**: 3本の広告視聴で自動的に1JPYCが獲得されます
3. **交換**: 交換ページで10JPYC以上溜まったら交換ボタンをタップ
4. **確認**: ウォレットに反映されるまで数分お待ちください

## ホスティング

このプロジェクトはViteでビルドされたスタティックなウェブアプリです。以下にデプロイ可能です：

- **Vercel**: `npm run build` → Vercelにデプロイ
- **GitHub Pages**: `npm run build` → `dist` ディレクトリをデプロイ
- **Netlify**: GitHubと連携してデプロイ

### デプロイ手順（Vercel）

```bash
npm install -g vercel
vercel
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## 注意事項

- このアプリは仮想通貨相当のポイント管理です
- 実際の通貨取引ではありません
- 各種利用規約とプライバシーポリシーをご確認ください

## サポート

問題が発生した場合は、GitHubでissueを作成してください。

---

**開発**: 2026年3月
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
