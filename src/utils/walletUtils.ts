/**
 * ウォレット連携用ユーティリティ
 */

function getBackendUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return typeof window !== 'undefined' ? `${window.location.origin}` : '';
}

export interface WalletProvider {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

export interface UserStats {
  points: number;
  totalEarned: number;
  totalAdsWatched: number;
  adsInCurrentCycle: number;
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    txHash?: string;
    date: string;
  }[];
}

/** MetaMask接続 */
export async function connectMetaMask(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('MetaMaskがインストールされていません');
    return null;
  }
  try {
    const accounts = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];
    return accounts[0];
  } catch (error) {
    console.error('MetaMask接続エラー:', error);
    return null;
  }
}

/** ウォレット署名でJWTトークン取得 */
export async function getAuthToken(
  walletAddress: string,
  message: string,
  signature: string
): Promise<{ success: boolean; token?: string; user?: UserStats; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth-verify-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, message, signature }),
    });
    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error ?? 'Authentication failed');
    }
    const data = await response.json() as { token: string; user: UserStats };
    return { success: true, token: data.token, user: data.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** ユーザー統計取得 */
export async function getUserStats(
  token: string
): Promise<{ success: boolean; user?: UserStats; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/user/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json() as { user: UserStats };
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** 広告視聴完了を記録 */
export async function recordAdComplete(token: string): Promise<{
  success: boolean;
  earned?: boolean;
  points?: number;
  totalEarned?: number;
  totalAdsWatched?: number;
  adsInCurrentCycle?: number;
  error?: string;
}> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/ads/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json() as {
      success: boolean;
      earned: boolean;
      points: number;
      totalEarned: number;
      totalAdsWatched: number;
      adsInCurrentCycle: number;
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** ポイントをJPYCに交換 */
export async function exchangePoints(
  token: string,
  amount: number
): Promise<{ success: boolean; txHash?: string; points?: number; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/points/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error ?? `API Error: ${response.statusText}`);
    }
    return await response.json() as { success: boolean; txHash: string; points: number };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** JPYC送金（後方互換性） */
export async function sendJPYCToWallet(
  _walletAddress: string,
  amount: number,
  token: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return exchangePoints(token, amount);
}

/** トランザクション状況確認 */
export async function checkTransactionStatus(
  txHash: string
): Promise<{ success: boolean; status?: string; confirmations?: number; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/transfer-status?txHash=${txHash}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json() as { transaction: { status: string; confirmations: number } };
    return { success: true, status: data.transaction.status, confirmations: data.transaction.confirmations };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** ウォレット残高確認 */
export async function checkWalletBalance(
  walletAddress: string
): Promise<{ success: boolean; balance?: string; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/wallet-balance?address=${walletAddress}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json() as { balance: string };
    return { success: true, balance: data.balance };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** MetaMaskイベントリスナー登録 */
export function setupWalletListener(
  onAccountChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect: () => void
): void {
  if (typeof window === 'undefined' || !window.ethereum) return;
  window.ethereum.on('accountsChanged', (accounts: unknown) => onAccountChanged(accounts as string[]));
  window.ethereum.on('chainChanged', (chainId: unknown) => onChainChanged(chainId as string));
  window.ethereum.on('disconnect', onDisconnect);
}

/** MetaMaskリスナー削除 */
export function removeWalletListener(): void {
  if (typeof window === 'undefined' || !window.ethereum) return;
  window.ethereum.removeAllListeners('accountsChanged');
  window.ethereum.removeAllListeners('chainChanged');
  window.ethereum.removeAllListeners('disconnect');
}

/** ネットワーク確認（Polygon Mainnet: 0x89 = 137） */
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    return chainId === '0x89';
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (event?: string) => void;
    };
  }
}
