/**
 * ウォレット連携用ユーティリティ
 * MetaMask、WalletConnect などのウォレットプロバイダーと連携
 */

// 環境に応じて自動的にバックエンドURLを設定
function getBackendUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // 本番環境：Vercel Functions を使用（/api へのリクエストは同一ドメイン）
  return typeof window !== 'undefined' ? `${window.location.origin}` : '';
}

export interface WalletProvider {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

export interface AuthToken {
  token: string;
  expiresIn: string;
}

/**
 * MetaMaskのウォレット接続
 */
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

/**
 * ウォレット署名を使用してJWTトークンを取得
 */
export async function getAuthToken(
  walletAddress: string,
  message: string,
  signature: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth-verify-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        message,
        signature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    const data = (await response.json()) as { token: string };
    return { success: true, token: data.token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * JPYC送金トランザクション生成（バックエンド連携用）
 */
export async function sendJPYCToWallet(
  walletAddress: string,
  amount: number,
  token: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/transfer-jpyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        toAddress: walletAddress,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const data = (await response.json()) as { txHash: string };
    return { success: true, txHash: data.txHash };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * トランザクション完了状況を確認
 */
export async function checkTransactionStatus(
  txHash: string
): Promise<{ success: boolean; status?: string; confirmations?: number; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/transfer-status?txHash=${txHash}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      transaction: { status: string; confirmations: number };
    };
    return {
      success: true,
      status: data.transaction.status,
      confirmations: data.transaction.confirmations,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ウォレット残高を確認
 */
export async function checkWalletBalance(
  walletAddress: string
): Promise<{ success: boolean; balance?: string; error?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/wallet-balance?address=${walletAddress}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = (await response.json()) as { balance: string };
    return { success: true, balance: data.balance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * MetaMask WalletChangeイベントリスナー登録
 */
export function setupWalletListener(
  onAccountChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect: () => void
): void {
  if (typeof window === 'undefined' || !window.ethereum) {
    return;
  }

  window.ethereum.on('accountsChanged', (accounts: unknown) => onAccountChanged(accounts as string[]));
  window.ethereum.on('chainChanged', (chainId: unknown) => onChainChanged(chainId as string));
  window.ethereum.on('disconnect', onDisconnect);
}

/**
 * MetaMask リスナーの削除
 */
export function removeWalletListener(): void {
  if (typeof window === 'undefined' || !window.ethereum) {
    return;
  }

  window.ethereum.removeAllListeners('accountsChanged');
  window.ethereum.removeAllListeners('chainChanged');
  window.ethereum.removeAllListeners('disconnect');
}

/**
 * チェーンID確認（Ethereumメインネット対応確認）
 */
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = (await window.ethereum.request({
      method: 'eth_chainId',
    })) as string;
    // 1 = Ethereum Mainnet
    return chainId === '0x1';
  } catch (error) {
    console.error('チェーン確認エラー:', error);
    return false;
  }
}

/**
 * 型定義補強
 */
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
