/**
 * ウォレット連携用ユーティリティ
 * MetaMask、WalletConnect などのウォレットプロバイダーと連携
 */

export interface WalletProvider {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
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
 * JPYC送金トランザクション生成（バックエンド連携用）
 */
export async function sendJPYCToWallet(
  walletAddress: string,
  amount: number,
  backendUrl: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const response = await fetch(`${backendUrl}/api/transfer-jpyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toAddress: walletAddress,
        amount,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
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
