import { Play, TrendingUp, History, ChevronRight } from 'lucide-react';
import type { UserState } from '../store/useStore';

interface HomePageProps {
  user: UserState;
  onNavigate: (page: string) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  const { jpycBalance, totalEarned, totalAdsWatched, adsInCurrentCycle } = user;
  const cyclePercent = (adsInCurrentCycle / 3) * 100;

  return (
    <div className="pb-24">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-jpyc-700 via-jpyc-600 to-jpyc-500 pt-12 pb-10 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

        <p className="text-jpyc-100 text-sm relative">JPYCポイ活</p>
        <h1 className="text-white text-2xl font-bold mb-5 relative">動画を見てJPYCを稼ごう</h1>

        {/* 残高カード */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 relative">
          <p className="text-jpyc-100 text-xs font-medium mb-1">現在のJPYC残高</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-white text-4xl font-bold">{jpycBalance.toLocaleString()}</span>
            <span className="text-jpyc-200 text-lg font-semibold mb-1">JPYC</span>
            <span className="text-jpyc-200 text-xs mb-1.5 ml-1">≒ ¥{jpycBalance.toLocaleString()}</span>
          </div>

          {/* 次のJPYCまでの進捗 */}
          <div className="mt-1">
            <div className="flex justify-between text-xs text-jpyc-100 mb-1.5">
              <span>次の 1 JPYC まで</span>
              <span>{adsInCurrentCycle}/3 本視聴済み</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${cyclePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* メインアクション */}
        <button
          onClick={() => onNavigate('ads')}
          className="w-full flex items-center justify-between bg-jpyc-500 hover:bg-jpyc-600 active:scale-95 text-white font-bold p-4 rounded-2xl shadow-lg shadow-jpyc-200 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Play size={24} className="ml-0.5" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">今すぐ広告を視聴</p>
              <p className="text-jpyc-100 text-xs">3本 = 1 JPYC獲得</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-jpyc-200" />
        </button>

        {/* 統計 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <TrendingUp size={20} className="text-jpyc-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalEarned}</p>
            <p className="text-xs text-gray-500">累計獲得 JPYC</p>
          </div>
          <div className="card text-center">
            <Play size={20} className="text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalAdsWatched}</p>
            <p className="text-xs text-gray-500">総視聴本数</p>
          </div>
        </div>

        {/* 収益モデル説明 */}
        <div className="card">
          <h2 className="font-bold text-gray-900 text-sm mb-3">💡 サービスの仕組み</h2>
          <div className="space-y-2.5">
            {[
              { step: '1', title: '広告を視聴', desc: '動画広告を最後まで視聴する', color: 'bg-blue-500' },
              { step: '2', title: '3本でJPYC獲得', desc: '3本視聴完了ごとに 1 JPYC 付与', color: 'bg-jpyc-500' },
              { step: '3', title: 'ウォレットへ出金', desc: '貯まったJPYCをウォレットに送金', color: 'bg-purple-500' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-7 h-7 ${color} text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0`}>
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近の取引 */}
        {user.transactions.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                <History size={14} className="text-gray-400" />
                最近の取引
              </h2>
              <button onClick={() => onNavigate('history')} className="text-xs text-jpyc-600 font-medium flex items-center gap-0.5">
                すべて見る <ChevronRight size={12} />
              </button>
            </div>
            <div className="card space-y-2">
              {user.transactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-jpyc-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={14} className="text-jpyc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <span className="text-jpyc-600 font-bold text-sm">+{tx.amount} JPYC</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 法的注記 */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          本サービスは景品表示法・資金決済法等に基づき適法に運営されています。<br />
          1 JPYC = 1 円（日本円連動ステーブルコイン）
        </p>
      </div>
    </div>
  );
}
