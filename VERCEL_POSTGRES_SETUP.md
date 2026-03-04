# Vercel Postgres セットアップ ガイド

バックエンド用の PostgreSQL データベースを Vercel で設定する手順です。

## 📋 前提条件

- Vercel アカウント（プロ プランまたはホビー プラン）
- jpyc-poikatsu プロジェクトが Vercel にリンク済み

## 🚀 Step 1: Vercel Storage でPostgres を作成

### Web ダッシュボードで作成

1. https://vercel.com/dashboard にアクセス
2. **Storage** タブをクリック
3. **Create Database** ボタンをクリック
4. **Postgres** を選択
5. 以下の情報を入力:
   - **Database Name**: `jpyc-poikatsu-db`
   - **Region**: `Tokyo` (日本の場合) または最も近いリージョン
   - **Project**: `jpyc-poikatsu` を選択

6. **Create** をクリック

### CLI で作成（オプション）

```bash
# まずダッシュボードで手動作成することを推奨
# CLI からは以下で確認可能:

vercel env pull --production
# DATABASE_URL が自動的に設定されます
```

## 🔑 Step 2: 接続情報の確認

Vercel ダッシュボード → **Storage** → **jpyc-poikatsu-db** を開く

以下の情報が表示されます:

```
Connection String (本番用):
postgresql://user:password@host/dbname?sslmode=require

Host: db-xxxx.us-east-1.postgres.vercel-storage.com
Database: jpyc_poikatsu
Username: default
Password: (パスワード)
Port: 5432
```

## 🔐 Step 3: 環境変数の確認

```bash
# ローカルで環境変数を確認
vercel env pull --production
cat .env.local

# DATABASE_URL が表示されていることを確認
```

## 📝 Step 4: スキーマ初期化（Node.js + Prisma の例）

### Prisma ORM をインストール（推奨）

```bash
npm install @prisma/client
npm install -D prisma
```

### Prisma スキーマを作成

`prisma/schema.prisma` を作成:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  wallet    String  @unique
  balance   Int     @default(0)
  created   DateTime @default(now())
  updated   DateTime @updatedAt
}

model Transaction {
  id        Int     @id @default(autoincrement())
  userId    Int
  type      String  // 'earn' | 'exchange'
  amount    Int
  txHash    String?
  created   DateTime @default(now())
}
```

### マイグレーション実行

```bash
# ローカルで設計・テスト
npx prisma migrate dev --name init

# 本番環境のデータベースにマイグレーション
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## 🗄️ Step 5: データベース管理ツール

### Vercel Data Studio（無料）

Vercel ダッシュボード → **Storage** → **jpyc-poikatsu-db** → **Data Studio** タブ

- SQL クエリ実行
- テーブル閲覧・編集
- インデックス管理

### pgAdmin（ローカル）

```bash
# Docker で pgAdmin を起動
docker run -d \
  -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=password \
  dpage/pgadmin4

# http://localhost:5050 にアクセス
# Host: db-xxxx.us-east-1.postgres.vercel-storage.com
# Port: 5432
# User: default
# Password: (確認)
```

## 💾 Step 6: バックアップ・復旧

### 自動バックアップ

Vercel Postgres は自動的に以下の頻度でバックアップされます:

- **ホビー プラン**: 7日ごと
- **プロ プラン**: 毎日

### 手動バックアップ（pg_dump）

```bash
# PostgreSQL クライアントがインストール済みか確認
pg_dump --version

# バックアップ作成
pg_dump \
  --no-password \
  --username=default \
  --host=db-xxxx.us-east-1.postgres.vercel-storage.com \
  --port=5432 \
  jpyc_poikatsu > backup.sql

# 復旧
psql \
  --username=default \
  --host=db-xxxx.us-east-1.postgres.vercel-storage.com \
  --port=5432 \
  jpyc_poikatsu < backup.sql
```

## 🔒 セキュリティ設定

### SSL/TLS 接続（自動有効）

Vercel Postgres は SSL で保護されているため、接続文字列に `?sslmode=require` が含まれています。

### IP ホワイトリスト（計画中）

現在 Vercel Postgres は IP ホワイトリストをサポートしていませんが、リクエストされています。
代わりに、本番環境では以下の対策を:

- 環境変数で秘密鍵・パスワードを管理
- 接続ユーザーは最小権限の原則に従う
- ファイアウォール設定（バックエンドサーバー側）

## 📊 パフォーマンス最適化

### インデックス追加（Prisma の例）

```prisma
model Transaction {
  // ...
  @@index([userId])
  @@index([created])
}
```

### クエリ最適化

```typescript
// ❌ N+1 クエリ問題
const users = await prisma.user.findMany();
for (const user of users) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id }
  });
}

// ✅ JOIN で最適化
const users = await prisma.user.findMany({
  include: { transactions: true }
});
```

## 🚨 トラブルシューティング

### 接続エラー

```
Error: connect ECONNREFUSED
```

解決方法:

```bash
# 接続文字列を確認
echo $DATABASE_URL

# ホスト・ポート・認証情報を確認
# SSL mode が有効か確認

# ローカルで接続テスト
psql $DATABASE_URL
```

### タイムアウトエラー

```bash
# コネクションプールを設定（Prisma の例）
# .env.local に追加:
DATABASE_URL="postgresql://...?connection_limit=5"
```

### パスワード認証失敗

```bash
# ダッシュボードで パスワード をリセット
# Vercel ダッシュボード → Storage → jpyc-poikatsu-db → Edit → Reset Password
```

## 📋 チェックリスト

デプロイ前に確認:

- [ ] Vercel Postgres データベースが作成されている
- [ ] `DATABASE_URL` 環境変数が Vercel で設定されている
- [ ] ローカルで `vercel env pull --production` を実行済み
- [ ] マイグレーション（Prisma など）がローカルで成功
- [ ] 本番環境でマイグレーションスクリプトを実行予定
- [ ] バックアップ方法を確認済み
- [ ] 接続ユーザーの権限を最小化設定

## 📞 サポート

- [Vercel Storage ドキュメント](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma ドキュメント](https://www.prisma.io/docs/)
- [PostgreSQL ドキュメント](https://www.postgresql.org/docs/)

---

**次のステップ:** [IMPLEMENTATION_REQUIREMENTS.md](IMPLEMENTATION_REQUIREMENTS.md) でバックエンド API 実装を開始してください。
