import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

// デモ用バナー広告データ
// 本番環境ではGoogle AdSense / AdMob / Nend 等のバナーSDKに差し替えること
const BANNERS = [
  {
    id: 1,
    text: '🎉 新規登録で500円クーポンプレゼント！今すぐ申し込み',
    sub: 'スポンサー広告',
    bg: 'from-blue-600 to-blue-500',
    badge: 'bg-blue-800',
  },
  {
    id: 2,
    text: '📱 iPhone 16 Pro 今なら最安値！期間限定セール',
    sub: 'スポンサー広告',
    bg: 'from-gray-800 to-gray-700',
    badge: 'bg-gray-900',
  },
  {
    id: 3,
    text: '🍔 Uber Eats 初回注文1,000円OFF クーポン配布中',
    sub: 'スポンサー広告',
    bg: 'from-orange-500 to-orange-400',
    badge: 'bg-orange-700',
  },
  {
    id: 4,
    text: '💳 JPYCで払える！対応サービス・店舗を確認する',
    sub: 'スポンサー広告',
    bg: 'from-jpyc-700 to-jpyc-600',
    badge: 'bg-jpyc-900',
  },
  {
    id: 5,
    text: '✈️ 旅行保険が月々298円〜 格安プランを今すぐチェック',
    sub: 'スポンサー広告',
    bg: 'from-cyan-600 to-cyan-500',
    badge: 'bg-cyan-800',
  },
];

interface BannerAdProps {
  className?: string;
}

export function BannerAd({ className = '' }: BannerAdProps) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(true);

  // 8秒ごとにバナーをローテーション
  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % BANNERS.length);
        setVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(timer);
  }, [dismissed]);

  if (dismissed) return null;

  const banner = BANNERS[index];

  return (
    <div
      className={`w-full transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      <div className={`bg-gradient-to-r ${banner.bg} flex items-center gap-2 px-3 py-2.5`}>
        {/* 広告バッジ */}
        <span className={`flex-shrink-0 text-white text-xs font-bold px-1.5 py-0.5 rounded ${banner.badge} opacity-80`}>
          広告
        </span>

        {/* テキスト */}
        <p className="flex-1 text-white text-xs font-medium truncate leading-tight">
          {banner.text}
        </p>

        {/* アクションボタン */}
        <button className="flex-shrink-0 flex items-center gap-0.5 bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded transition-colors">
          詳細 <ExternalLink size={10} />
        </button>

        {/* 閉じるボタン */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors ml-0.5"
          aria-label="広告を閉じる"
        >
          <X size={14} />
        </button>
      </div>

      {/* ドットインジケーター */}
      <div className="flex justify-center gap-1 py-1 bg-black/5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === index ? 'bg-gray-500 w-3' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
