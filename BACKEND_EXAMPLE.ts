// バックエンド実装サンプル
// Node.js + Express + TypeScript

import express, { Request, Response } from 'express';
import { Wallet, JsonRpcProvider, Contract } from 'ethers';
import jwt from 'jsonwebtoken';

// ==========================================
// 環境設定
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET!;
const PRIVATE_KEY = process.env.TRANSFER_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!; // Polygon: https://polygon-rpc.com
const CONTRACT_ADDRESS = process.env.JPYC_CONTRACT_ADDRESS!;

// Web3 初期化
const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

// ==========================================
// スマートコントラクト ABI
// ==========================================

const JPYC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) returns (uint256)',
  'function decimals() returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const contract = new Contract(CONTRACT_ADDRESS, JPYC_ABI, wallet);

// ==========================================
// 型定義
// ==========================================

interface TransferRequest {
  toAddress: string;
  amount: number;
  userId: string;
}

interface TransferResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface AuthPayload {
  userId: string;
  walletAddress: string;
  iat?: number;
}

// ==========================================
// JWT 中間ウェア
// ==========================================

function authenticateToken(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// ==========================================
// API エンドポイント
// ==========================================

const app = express();
app.use(express.json());

/**
 * POST /api/auth/verify-wallet
 * ウォレット署名検証 & JWT発行
 */
app.post('/api/auth/verify-wallet', async (req: Request, res: Response) => {
  try {
    const { walletAddress, message, signature } = req.body;

    // 署名検証（Ethers.js v6）
    const recoveredAddress = await provider.resolveName(walletAddress);
    // 実装例: ethers.verifyMessage(message, signature)

    // JWT 発行
    const token = jwt.sign(
      {
        userId: `user_${Date.now()}`,
        walletAddress,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ error: 'Signature verification failed' });
  }
});

/**
 * POST /api/transfer-jpyc
 * JPYC 自動送金
 */
app.post('/api/transfer-jpyc', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { toAddress, amount }: TransferRequest = req.body;
    const user = (req as any).user as AuthPayload;

    // バリデーション
    if (!toAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum amount is 10 JPYC' });
    }

    // アドレスフォーマット確認
    if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // 不正使用チェック（ユーザーは1日5回まで）
    // TODO: データベースで履歴確認

    // Wei に変換 (JPYC は 18 decimals 想定)
    const amountInWei = (amount * Math.pow(10, 18)).toString();

    // ガス推定
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountInWei);
    const gasPrice = await provider.getFeeData();

    // トランザクション実行
    const tx = await contract.transfer(toAddress, amountInWei, {
      gasLimit: gasEstimate.mul(120).div(100), // 20% 余裕
      gasPrice: gasPrice.gasPrice,
    });

    console.log(`Transfer initiated: ${tx.hash}`);

    // 1ブロック確認を待機
    const receipt = await tx.wait(1);

    if (receipt?.status === 1) {
      // 送金成功をログ記録
      console.log(`Transfer completed: ${receipt.hash} to ${toAddress}`);

      // TODO: データベースに記録
      // INSERT INTO transfers (user_id, to_address, amount, tx_hash, status) VALUES (...)

      return res.json({
        success: true,
        txHash: receipt.hash,
      });
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
});

/**
 * GET /api/transfer-status/:txHash
 * トランザクション状態確認
 */
app.get('/api/transfer-status/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.json({
        status: 'pending',
        txHash,
      });
    }

    return res.json({
      status: receipt.status === 1 ? 'success' : 'failed',
      txHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      confirmations: await provider.getBlockNumber().then(bn => bn - receipt.blockNumber),
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid transaction hash',
    });
  }
});

/**
 * GET /api/wallet-balance/:address
 * ウォレット残高確認
 */
app.get('/api/wallet-balance/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const humanReadableBalance = balance / Math.pow(10, decimals);

    res.json({
      address,
      balance: humanReadableBalance,
      balanceRaw: balance.toString(),
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid address' });
  }
});

/**
 * POST /api/admin/transfer
 * 管理者用の一括送金
 */
app.post('/api/admin/transfer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthPayload;
    const { transfers } = req.body as { transfers: TransferRequest[] };

    // 管理者チェック（TODO: DB で管理者権限確認）
    if (user.userId !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const results: any[] = [];

    for (const transfer of transfers) {
      try {
        const amountInWei = (transfer.amount * Math.pow(10, 18)).toString();
        const tx = await contract.transfer(transfer.toAddress, amountInWei);
        const receipt = await tx.wait(1);

        results.push({
          toAddress: transfer.toAddress,
          amount: transfer.amount,
          txHash: receipt?.hash,
          success: receipt?.status === 1,
        });
      } catch (err) {
        results.push({
          toAddress: transfer.toAddress,
          amount: transfer.amount,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Batch transfer failed' });
  }
});

/**
 * GET /api/health
 * ヘルスチェック
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// エラーハンドリング
// ==========================================

app.use((error: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// ==========================================
// サーバー起動
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 RPC URL: ${RPC_URL}`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
});

export { app };
