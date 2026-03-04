// Vercel Serverless Function: JPYC Transfer
// POST /api/transfer-jpyc
// ユーザーのウォレットへ JPYC を送金（自動送金機能）

import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { Wallet, JsonRpcProvider, Contract, parseUnits } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET;
const PRIVATE_KEY = process.env.TRANSFER_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://polygon-rpc.com';
const JPYC_CONTRACT_ADDRESS = process.env.JPYC_CONTRACT_ADDRESS;

// スマートコントラクト ABI（ERC20）
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) returns (uint256)',
  'function decimals() returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

interface TransferRequest {
  toAddress: string;
  amount: number;
}

interface AuthPayload {
  userId: string;
  walletAddress: string;
  iat?: number;
}

// JWT トークン検証
function verifyToken(authHeader: string | undefined): AuthPayload | null {
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET!) as AuthPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // JWT 検証
    const authPayload = verifyToken(req.headers.authorization);
    if (!authPayload) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    }

    // リクエストボディを検証
    const { toAddress, amount } = req.body as TransferRequest;

    if (!toAddress || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: toAddress, amount',
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // 環境変数チェック
    if (!PRIVATE_KEY || !JPYC_CONTRACT_ADDRESS) {
      return res.status(500).json({
        error: 'Server misconfigured: Missing PRIVATE_KEY or JPYC_CONTRACT_ADDRESS',
      });
    }

    // Ethers.js セットアップ
    const provider = new JsonRpcProvider(RPC_URL);
    const signer = new Wallet(PRIVATE_KEY, provider);
    const contract = new Contract(JPYC_CONTRACT_ADDRESS, ERC20_ABI, signer);

    // JPYC は 18 decimals を使用
    const amountWithDecimals = parseUnits(amount.toString(), 18);

    // ガス推定
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountWithDecimals);
    const gasPrice = await provider.getFeeData();

    if (!gasPrice.gasPrice) {
      return res.status(500).json({ error: 'Failed to fetch gas price' });
    }

    // トランザクション実行
    const tx = await contract.transfer(toAddress, amountWithDecimals, {
      gasLimit: (gasEstimate * 120n) / 100n, // 20% 余裕を持たせる
      gasPrice: gasPrice.gasPrice,
    });

    const receipt = await tx.wait();

    if (!receipt) {
      return res.status(500).json({ error: 'Transaction failed' });
    }

    res.status(200).json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      amount: amount,
      toAddress: toAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transfer error:', error);

    // エラーメッセージの詳細化
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance for transfer';
      } else if (error.message.includes('reverted')) {
        errorMessage = 'Transaction reverted on chain';
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
