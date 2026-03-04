import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertCircle, Wallet, Loader } from 'lucide-react';
import type { UserState } from '../store/useStore';
import { connectMetaMask, sendJPYCToWallet, setupWalletListener, removeWalletListener } from '../utils/walletUtils';

interface ShopPageProps {
  user: UserState;
  onExchange: (amount: number, txHash?: string) => void;
  onConnectWallet: (address: string) => void;
  onDisconnectWallet: () => void;
}

export function ShopPage({ user, onExchange, onConnectWallet, onDisconnectWallet }: ShopPageProps) {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  const exchangeAmounts = [10, 20, 50, 100, 500];
  const canExchange = user.jpycBalance >= selectedAmount;

  // ウォレットリスナーの設定
  useEffect(() => {
    setupWalletListener(
      (accounts) => {
        if (accounts.length > 0) {
          onConnectWallet(accounts[0]);
        }
      },
      () => {
        // チェーン変更時の処理
      },
      () => {
        onDisconnectWallet();
      }
    );

    return () => {
      removeWalletListener();
    };
  }, [onConnectWallet, onDisconnectWallet]);

  const handleConnectWallet = async () => {
    const address = await connectMetaMask();
    if (address) {
      onConnectWallet(address);
    } else {
      setError('ウォレット接続に失敗しました');
    }
  };

  const handleExchange = () => {
    if (canExchange) {
      if (!user.isWalletConnected) {
        setError('ウォレットに接続してください');
        return;
      }
      setShowConfirm(true);
    }
  };

  const confirmExchange = async () => {
    setShowConfirm(false);
    setIsProcessing(true);
    setProcessingMessage('トランザクション生成中...');
    setError(null);

    try {
      // バックエンド連携でウォレットに送金
      // 本番環境では、実際のバックエンドURLを使用してください
      const backendUrl = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000';

      setProcessingMessage('ウォレットへ送金中...');
      const result = await sendJPYCToWallet(user.walletAddress!, selectedAmount, backendUrl);

      if (result.success) {
        setProcessingMessage('交換を完了しています...');
        // 交換完了をストアに反映
        onExchange(selectedAmount, result.txHash);
        setExchangeSuccess(true);
        setTimeout(() => {
          setExchangeSuccess(false);
          setIsProcessing(false);
          setProcessingMessage('');
        }, 3000);
      } else {
        throw new Error(result.error || 'トランザクション失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '交換処理中にエラーが発生しました');
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  return (
    <div className="pb-24 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-500 pt-12 pb-8 px-4">
        <h1 className="text-white text-xl font-bold mb-1">JPYC交換</h1>
        <p className="text-purple-100 text-sm">溜まったJPYCをウォレットに交換</p>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* 現在残高 */}
        <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <p className="text-gray-600 text-sm font-medium mb-1">現在のJPYC残高</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-purple-600">{user.jpycBalance.toLocaleString()}</span>
            <span className="text-lg text-gray-600 mb-1">JPYC</span>
            <span className="text-sm text-gray-500 mb-1 ml-2">≒ ¥{user.jpycBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* ウォレット接続状態 */}
        <div className={`card ${user.isWalletConnected ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className={user.isWalletConnected ? 'text-green-600' : 'text-blue-600'} />
              <span className="font-bold text-gray-900">ウォレット</span>
            </div>
            {user.isWalletConnected && (
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">接続済み</span>
            )}
          </div>
          {user.isWalletConnected ? (
            <div>
              <p className="text-sm text-gray-700 font-mono break-all">{user.walletAddress}</p>
              <button
                onClick={onDisconnectWallet}
                className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                接続解除
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              MetaMaskで接続
            </button>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="card bg-red-50 border-red-200 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-bold text-sm">エラー</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 交換成功メッセージ */}
        {exchangeSuccess && (
          <div className="card bg-green-50 border-green-200 flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-900 font-bold text-sm">交換申請しました！</p>
              <p className="text-green-700 text-xs mt-1">
                ウォレットへの反映まで数分かかる場合があります
              </p>
            </div>
          </div>
        )}

        {/* 交換額選択 */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">交換額を選択</h2>
          <div className="grid grid-cols-2 gap-2">
            {exchangeAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                disabled={amount > user.jpycBalance}
                className={`card p-3 text-center font-bold transition-all ${
                  selectedAmount === amount
                    ? 'border-purple-500 bg-purple-50 text-purple-600 ring-2 ring-purple-300'
                    : amount > user.jpycBalance
                    ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                {amount}
                <span className="text-xs text-gray-500 block mt-1">≒ ¥{amount}</span>
              </button>
            ))}
          </div>
        </div>

        {/* カスタム金額入力 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            または金額を入力（10の倍数）
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="10"
              step="10"
              value={selectedAmount}
              onChange={e => {
                const val = Math.max(10, Math.floor(parseInt(e.target.value) / 10) * 10 || 10);
                if (val <= user.jpycBalance) {
                  setSelectedAmount(val);
                }
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-bold"
              placeholder="金額を入力"
            />
            <div className="flex items-center text-gray-600 font-bold">JPYC</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">※10JPYC単位での交換になります</p>
        </div>

        {/* 交換内容確認 */}
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-2">交換内容</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">交換額</span>
              <span className="font-bold text-gray-900">{selectedAmount} JPYC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">交換後残高</span>
              <span className={`font-bold ${user.jpycBalance - selectedAmount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {Math.max(0, user.jpycBalance - selectedAmount)} JPYC
              </span>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex gap-2 items-start">
            <AlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-orange-900 mb-1">交換について</p>
              <ul className="text-xs text-orange-800 space-y-0.5 list-disc list-inside">
                <li>交換には10JPYC以上が必要です</li>
                <li>10の倍数単位での交換になります</li>
                <li>交換後、ウォレットへ数分で反映されます</li>
                <li>キャンセルはできません</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 交換ボタン */}
        {isProcessing && (
          <div className="w-full py-4 px-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-purple-300 text-white">
            <Loader size={20} className="animate-spin" />
            <span>{processingMessage}</span>
          </div>
        )}
        {!isProcessing && (
          <button
            onClick={handleExchange}
            disabled={!canExchange || !user.isWalletConnected}
            className={`w-full py-4 px-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              canExchange && user.isWalletConnected
                ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-lg shadow-purple-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{selectedAmount} JPYC交換する</span>
            <ArrowRight size={20} />
          </button>
        )}

        {!canExchange && (
          <p className="text-center text-sm text-orange-600 font-medium">
            交換には最低10JPYC必要です
          </p>
        )}
      </div>

      {/* 確認モーダル */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">交換を確認</h3>
              <p className="text-gray-600 text-sm mb-4">
                {selectedAmount} JPYCをウォレットに交換します
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-3xl font-bold text-purple-600">{selectedAmount}</span>
                  <span className="text-purple-600 font-bold">JPYC</span>
                  <span className="text-2xl text-gray-400">→</span>
                  <span className="text-3xl font-bold text-green-600">¥{selectedAmount}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="py-3 px-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={confirmExchange}
                disabled={isProcessing}
                className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    処理中...
                  </>
                ) : (
                  '交換する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
