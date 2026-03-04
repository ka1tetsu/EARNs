// POST /api/ads/complete
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';
import { verifyToken } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = verifyToken(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Upsert user first (in case they don't exist yet)
    const user = await prisma.user.upsert({
      where: { walletAddress: payload.walletAddress },
      create: { walletAddress: payload.walletAddress },
      update: {},
    });

    const newCycle = user.adsInCurrentCycle + 1;
    const earned = newCycle >= 3;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalAdsWatched: { increment: 1 },
        adsInCurrentCycle: earned ? 0 : newCycle,
        ...(earned && { points: { increment: 1 }, totalEarned: { increment: 1 } }),
      },
    });

    if (earned) {
      await prisma.pointTransaction.create({
        data: {
          userId: user.id,
          type: 'earn',
          amount: 1,
          description: '広告視聴報酬（3本完了）',
        },
      });
    }

    return res.status(200).json({
      success: true,
      earned,
      points: updatedUser.points,
      totalEarned: updatedUser.totalEarned,
      totalAdsWatched: updatedUser.totalAdsWatched,
      adsInCurrentCycle: updatedUser.adsInCurrentCycle,
    });
  } catch (err) {
    console.error('Ads complete error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
