// Vercel Serverless Function: Wallet Verification & JWT Issue
// POST /api/auth-verify-wallet
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recovered = verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { walletAddress, message, signature } = req.body as {
      walletAddress: string;
      message: string;
      signature: string;
    };

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Upsert user in DB (graceful fallback if DB not configured)
    let userStats = { points: 0, totalEarned: 0, totalAdsWatched: 0, adsInCurrentCycle: 0 };
    try {
      const user = await prisma.user.upsert({
        where: { walletAddress: normalizedAddress },
        create: { walletAddress: normalizedAddress },
        update: {},
      });
      userStats = {
        points: user.points,
        totalEarned: user.totalEarned,
        totalAdsWatched: user.totalAdsWatched,
        adsInCurrentCycle: user.adsInCurrentCycle,
      };
    } catch (dbErr) {
      console.error('DB upsert failed (continuing without DB):', dbErr);
    }

    const payload = {
      userId: `user_${normalizedAddress}`,
      walletAddress: normalizedAddress,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.status(200).json({
      success: true,
      token,
      userId: payload.userId,
      walletAddress: normalizedAddress,
      user: userStats,
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
