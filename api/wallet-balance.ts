// Vercel Serverless Function: Check Wallet Balance
// GET /api/wallet-balance?address=0x...
// JPYC トークン残高を確認

import { VercelRequest, VercelResponse } from '@vercel/node';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://polygon-rpc.com';
const JPYC_CONTRACT_ADDRESS = process.env.JPYC_CONTRACT_ADDRESS;

// ERC20 ABI
const ERC20_ABI = ['function balanceOf(address account) returns (uint256)', 'function decimals() returns (uint8)'];

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
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid address parameter' });
    }

    // ウォレットアドレス形式チェック
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    if (!JPYC_CONTRACT_ADDRESS) {
      return res.status(500).json({
        error: 'Server misconfigured: Missing JPYC_CONTRACT_ADDRESS',
      });
    }

    // Ethers.js セットアップ
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new Contract(JPYC_CONTRACT_ADDRESS, ERC20_ABI, provider);

    // 残高を取得
    const balanceRaw: bigint = await contract.balanceOf(address);
    const decimals: number = await contract.decimals();
    const balance = formatUnits(balanceRaw, decimals);

    res.status(200).json({
      success: true,
      address: address.toLowerCase(),
      balance: balance,
      balanceRaw: balanceRaw.toString(),
      decimals,
      contractAddress: JPYC_CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
