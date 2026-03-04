import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Volume2, VolumeX, CheckCircle, Play } from 'lucide-react';

// Google公開サンプル動画（広告デモ用）
// 本番環境では広告ネットワーク（Google AdMob、Nend等）のSDKに差し替えること
const AD_VIDEOS = [
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: '新商品のご紹介',
    brand: 'スポンサー広告',
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: '夏の特別キャンペーン',
    brand: 'スポンサー広告',
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    title: '期間限定オファー',
    brand: 'スポンサー広告',
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    title: '新サービス開始のお知らせ',
    brand: 'スポンサー広告',
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'おすすめサービスのご案内',
    brand: 'スポンサー広告',
  },
];

interface VideoAdModalProps {
  adNumber: number;        // 1〜3
  totalAdsWatched: number; // 累計
  onComplete: () => void;  // 視聴完了
  onClose: () => void;     // キャンセル（報酬なし）
}

export function VideoAdModal({ adNumber, totalAdsWatched, onComplete, onClose }: VideoAdModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [canClose, setCanClose] = useState(false);

  // 今回流す広告を選択（累計視聴数でローテーション）
  const ad = AD_VIDEOS[totalAdsWatched % AD_VIDEOS.length];

  // 5秒後に閉じるボタンを表示
  useEffect(() => {
    const timer = setTimeout(() => setCanClose(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleLoaded = useCallback(() => {
    setBuffering(false);
    const v = videoRef.current;
    if (v) setDuration(v.duration);
    // autoplay
    v?.play().catch(() => {});
    setStarted(true);
  }, []);

  const handleEnded = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleWaiting = useCallback(() => setBuffering(true), []);
  const handleCanPlay = useCallback(() => setBuffering(false), []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const remaining = Math.max(0, duration - currentTime);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 上部バー */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-400 text-black font-bold px-2 py-0.5 rounded">広告</span>
          <span className="text-white text-xs font-medium truncate max-w-48">{ad.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* ミュート切替 */}
          <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {/* 5秒後に閉じるボタン表示 */}
          {canClose && !completed ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              <X size={12} />
              閉じる（報酬なし）
            </button>
          ) : !completed ? (
            <span className="text-white/50 text-xs">まもなく閉じられます</span>
          ) : null}
        </div>
      </div>

      {/* 動画エリア */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={ad.url}
          muted={muted}
          playsInline
          onLoadedData={handleLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          className="w-full h-full object-contain"
        />

        {/* バッファリング中 */}
        {(buffering && !completed) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* 開始前のプレイボタン（バッファ前） */}
        {!started && !buffering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => videoRef.current?.play()}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Play size={32} className="text-white ml-1" />
            </button>
          </div>
        )}

        {/* ミュート中バナー */}
        {muted && started && !completed && (
          <button
            onClick={toggleMute}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white text-sm px-4 py-2 rounded-full"
          >
            <VolumeX size={16} />
            タップして音声を有効にする
          </button>
        )}

        {/* 視聴完了オーバーレイ */}
        {completed && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-jpyc-500 rounded-full flex items-center justify-center">
              <CheckCircle size={44} className="text-white" />
            </div>
            <p className="text-white text-xl font-bold">視聴完了！</p>
            <p className="text-white/70 text-sm">
              {adNumber < 3
                ? `あと ${3 - adNumber} 本でJPYC獲得`
                : '1 JPYC 獲得！'}
            </p>
            <button
              onClick={onComplete}
              className="mt-2 bg-jpyc-500 hover:bg-jpyc-600 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors"
            >
              {adNumber < 3 ? '次の広告を見る →' : '1 JPYC を受け取る 🎉'}
            </button>
          </div>
        )}
      </div>

      {/* 下部：進捗バー＆情報 */}
      <div className="bg-black/90 px-4 py-3">
        {/* 動画プログレスバー */}
        <div className="w-full bg-white/20 rounded-full h-1 mb-3 overflow-hidden">
          <div
            className="bg-jpyc-400 h-1 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* JPYC進捗 */}
            <div className="flex gap-1">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border transition-all ${
                    n < adNumber
                      ? 'bg-jpyc-500 border-jpyc-500 text-white'
                      : n === adNumber
                      ? completed
                        ? 'bg-jpyc-500 border-jpyc-500 text-white'
                        : 'bg-jpyc-500/30 border-jpyc-400 text-jpyc-300 animate-pulse'
                      : 'bg-transparent border-white/30 text-white/30'
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
            <span className="text-white/60 text-xs">3本で 1 JPYC</span>
          </div>

          <span className="text-white/60 text-xs">
            {completed ? '完了' : duration > 0 ? `残り ${formatTime(remaining)}` : '読み込み中…'}
          </span>
        </div>
      </div>
    </div>
  );
}
