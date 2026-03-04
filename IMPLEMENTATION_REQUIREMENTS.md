# JPYC ポイ活アプリ - 実装要件ドキュメント

Web公開、自動送金機能、動画広告実装に必要な技術要件を全て記載しています。

---

## 📋 目次

1. [Web公開](#web公開)
2. [自動送金機能](#自動送金機能)
3. [動画広告実装](#動画広告実装)
4. [セキュリティ要件](#セキュリティ要件)
5. [バックエンド実装](#バックエンド実装)

---

## Web公開

### 1. ドメイン・ホスティング

#### 必要な要件

```markdown
- **ドメイン取得**
  - 例: jpyc-poikatsu.com
  - 登録期間: 1年～複数年
  - 費用目安: ¥1,000～2,000/年

- **ホスティング選択肢**
  - Vercel (推奨)
    - React/Viteプロジェクト最適化
    - 無料プラン: ✓ 対応
    - 自動デプロイ: ✓ GitHub連携
    - CDN: ✓ グローバル
    - SSL: ✓ 無料

  - Netlify
    - 無料プラン利用可能
    - 自動デプロイ: ✓ GitHub連携
    - 関数機能: ✓ Lambda
    
  - AWS Amplify
    - エンタープライズ向け
    - 高度なカスタマイズ可能
    
  - Google Cloud / Azure
    - 大規模運用向け
```

#### デプロイ手順 (Vercel)

```bash
# Vercel CLIのインストール
npm install -g vercel

# Vercelへのデプロイ
vercel

# 環境変数の設定
vercel env add VITE_BACKEND_URL
```

#### Vite環境変数設定

`.env.production` を作成:

```env
VITE_BACKEND_URL=https://api.jpyc-poikatsu.com
```

### 2. SSL証明書

```markdown
- **自動取得**: Vercel/Netlify が自動提供
- **Let's Encrypt**: 無料SSL取得可能
- **更新**: 自動更新（90日ごと）
```

### 3. CDN・パフォーマンス最適化

```markdown
- **キャッシング戦略**
  - HTML: キャッシュなし（no-cache）
  - JS/CSS: 1年キャッシュ（ハッシュ付き）
  - 画像: 1年キャッシュ（静的アセット）

- **圧縮**
  - Gzip: デフォルト有効
  - Brotli: Vercelで自動適用
  
- **パフォーマンス目標**
  - Lighthouse Score: 90以上
  - FCP: 1.5秒以下
  - LCP: 2.5秒以下
```

---

## 自動送金機能

### 1. ウォレット連携

#### MetaMaskインテグレーション

```markdown
✅ **現在の実装状況**
- MetaMask接続機能: 実装済み
- ウォレットアドレス取得: 実装済み
- チェーン確認: 実装済み

❌ **追加実装が必要**
- Wallet Connect統合（複数ウォレット対応）
- Argent, Safe, その他ウォレット対応
```

#### 必要なライブラリ

```bash
# 基本パッケージ
npm install ethers.js  # v6以上推奨

# OR

npm install web3.js    # v1以上

# マルチウォレット対応
npm install @rainbow-me/rainbowkit wagmi viem

# ABI型定義
npm install @openzeppelin/contracts
```

### 2. スマートコントラクト実装

#### 必要な実装

```solidity
// JPYC ERC-20トークンコントラクト例
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JPYC is ERC20, Ownable {
    constructor() ERC20("JPYC Token", "JPYC") {}

    // バックエンドからの自動送金用
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    // マスター関数: admin が自動送金を実行
    function transferByAdmin(
        address recipient,
        uint256 amount
    ) public onlyOwner {
        _transfer(owner(), recipient, amount);
    }
}
```

#### デプロイが必要なネットワーク

```markdown
- **Ethereum Mainnet**
  - ガス代: 高い（$10-100+）
  - 処理時間: 15秒～数分
  
- **Polygon (MATIC)**
  - ガス代: 低い（$0.01-0.10）
  - 処理時間: 2秒～
  - **推奨**: コスト効率的
  
- **Arbitrum / Optimism**
  - Layer2ソリューション
  - ガス代: 低い
  - Ethereumの同等セキュリティ
```

### 3. バックエンド送金実装

#### Node.js + Ethers.js 例

```typescript
import { Wallet, JsonRpcProvider, Contract } from 'ethers';

// 環境変数
const PRIVATE_KEY = process.env.TRANSFER_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!;
const CONTRACT_ADDRESS = process.env.JPYC_CONTRACT_ADDRESS!;

// プロバイダー初期化
const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

// コントラクト ABI
const JPYC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const contract = new Contract(CONTRACT_ADDRESS, JPYC_ABI, wallet);

// 送金関数
export async function transferJPYC(
  toAddress: string,
  amount: string
): Promise<{ txHash: string; success: boolean }> {
  try {
    // ガス推定
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amount);
    
    // トランザクション実行
    const tx = await contract.transfer(toAddress, amount, {
      gasLimit: gasEstimate.mul(120).div(100), // 20%余裕
    });

    // トランザクション確認
    const receipt = await tx.wait(1); // 1ブロック確認待機

    return {
      txHash: receipt.hash,
      success: receipt.status === 1,
    };
  } catch (error) {
    console.error('Transfer error:', error);
    throw error;
  }
}
```

### 4. Webhook・通知システム

```markdown
- **トランザクション確認**
  - Etherscan API で確認
  - Web3 Event Listener で監視
  - The Graph (Subgraph) で追跡

- **ユーザー通知**
  - メール通知
  - プッシュ通知（PWA）
  - アプリ内通知
```

---

## 動画広告実装

### 1. 広告ネットワーク選択

#### Google AdMob

```markdown
**特徴**
- 最大の広告ネットワーク
- RPM (Revenue Per Mille): 高い
- ポイ活アプリに適している

**料金体系**
- CPC (Cost Per Click): $0.1～5+
- CPM (Cost Per Mille): $5～50+

**実装方法**
1. Google AdMob アカウント作成
2. アプリID申請
3. Reactコンポーネント統合
```

#### 実装例

```bash
npm install react-google-ads
```

```typescript
import GoogleAds from 'react-google-ads';

export function VideoAdModal() {
  return (
    <GoogleAds
      client="ca-pub-xxxxxxxxxxxxxxxx"
      slot="1234567890"
      format="video"
      responsive={true}
    />
  );
}
```

#### Facebook Audience Network

```markdown
- Meta傘下の広告ネットワーク
- Instagramユーザー層がメイン
- RPM: 中～高
```

#### Unity Ads

```markdown
- ゲーミング向け
- ゲーム系広告が豊富
```

### 2. 広告チェーンシステム

```markdown
**複数広告ネットワークの統合**

実装手順:
1. Google AdMob を一次
2. Facebook Audience を二次
3. Unity Ads を三次

メリット:
- 広告表示率向上（99%以上）
- CPMの最適化
- リカバリー広告の提供
```

### 3. 実装手順

#### App.tsx への統合

```typescript
import { useCallback, useState } from 'react';
import { GoogleAd } from './components/GoogleAd';

export default function App() {
  const [showAd, setShowAd] = useState(false);

  const handleWatchAd = useCallback(() => {
    setShowAd(true);
  }, []);

  const handleAdComplete = useCallback(() => {
    // ポイント付与
    onWatchAd();
    setShowAd(false);
  }, []);

  return (
    <>
      {showAd && (
        <GoogleAd
          onComplete={handleAdComplete}
          onClose={() => setShowAd(false)}
        />
      )}
    </>
  );
}
```

### 4. 広告表示ルール

```markdown
**ユーザー体験向上のため**

✅ 推奨
- 広告表示前に確認ダイアログ
- 広告スキップ不可（少なくとも3秒）
- 広告完了時のリワード確認

❌ 非推奨
- スパム的な過度な表示
- 広告を強制的に表示し続ける
- リワード表示の遅延
```

### 5. 収益最適化

```markdown
**RPM最大化のコツ**

1. **ターゲティング**
   - ユーザーの国・地域を把握
   - 時間帯別の最適化
   
2. **インプレッション最適化**
   - 広告表示タイミング最適化
   - ユーザーセグメント分析
   
3. **A/Bテスト**
   - 異なる広告フォーマット比較
   - リワード額の最適化

**想定RPM（1000表示あたりの収益）**
- 日本: $10～30
- 米国: $20～80
- インド: $2～5
```

---

## セキュリティ要件

### 1. バックエンド認証

```markdown
**実装必須**

1. JWT (JSON Web Token)
   - ユーザー認証トークン
   - 署名検証
   - 有効期限設定（例: 1時間）

2. API キー
   - フロントエンド→バックエンド通信
   - 環境変数で管理
   - 定期的なローテーション

3. CORS設定
   - Origin ホワイトリスト設定
   - フロントエンドドメイン指定
```

### 2. ウォレット・秘密鍵管理

```markdown
**重要: 秘密鍵は決してコードに含めない！**

✅ 正しい方法
- 環境変数で管理
- CI/CDの Secrets で管理
- HSM（Hardware Security Module）で保管

❌ 危険
- コード内にハードコード
- GitHubにプッシュ
- 平文でログ出力
```

### 3. ガス代管理

```markdown
**スマートコントラクト実行のガス代**

戦略:
1. Relayer パターン
   - 信頼できるバックエンドがガス代を負担
   - ユーザーの秘密鍵不要
   
2. Meta Transaction
   - ユーザーが署名のみ
   - バックエンドが実行
   - EIP-2771 準拠
```

### 4. DDoS対策

```markdown
- Rate Limiting
  - API エンドポイント: 100 req/min/IP
  - 認証後: 1000 req/min/ユーザー

- WAF (Web Application Firewall)
  - Cloudflare, AWS WAF など
  
- 負荷分散
  - 複数ノードの配置
```

---

## バックエンド実装

### 1. 推奨スタック

```markdown
**言語・フレームワーク**

Node.js + Express / Fastify:
- TypeScript対応
- Ethers.js 統合容易
- 中小企模に最適

Python + FastAPI / Django:
- Web3.py 豊富
- データ分析に強い
- 大規模向け

Rust + Actix-web:
- 最高パフォーマンス
- セキュリティ重視
```

### 2. データベース

```markdown
**主データストア**
- PostgreSQL (推奨)
  - トランザクション対応
  - ACID準拠
  
**キャッシュレイヤー**
- Redis
  - セッション管理
  - レート制限

**ブロックチェーンデータ**
- The Graph (インデックス)
  - GraphQL API
  - クエリ効率的
```

### 3. 必須API エンドポイント

```typescript
// ユーザー認証
POST /api/auth/login
POST /api/auth/register
POST /api/auth/verify-wallet

// ポイント管理
GET /api/user/points
GET /api/user/transactions
POST /api/points/earn
POST /api/points/exchange

// ウォレット連携
POST /api/transfer-jpyc
GET /api/transfer-status/:txHash
GET /api/wallet-balance/:address

// 広告管理
GET /api/ads
POST /api/ads/complete
GET /api/ads/stats
```

### 4. 監視・ログ

```markdown
**重要な監視項目**

1. トランザクション監視
   - 失敗したTx の追跡
   - ガス代異常検知
   
2. ユーザー活動監視
   - 異常なポイント獲得
   - 不正なAPI呼び出し
   
3. インフラ監視
   - アップタイム > 99.9%
   - レスポンスタイム < 500ms

**ツール推奨**
- Sentry: エラー追跡
- DataDog: インフラ監視
- Grafana: ダッシュボード
```

### 5. デプロイ・CI/CD

```markdown
**GitHub Actions でのCI/CD**

1. テスト実行
2. ビルド
3. Staging へデプロイ
4. E2E テスト
5. 本番環境デプロイ

**本番環境**
- Docker コンテナ化
- Kubernetes オーケストレーション
- Blue-Green デプロイメント
```

---

## タイムライン・フェーズ計画

### Phase 1: MVP（1-2週間）

```markdown
✅ 完了
- フロントエンド基本実装
- MetaMask 連携
- ウォレット UI 実装

🚀 次: バックエンド構築
- Express サーバー立ち上げ
- JWT 認証実装
- 簡易送金機能
```

### Phase 2: バックエンド・本番準備（2-3週間）

```markdown
- スマートコントラクト デプロイ
- バックエンド完全実装
- データベース設計・構築
- セキュリティ監査
```

### Phase 3: 広告ネットワーク統合（1-2週間）

```markdown
- Google AdMob 申請・承認
- 広告コンポーネント統装
- A/B テスト実施
```

### Phase 4: ローンチ・運用

```markdown
- Web 公開（Vercel）
- 監視体制構築
- ユーザー対応体制整備
```

---

## 予算概算

```markdown
**月額運用コスト（初期段階）**

| 項目 | コスト | 備考 |
|------|--------|------|
| ドメイン | ¥1,500 | 1年費用 / 12 |
| Vercel | 無料～$20 | Hobby～Pro |
| AWS RDS | $10～50 | PostgreSQL db.t3.micro |
| Redis (Upstash) | 無料～$10 | 開発・小規模向け |
| Sentry | 無料～$50 | エラー追跡 |
| ガス代 (送金) | 変動 | Polygon なら$0.01～ |
| Google AdMob | - | 売上シェア 30% |
| **合計** | **¥20～150/月** | |
```

---

## チェックリスト

実装前に確認してください：

- [ ] スマートコントラクト開発環境セットアップ（Hardhat / Truffle）
- [ ] テストネット（Polygon Mumbai / Sepolia）で動作確認
- [ ] Ethers.js v6 導入
- [ ] バックエンド開発環境整備
- [ ] PostgreSQL インスタンス作成
- [ ] Google AdMob 申請準備
- [ ] セキュリティ監査計画
- [ ] ユーザーテスト計画

---

## 参考リンク

- [Ethers.js ドキュメント](https://docs.ethers.org/v6/)
- [Solidity ドキュメント](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Polygon ドキュメント](https://polygon.technology/)
- [Google AdMob](https://admob.google.com/)
- [Vercel Docs](https://vercel.com/docs)

---

**最終更新**: 2026年3月4日
