# Vercel デプロイ前チェックリスト

## ✅ 実施項目

このチェックリストを完了してから、本番環境へのデプロイを行ってください。

---

## 1️⃣ ローカル開発環境

### ビルド・テスト

- [ ] `npm install` が完了している
- [ ] `npm run build` がエラーなく完了する
- [ ] `npm run lint` がエラーなく完了する
- [ ] `npm run dev` でローカルサーバーが起動可能
- [ ] ブラウザで http://localhost:5173 にアクセス可能

### コード品質

- [ ] TypeScript エラーが 0 個
- [ ] コンソールエラーが ない
- [ ] 未使用の import がない
- [ ] ESLint エラーが ない

---

## 2️⃣ Git リポジトリ

### コミット・プッシュ

- [ ] Git ローカルリポジトリが初期化済み
- [ ] すべてのファイルがコミット済み
- [ ] `.gitignore` に `node_modules`, `dist`, `.env` が含まれている
- [ ] GitHub にリモートリポジトリを作成
- [ ] `git push origin main` で GitHub にプッシュ完了

### コミットメッセージ

- [ ] コミットメッセージが明確で理解しやすい
- [ ] 重要な変更が記録されている

---

## 3️⃣ Vercel アカウント・プロジェクト

### アカウント設定

- [ ] Vercel アカウントを作成済み
- [ ] メールアドレスの確認が完了
- [ ] GitHub アカウントと連携済み（推奨）

### プロジェクトリンク

- [ ] `vercel link` で jpyc-poikatsu プロジェクトをリンク
- [ ] `.vercel/project.json` が生成されている
- [ ] `.vercel/project.json` が `.gitignore` に含まれている

### ビルド設定

- [ ] `vercel.json` でビルドコマンドが正しく設定されている
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist"
  }
  ```

---

## 4️⃣ 環境変数設定

### フロントエンド環境変数

- [ ] `VITE_BACKEND_URL` が設定済み
  - 開発: `http://localhost:3000`
  - 本番: `https://api.jpyc-poikatsu.com`
- [ ] `VITE_GA_ID` が設定済み（Google Analytics）
- [ ] `VITE_SENTRY_DSN` が設定済み（エラートラッキング）

### バックエンド環境変数（後で設定）

環境変数は以下のように設定される予定:
- [ ] `DATABASE_URL` - Vercel Postgres
- [ ] `JWT_SECRET` - セッション認証
- [ ] `RPC_URL` - Polygon ノード
- [ ] `TRANSFER_PRIVATE_KEY` - ウォレット秘密鍵

### 環境変数の登録方法

**方法 A: Vercel Web ダッシュボード**

1. https://vercel.com/dashboard にアクセス
2. プロジェクト「jpyc-poikatsu」を選択
3. **Settings** → **Environment Variables** タブ
4. 各変数を追加

**方法 B: CLI**

```bash
# ローカルで環境変数を設定
node setup-vercel-env.js

# または手動で
vercel env add VITE_BACKEND_URL
# → https://api.jpyc-poikatsu.com を入力
```

### 環境変数の確認

```bash
# 登録済みの環境変数を確認
vercel env list

# 本番環境の環境変数をローカルにプル
vercel env pull --production
cat .env.local
```

---

## 5️⃣ GitHub Actions 設定

### CI/CD パイプライン

- [ ] `.github/workflows/ci.yml` が正しく設定されている
- [ ] `main` ブランチへの push で自動テスト・ビルドが実行される
- [ ] ビルド成功時に Vercel へ自動デプロイされる

### Secrets 設定（GitHub Actions から Vercel へのデプロイ用）

GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions** で以下を追加:

```
VERCEL_TOKEN = (Vercel の API トークン)
VERCEL_ORG_ID = (Vercel の組織 ID)
VERCEL_PROJECT_ID = (Vercel のプロジェクト ID)
```

### トークン・ID の取得方法

```bash
# 1. Vercel API トークンを生成
# Vercel ダッシュボード → Settings → Tokens → Create Token
# スコープ: Full Access
# 有効期間: 90 日またはカスタム

# 2. 組織 ID を確認
vercel whoami
# または
cat .vercel/project.json
# → "orgId": "..."

# 3. プロジェクト ID を確認
cat .vercel/project.json
# → "projectId": "..."

# GitHub Secrets に登録
# GitHub UI から直接、または GitHub CLI:
# gh secret set VERCEL_TOKEN --body "..."
# gh secret set VERCEL_ORG_ID --body "..."
# gh secret set VERCEL_PROJECT_ID --body "..."
```

---

## 6️⃣ デプロイ前のファイル確認

### プロジェクトルートのファイル

- [ ] `package.json` - 依存関係が明記されている
- [ ] `tsconfig.json` - TypeScript 設定が正しい
- [ ] `vite.config.ts` - Vite ビルド設定が正しい
- [ ] `vercel.json` - Vercel ビルド設定が正しい
- [ ] `.gitignore` - 不要なファイルが除外されている
- [ ] `.env.example` - 環境変数テンプレートが完成
- [ ] `README.md` - プロジェクト説明が詳しい
- [ ] `LICENSE` - ライセンス情報

### ドキュメント

- [ ] `IMPLEMENTATION_REQUIREMENTS.md` - 実装要件が記載
- [ ] `IMPLEMENTATION_REPORT.md` - 実装完了レポートが記載
- [ ] `VERCEL_DEPLOYMENT.md` - デプロイガイドが記載
- [ ] `CONTRIBUTING.md` - 貢献ガイドが記載

### ソースコード

- [ ] `src/` ディレクトリに全ソースコードがある
- [ ] `src/utils/walletUtils.ts` - Web3 ユーティリティ
- [ ] `src/pages/ShopPage.tsx` - ウォレット連携ページ
- [ ] `src/store/useStore.ts` - 状態管理

---

## 7️⃣ セキュリティチェック

### コード内に秘密情報がないか確認

```bash
# Git で秘密情報をスキャン
git log -p | grep -i "password\|secret\|key\|token" | head -20

# または
git log --all --full-history -S "PRIVATE_KEY" --oneline

# コード内を直接確認
grep -r "0x[a-fA-F0-9]" src/ | grep -v node_modules
grep -r "process.env" src/ | grep -v node_modules
```

### 環境変数のセキュリティ

- [ ] `.env` がコミットされていない
- [ ] `.env.example` には例示値のみが含まれている
- [ ] `TRANSFER_PRIVATE_KEY` は環境変数で管理（コード内に含まない）
- [ ] `JWT_SECRET` は十分に複雑（32文字以上）

### ファイアウォール・SSL

- [ ] `vercel.json` で `buildCommand` が正しく設定
- [ ] SSL は自動で有効（Let's Encrypt）
- [ ] HTTPS リダイレクトが有効

---

## 8️⃣ デプロイテスト

### プレビューデプロイ

```bash
# Preview 環境へのデプロイ
vercel

# 表示される URL で動作確認
```

### 本番環境へのデプロイ

```bash
# 本番環境へのデプロイ
vercel --prod

# または GitHub push で自動デプロイ
git push origin main
```

### デプロイ後の確認

- [ ] Vercel ダッシュボードで Deployment が Success
- [ ] https://jpyc-poikatsu.vercel.app で アクセス可能
- [ ] ページが正しく表示される
- [ ] コンソールエラーがない
- [ ] ウォレット接続ボタンが表示される

---

## 9️⃣ カスタムドメイン設定（オプション）

### ドメイン取得

- [ ] ドメイン `jpyc-poikatsu.com` を取得
- [ ] ドメンプロバイダーの管理画面にアクセス可能

### Vercel でのドメイン設定

1. Vercel ダッシュボード → プロジェクト → **Settings** → **Domains**
2. ドメイン名を入力: `jpyc-poikatsu.com`
3. DNS レコード設定を確認
4. ドメインプロバイダーで DNS 設定を更新

### DNS 設定例（お名前.com の場合）

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

または

Type: A
Name: @
Value: 76.76.19.89
```

---

## 🔟 バックエンド準備（将来）

バックエンド API をセットアップする際に確認:

- [ ] Express サーバーの実装
- [ ] PostgreSQL データベース設定
- [ ] JWT 認証実装
- [ ] JPYC スマートコントラクト デプロイ
- [ ] Vercel Functions でのバックエンド実装
- [ ] API エンドポイントのテスト

---

## 最終確認

### デプロイ実行コマンド

```bash
# 1. 必要に応じて変数を設定
vercel env pull --production

# 2. Preview デプロイでテスト
vercel

# 3. 本番環境へデプロイ
vercel --prod

# または自動デプロイ
git push origin main
# → GitHub Actions で自動的にデプロイ
```

### デプロイ成功の確認

```bash
# ビルドログを確認
vercel logs jpyc-poikatsu --follow

# または Vercel ダッシュボード → Deployments → 最新のビルド をクリック
```

---

## ✨ デプロイ完了後

完了した場合、以下を実施:

1. ✅ 本番 URL でアプリにアクセス
2. ✅ MetaMask ウォレット接続をテスト
3. ✅ ポイント獲得・交換機能をテスト
4. ✅ Google Analytics で アクセスを確認
5. ✅ GitHub Releases で バージョンを公開

---

## 🆘 トラブルシューティング

### デプロイが失敗する

```bash
# ローカルでビルドをテスト
npm run build

# エラーメッセージを確認
npm run lint

# Vercel の build logs を確認
vercel logs jpyc-poikatsu --follow
```

### 環境変数が反映されない

```bash
# 環境変数をプル
vercel env pull --production

# デプロイを再実行
vercel --prod --force
```

### Vercel にログインできない

```bash
# ログアウト・再ログイン
vercel logout
vercel login
```

---

**チェックリスト完了後、デプロイを進めてください！** 🚀
