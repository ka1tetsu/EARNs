// GET /api/user/stats
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const payload = verifyToken(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: payload.walletAddress },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        user: {
          points: 0,
          totalEarned: 0,
          totalAdsWatched: 0,
          adsInCurrentCycle: 0,
          transactions: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        points: user.points,
        totalEarned: user.totalEarned,
        totalAdsWatched: user.totalAdsWatched,
        adsInCurrentCycle: user.adsInCurrentCycle,
        transactions: user.transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          txHash: t.txHash ?? undefined,
          date: t.createdAt.toISOString().split('T')[0],
        })),
      },
    });
  } catch (err) {
    console.error('User stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
