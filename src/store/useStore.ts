import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  type: 'earn' | 'exchange';
  amount: number;
  description: string;
  date: string;
  walletAddress?: string;
  txHash?: string; // ブロックチェーンのトランザクションハッシュ
}

export interface UserState {
  name: string;
  jpycBalance: number;
  totalEarned: number;
  totalAdsWatched: number;
  walletAddress?: string; // ウォレットアドレス
  isWalletConnected: boolean;
  adsInCurrentCycle: number; // 0, 1, 2 → 3本で1JPYC
  transactions: Transaction[];
}

export function useStore() {
  const [user, setUser] = useState<UserState>({
    name: '田中 太郎',
    jpycBalance: 0,
    totalEarned: 0,
    totalAdsWatched: 0,
    adsInCurrentCycle: 0,
    walletAddress: undefined,
    isWalletConnected: false,
    transactions: [],
  });

  const connectWallet = useCallback((walletAddress: string) => {
    setUser(prev => ({
      ...prev,
      walletAddress,
      isWalletConnected: true,
    }));
  }, []);

  const disconnectWallet = useCallback(() => {
    setUser(prev => ({
      ...prev,
      walletAddress: undefined,
      isWalletConnected: false,
    }));
  }, []);

  const watchAd = useCallback(() => {
    setUser(prev => {
      const newCycle = prev.adsInCurrentCycle + 1;
      const earned = newCycle >= 3;

      const newTransaction: Transaction | null = earned
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
        transactions: newTransaction
          ? [newTransaction, ...prev.transactions]
          : prev.transactions,
      };
    });
  }, []);

  const exchangeJPYC = useCallback((amount: number, txHash?: string) => {
    setUser(prev => {
      if (prev.jpycBalance < amount || amount < 10 || amount % 10 !== 0) {
        return prev;
      }

      const newTransaction: Transaction = {
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
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  }, []);

  return { user, watchAd, exchangeJPYC, connectWallet, disconnectWallet };
}
