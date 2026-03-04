// POST /api/points/exchange
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
import { prisma } from '../_lib/prisma.js';
import { verifyToken } from '../_lib/auth.js';

const JPYC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = verifyToken(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  const { amount } = req.body as { amount: number };
  if (!amount || amount < 10 || amount % 10 !== 0) {
    return res.status(400).json({ error: '10JPYC以上、10の倍数で指定してください' });
  }

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.JPYC_CONTRACT_ADDRESS;

  if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS) {
    return res.status(503).json({ error: 'ブロックチェーン設定が未完了です。管理者にお問い合わせください。' });
  }

  try {
    // Check and deduct points
    const user = await prisma.user.findUnique({
      where: { walletAddress: payload.walletAddress },
    });
    if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    if (user.points < amount) return res.status(400).json({ error: 'ポイントが不足しています' });

    // Deduct points first
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { decrement: amount } },
    });

    // Execute JPYC transfer
    let txHash: string;
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, JPYC_ABI, wallet);
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      const gasEstimate = await contract.transfer.estimateGas(payload.walletAddress, amountInWei);
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
      const tx = await contract.transfer(payload.walletAddress, amountInWei, { gasLimit });
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) throw new Error('Transaction failed on-chain');
      txHash = receipt.hash;
    } catch (txErr) {
      // Refund points if transfer failed
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: amount } },
      });
      throw txErr;
    }

    // Record transaction
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        type: 'exchange',
        amount,
        description: `JPYC交換（${amount}JPYC）`,
        txHash,
      },
    });

    return res.status(200).json({
      success: true,
      txHash,
      points: updatedUser?.points ?? user.points - amount,
    });
  } catch (err) {
    console.error('Points exchange error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
