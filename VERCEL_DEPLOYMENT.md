# Vercel デプロイメント ガイド

Vercelでの自動デプロイ環境セットアップ手順です。

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Vercel アカウント（無料で作成可能）
- GitHub アカウント（リポジトリホスティング用）

## 🚀 Step 1: Vercel アカウント作成（初回のみ）

```bash
# Vercel にログイン（ブラウザが開きます）
vercel login

# メールアドレスを入力して確認メールを確認
# または GitHub/GitLab でログイン
```

## 🔗 Step 2: GitHub リポジトリにプッシュ

```bash
# GitHub で新しいリポジトリを作成してください
# 例: https://github.com/yourusername/jpyc-poikatsu

# ローカルからプッシュ
git remote add origin https://github.com/yourusername/jpyc-poikatsu.git
git branch -M main
git push -u origin main
```

## 📦 Step 3: Vercel プロジェクトの初期化

```bash
# プロジェクトディレクトリで実行
cd /path/to/jpyc-poikatsu

# Vercel にプロジェクトをリンク
vercel link

# 以下の質問に答えます:
# "Set up and deploy "JPYC"? [Y/n]" → Y
# "Which scope do you want to deploy to?" → 自分のユーザー名 (または Organization)
# "Link to existing project? [y/N]" → N (初回は新規作成)
# "What's your project's name?" → jpyc-poikatsu
# "In which directory is your code located?" → . (現在のディレクトリ)
```

これでプロジェクトが `.vercel/project.json` に登録されます。

## 🌍 Step 4: 環境変数の登録

### 方法 A: Vercel Web ダッシュボードで登録（推奨）

1. https://vercel.com/dashboard にアクセス
2. プロジェクト「jpyc-poikatsu」を選択
3. **Settings** → **Environment Variables** タブを開く
4. 以下の変数を追加:

```
VITE_BACKEND_URL = https://api.jpyc-poikatsu.com
VITE_GA_ID = G-XXXXXXXXXX (Google Analytics ID)
VITE_SENTRY_DSN = https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx (オプション)
```

### 方法 B: CLI で登録

```bash
vercel env add VITE_BACKEND_URL
# プロンプトで値を入力: https://api.jpyc-poikatsu.com

vercel env add VITE_GA_ID
# プロンプトで値を入力: G-XXXXXXXXXX

# 本番環境に昇格
vercel env pull --production
```

## 🔐 Step 5: GitHub との連携設定

1. Vercel ダッシュボードから jpyc-poikatsu プロジェクトを選択
2. **Settings** → **Git Integration** を確認
3. GitHub は自動で接続されているはず（Vercel アカウントの設定による）

**自動デプロイ設定:**
- `main` ブランチへの push → 本番環境 (`vercel --prod`) へ自動デプロイ
- pull request → Preview URL が自動生成

## 📝 Step 6: デプロイテスト

```bash
# ローカルで試験デプロイ（Preview）
vercel

# 本番環境へのデプロイ
vercel --prod
```

デプロイ完了後、ターミナルに表示される URL で確認できます。

## 🔑 Step 7: カスタムドメイン設定（オプション）

1. Vercel ダッシュボード → プロジェクト → **Settings** → **Domains**
2. ドメイン名を入力: `jpyc-poikatsu.com`
3. DNS レコード設定を案内されるので、ドメインプロバイダーで設定
4. 数分～数時間で反映

**推奨ドメインプロバイダー:**
- [お名前.com](https://www.onamae.com/)
- [Namecheap](https://www.namecheap.com/)
- [Google Domains](https://domains.google/)

## 🔄 Step 8: 自動デプロイの確認

```bash
# ローカルで変更を加える
echo "// Updated" >> src/App.tsx

# コミット・プッシュ
git add .
git commit -m "Test update for auto deployment"
git push origin main
```

**Vercel ダッシュボードを確認:**
- 自動的にビルドが開始
- ビルド完了後、URL が更新される
- Preview URL も生成される

## 📊 ビルドログ確認

Vercel ダッシュボード → プロジェクト → **Deployments** で以下が確認できます:

- ✅ **Status**: Success / Failed
- 📝 **Build Logs**: コンソール出力
- ⏱️ **Build Time**: ビルド時間
- 📦 **Size**: 本番バンドルサイズ

## 🛠️ トラブルシューティング

### ビルド失敗時

```bash
# ローカルでビルドをテスト
npm run build

# エラーメッセージを確認
npm run lint
```

### 環境変数が反映されない

```bash
# 環境変数を再度プル
vercel env pull

# デプロイを再実行
vercel --prod --force
```

### Vercel でログイン状態がない

```bash
# 再度ログイン
vercel logout
vercel login
```

## 📈 監視・最適化

### Vercel Analytics（無料）

1. ダッシュボード → **Analytics** タブ
2. ページビュー、Core Web Vitals を確認

### Lighthouse スコア確認

```bash
# ローカルで Lighthouse を実行
npm run build
npm run preview
# ブラウザの DevTools → Lighthouse で測定
```

## 🔐 セキュリティ設定

### SSL 証明書

- 自動で Let's Encrypt から取得
- 90日ごとに自動更新
- Vercel が管理

### データベース連携

バックエンド実装時、Vercel Postgres を使用:

```bash
# Vercel ダッシュボード → Storage → Create Database
# PostgreSQL を選択して作成

# 環境変数 DATABASE_URL が自動設定される
vercel env pull --production
```

## 📋 チェックリスト

デプロイ前に確認:

- [ ] GitHub リポジトリに全ファイルがコミットされている
- [ ] Vercel アカウントがある
- [ ] GitHub リポジトリが公開または Vercel にアクセス権限がある
- [ ] npm ビルドがローカルで成功している
- [ ] `.gitignore` に `.env`, `node_modules`, `dist` が含まれている
- [ ] `vercel.json` に正しいビルドコマンドが設定されている
- [ ] 環境変数が Vercel で設定されている

## 📞 サポート

- [Vercel ドキュメント](https://vercel.com/docs)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Vercel CLI リファレンス](https://vercel.com/docs/cli/reference)

---

**次のステップ:** バックエンド API をセットアップしたら、[IMPLEMENTATION_REQUIREMENTS.md](IMPLEMENTATION_REQUIREMENTS.md) の「バックエンド実装」セクションを参照してください。
