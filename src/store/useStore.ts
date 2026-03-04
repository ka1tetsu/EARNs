import { useState, useCallback, useEffect } from 'react';
import { getAuthToken, getUserStats, recordAdComplete } from '../utils/walletUtils';

export interface Transaction {
  id: string;
  type: 'earn' | 'exchange';
  amount: number;
  description: string;
  date: string;
  walletAddress?: string;
  txHash?: string;
}

export interface UserState {
  name: string;
  jpycBalance: number;
  totalEarned: number;
  totalAdsWatched: number;
  walletAddress?: string;
  isWalletConnected: boolean;
  adsInCurrentCycle: number;
  transactions: Transaction[];
}

const TOKEN_KEY = 'jpyc_auth_token';

export function useStore() {
  const [user, setUser] = useState<UserState>({
    name: 'ユーザー',
    jpycBalance: 0,
    totalEarned: 0,
    totalAdsWatched: 0,
    adsInCurrentCycle: 0,
    walletAddress: undefined,
    isWalletConnected: false,
    transactions: [],
  });

  const [authToken, setAuthToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  );

  // 起動時: 保存済みトークンでユーザーデータを復元
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    getUserStats(token).then(result => {
      if (result.success && result.user) {
        const u = result.user;
        setUser(prev => ({
          ...prev,
          jpycBalance: u.points,
          totalEarned: u.totalEarned,
          totalAdsWatched: u.totalAdsWatched,
          adsInCurrentCycle: u.adsInCurrentCycle,
          transactions: u.transactions.map(t => ({
            id: t.id,
            type: t.type as 'earn' | 'exchange',
            amount: t.amount,
            description: t.description,
            date: t.date,
            txHash: t.txHash,
          })),
        }));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      }
    });
  }, []);

  const connectWallet = useCallback(async (walletAddress: string) => {
    setUser(prev => ({ ...prev, walletAddress, isWalletConnected: true }));

    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const message = `JPYCポイ活アプリへのサインイン\nアドレス: ${walletAddress}\n時刻: ${new Date().toISOString()}`;
      const signature = (await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      })) as string;

      const authResult = await getAuthToken(walletAddress, message, signature);
      if (authResult.success && authResult.token) {
        localStorage.setItem(TOKEN_KEY, authResult.token);
        setAuthToken(authResult.token);

        if (authResult.user) {
          const u = authResult.user;
          setUser(prev => ({
            ...prev,
            jpycBalance: u.points,
            totalEarned: u.totalEarned,
            totalAdsWatched: u.totalAdsWatched,
            adsInCurrentCycle: u.adsInCurrentCycle,
          }));
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(prev => ({ ...prev, walletAddress: undefined, isWalletConnected: false }));
  }, []);

  const watchAd = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const result = await recordAdComplete(token);
      if (result.success) {
        setUser(prev => {
          const earned = result.earned ?? false;
          const newTx: Transaction | null = earned
            ? {
                id: `t${Date.now()}`,
                type: 'earn',
                amount: 1,
                description: '広告視聴報酬（3本完了）',
                date: new Date().toISOString().split('T')[0],
              }
            : null;
          return {
            ...prev,
            jpycBalance: result.points ?? prev.jpycBalance,
            totalEarned: result.totalEarned ?? prev.totalEarned,
            totalAdsWatched: result.totalAdsWatched ?? prev.totalAdsWatched,
            adsInCurrentCycle: result.adsInCurrentCycle ?? prev.adsInCurrentCycle,
            transactions: newTx ? [newTx, ...prev.transactions] : prev.transactions,
          };
        });
        return;
      }
    }

    // オフラインフォールバック
    setUser(prev => {
      const newCycle = prev.adsInCurrentCycle + 1;
      const earned = newCycle >= 3;
      const newTx: Transaction | null = earned
        ? {
            id: `t${Date.now()}`,
            type: 'earn',
            amount: 1,
            description: '広告視聴報酬（3本完了）',
            date: new Date().toISOString().split('T')[0],
          }
        : null;
      return {
        ...prev,
        jpycBalance: earned ? prev.jpycBalance + 1 : prev.jpycBalance,
        totalEarned: earned ? prev.totalEarned + 1 : prev.totalEarned,
        totalAdsWatched: prev.totalAdsWatched + 1,
        adsInCurrentCycle: earned ? 0 : newCycle,
        transactions: newTx ? [newTx, ...prev.transactions] : prev.transactions,
      };
    });
  }, []);

  const exchangeJPYC = useCallback((amount: number, txHash?: string) => {
    setUser(prev => {
      if (prev.jpycBalance < amount || amount < 10 || amount % 10 !== 0) return prev;
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        type: 'exchange',
        amount,
        description: `JPYC交換（${amount}JPYC）`,
        date: new Date().toISOString().split('T')[0],
        walletAddress: prev.walletAddress,
        txHash,
      };
      return {
        ...prev,
        jpycBalance: prev.jpycBalance - amount,
        transactions: [newTx, ...prev.transactions],
      };
    });
  }, []);

  return { user, authToken, watchAd, exchangeJPYC, connectWallet, disconnectWallet };
}
