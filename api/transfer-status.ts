// Vercel Serverless Function: Check Transfer Status
// GET /api/transfer-status?txHash=0x...
// トランザクション完了状況を確認

import { VercelRequest, VercelResponse } from '@vercel/node';
import { JsonRpcProvider } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://polygon-rpc.com';

interface TransactionDetails {
  hash: string;
  blockNumber: number | null;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { txHash } = req.query;

    if (!txHash || typeof txHash !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid txHash parameter' });
    }

    // トランザクションハッシュ形式チェック
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    // Ethers.js セットアップ
    const provider = new JsonRpcProvider(RPC_URL);

    // トランザクション情報を取得
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return res.status(404).json({
        error: 'Transaction not found',
        txHash,
      });
    }

    // トランザクションレシートを取得（確認済みか確認）
    const receipt = await provider.getTransactionReceipt(txHash);

    let status: 'pending' | 'confirmed' | 'failed' = 'pending';
    let confirmations = 0;

    if (receipt) {
      confirmations = (await provider.getBlockNumber()) - receipt.blockNumber;
      status = receipt.status === 1 ? 'confirmed' : 'failed';
    }

    const txDetails: TransactionDetails = {
      hash: txHash,
      blockNumber: receipt?.blockNumber || null,
      confirmations,
      status,
      timestamp: receipt?.blockNumber
        ? (await provider.getBlock(receipt.blockNumber))?.timestamp
        : undefined,
    };

    res.status(200).json({
      success: true,
      transaction: txDetails,
      isConfirmed: status === 'confirmed',
    });
  } catch (error) {
    console.error('Transfer status check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
