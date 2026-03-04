// Vercel Serverless Function: Wallet Verification & JWT Issue
// POST /api/auth-verify-wallet
// ウォレット署名を検証して JWT トークンを発行

import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

interface VerifyWalletRequest {
  walletAddress: string;
  message: string;
  signature: string;
}

interface AuthPayload {
  userId: string;
  walletAddress: string;
  iat?: number;
}

// 指定メッセージを署名検証
function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, message, signature } = req.body as VerifyWalletRequest;

    // バリデーション
    if (!walletAddress || !message || !signature) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, message, signature',
      });
    }

    // ウォレットアドレス形式チェック
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // 署名検証
    const isValid = verifySignature(message, signature, walletAddress);
    if (!isValid) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // JWT 発行
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    const authPayload: AuthPayload = {
      userId: `user_${walletAddress.toLowerCase()}`,
      walletAddress: walletAddress.toLowerCase(),
    };

    const token = jwt.sign(authPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.status(200).json({
      success: true,
      token,
      user: {
        userId: authPayload.userId,
        walletAddress: authPayload.walletAddress,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
