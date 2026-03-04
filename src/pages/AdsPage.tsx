import { useState } from 'react';
import { Play, CheckCircle, Info, TrendingUp } from 'lucide-react';
import type { UserState } from '../store/useStore';
import { VideoAdModal } from '../components/VideoAdModal';

interface AdsPageProps {
  user: UserState;
  onWatchAd: () => void;
}

export function AdsPage({ user, onWatchAd }: AdsPageProps) {
  const [showAd, setShowAd] = useState(false);

  const { adsInCurrentCycle, totalAdsWatched } = user;

  const handleAdComplete = () => {
    onWatchAd();
    setShowAd(false);
  };

  const handleAdClose = () => {
    setShowAd(false);
  };

  return (
    <div className="pb-24">
      {/* 動画広告モーダル */}
      {showAd && (
        <VideoAdModal
          adNumber={adsInCurrentCycle + 1}
          totalAdsWatched={totalAdsWatched}
          onComplete={handleAdComplete}
          onClose={handleAdClose}
        />
      )}

      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-jpyc-700 via-jpyc-600 to-jpyc-500 pt-12 pb-8 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <h1 className="text-white text-xl font-bold mb-1 relative">広告を見てJPYCを稼ぐ</h1>
        <p className="text-jpyc-100 text-sm relative">動画広告3本の視聴で 1 JPYC 獲得</p>

        {/* JPYC残高ミニ表示 */}
        <div className="mt-4 bg-white/15 rounded-2xl p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-jpyc-100 text-xs mb-0.5">現在の残高</p>
              <p className="text-white text-3xl font-bold">{user.jpycBalance.toLocaleString()} <span className="text-lg">JPYC</span></p>
            </div>
            <div className="text-right">
              <p className="text-jpyc-100 text-xs mb-0.5">累計獲得</p>
              <p className="text-white font-bold">{user.totalEarned} JPYC</p>
              <p className="text-jpyc-200 text-xs">視聴数: {totalAdsWatched}本</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* 進捗カード */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">現在の進捗</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {adsInCurrentCycle}/3 本視聴済み
            </span>
          </div>

          {/* 3ステップ表示 */}
          <div className="flex items-center gap-2 mb-4">
            {[0, 1, 2].map(i => {
              const done = i < adsInCurrentCycle;
              const current = i === adsInCurrentCycle;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? 'bg-jpyc-500 border-jpyc-500'
                        : current
                        ? 'border-jpyc-400 bg-jpyc-50 animate-pulse'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {done ? (
                      <CheckCircle size={20} className="text-white" />
                    ) : (
                      <span className={`text-sm font-bold ${current ? 'text-jpyc-600' : 'text-gray-300'}`}>{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs ${done ? 'text-jpyc-600 font-medium' : current ? 'text-jpyc-500' : 'text-gray-300'}`}>
                    {done ? '完了' : current ? '次' : '待機'}
                  </span>
                </div>
              );
            })}

            <div className="text-jpyc-400 mx-1 text-xl font-bold">→</div>

            {/* 1 JPYC アイコン */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  adsInCurrentCycle >= 3
                    ? 'bg-jpyc-500 border-jpyc-500'
                    : 'border-dashed border-jpyc-300 bg-jpyc-50'
                }`}
              >
                <span className="text-sm font-bold text-jpyc-600">¥1</span>
              </div>
              <span className="text-xs text-jpyc-600 font-bold">1 JPYC</span>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-jpyc-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(adsInCurrentCycle / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            あと {3 - adsInCurrentCycle} 本で 1 JPYC
          </p>
        </div>

        {/* 視聴ボタン */}
        <button
          onClick={() => setShowAd(true)}
          className="w-full flex items-center justify-center gap-3 bg-jpyc-500 hover:bg-jpyc-600 active:scale-95 text-white font-bold py-5 rounded-2xl text-lg shadow-lg shadow-jpyc-200 transition-all"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Play size={22} className="ml-0.5" />
          </div>
          動画広告を視聴する
        </button>

        {/* 仕組み説明 */}
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-blue-500" />
            <h3 className="font-bold text-blue-900 text-sm">仕組み</h3>
          </div>
          <div className="space-y-2">
            {[
              { icon: '▶️', text: '動画広告を最後まで視聴する' },
              { icon: '✅', text: '3本視聴すると 1 JPYC 獲得' },
              { icon: '🪙', text: '1 JPYC ＝ 1 円（日本円連動）' },
              { icon: '💼', text: '貯まったJPYCはウォレットに出金可能' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <p className="text-xs text-blue-800">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="card bg-amber-50 border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-amber-600" />
            <h3 className="font-bold text-amber-900 text-sm">注意事項</h3>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>動画を最後まで視聴した場合のみ視聴済みとカウントされます</li>
            <li>途中で閉じた場合はカウントされません</li>
            <li>JPYCの出金には別途ウォレット登録が必要です</li>
            <li>不正な視聴（ボット等）が検知された場合、獲得JPYCは無効となります</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
