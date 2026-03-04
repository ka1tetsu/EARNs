import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Volume2, VolumeX, CheckCircle } from 'lucide-react';

// --- IMA SDK 型定義 ---
interface ImaAdsManager {
  addEventListener(type: string, handler: (e: ImaAdEvent) => void): void;
  init(w: number, h: number, viewMode: string): void;
  start(): void;
  destroy(): void;
  setVolume(v: number): void;
}
interface ImaAdEvent {
  getAdsManager?: (v: HTMLVideoElement) => ImaAdsManager;
  getError?: () => { getMessage(): string };
}
interface ImaSDK {
  AdDisplayContainer: new (c: HTMLElement, v?: HTMLVideoElement) => {
    initialize(): void;
    destroy(): void;
  };
  AdsLoader: new (dc: object) => {
    addEventListener(t: string, h: (e: ImaAdEvent) => void): void;
    requestAds(r: object): void;
    destroy(): void;
  };
  AdsRequest: new () => {
    adTagUrl: string;
    linearAdSlotWidth: number;
    linearAdSlotHeight: number;
    nonLinearAdSlotWidth: number;
    nonLinearAdSlotHeight: number;
  };
  AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: string } };
  AdErrorEvent: { Type: { AD_ERROR: string } };
  AdEvent: { Type: { COMPLETE: string; STARTED: string; ALL_ADS_COMPLETED: string; SKIPPED: string } };
}
declare global {
  interface Window {
    google?: { ima: ImaSDK };
    adsbygoogle?: unknown[];
  }
}
// --- 型定義ここまで ---

// IMA 広告タグ（VITE_IMA_AD_TAG 未設定時はGoogleテスト広告を使用）
const AD_TAG_URL =
  (import.meta.env.VITE_IMA_AD_TAG as string | undefined) ??
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';

// IMA 失敗時のフォールバック動画
const FALLBACK_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

interface VideoAdModalProps {
  adNumber: number;
  totalAdsWatched: number;
  onComplete: () => void;
  onClose: () => void;
}

export function VideoAdModal({ adNumber, totalAdsWatched, onComplete, onClose }: VideoAdModalProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adsManagerRef = useRef<ImaAdsManager | null>(null);
  const displayContainerRef = useRef<{ initialize(): void; destroy(): void } | null>(null);
  const adsLoaderRef = useRef<{ destroy(): void } | null>(null);
  const initialized = useRef(false);

  const [completed, setCompleted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [canClose, setCanClose] = useState(false);
  const [useIma, setUseIma] = useState(true);
  const [imaLoaded, setImaLoaded] = useState(!!window.google?.ima);

  // フォールバック動画用
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [started, setStarted] = useState(false);

  const fallbackVideo = FALLBACK_VIDEOS[totalAdsWatched % FALLBACK_VIDEOS.length];

  // 5秒後に「閉じる」ボタン表示
  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // IMA SDK スクリプト読み込み
  useEffect(() => {
    if (window.google?.ima) { setImaLoaded(true); return; }
    if (document.querySelector('script[src*="imasdk.googleapis"]')) return;
    const script = document.createElement('script');
    script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
    script.async = true;
    script.onload = () => setImaLoaded(true);
    script.onerror = () => setUseIma(false);
    document.head.appendChild(script);
  }, []);

  // IMA SDK 初期化
  useEffect(() => {
    if (!imaLoaded || !useIma || initialized.current) return;
    if (!adContainerRef.current || !videoRef.current) return;

    initialized.current = true;
    const ima = window.google!.ima;
    const adContainer = adContainerRef.current;
    const video = videoRef.current;

    const displayContainer = new ima.AdDisplayContainer(adContainer, video);
    displayContainerRef.current = displayContainer;
    displayContainer.initialize();

    const adsLoader = new ima.AdsLoader(displayContainer);
    adsLoaderRef.current = adsLoader;

    adsLoader.addEventListener(
      ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      (event: ImaAdEvent) => {
        const adsManager = event.getAdsManager!(video);
        adsManagerRef.current = adsManager;

        adsManager.addEventListener(ima.AdEvent.Type.STARTED, () => setStarted(true));
        adsManager.addEventListener(ima.AdEvent.Type.COMPLETE, () => setCompleted(true));
        adsManager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => setCompleted(true));
        adsManager.addEventListener(ima.AdEvent.Type.SKIPPED, () => setCompleted(true));
        adsManager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => {
          adsManager.destroy();
          setUseIma(false);
        });

        try {
          adsManager.init(adContainer.offsetWidth || 390, adContainer.offsetHeight || 600, 'normal');
          adsManager.setVolume(0); // 最初はミュート
          adsManager.start();
        } catch {
          setUseIma(false);
        }
      }
    );

    adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => setUseIma(false));

    const request = new ima.AdsRequest();
    request.adTagUrl = AD_TAG_URL;
    request.linearAdSlotWidth = adContainer.offsetWidth || 390;
    request.linearAdSlotHeight = adContainer.offsetHeight || 600;
    request.nonLinearAdSlotWidth = adContainer.offsetWidth || 390;
    request.nonLinearAdSlotHeight = 150;
    adsLoader.requestAds(request);

    return () => {
      adsManagerRef.current?.destroy();
      displayContainerRef.current?.destroy();
      adsLoaderRef.current?.destroy();
    };
  }, [imaLoaded, useIma]);

  // ミュート切替（IMA / フォールバック共通）
  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (adsManagerRef.current) {
      adsManagerRef.current.setVolume(newMuted ? 0 : 1);
    } else if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  }, [muted]);

  // フォールバック動画ハンドラ
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
    v?.play().catch(() => {});
    setStarted(true);
  }, []);
  const handleEnded = useCallback(() => setCompleted(true), []);
  const handleWaiting = useCallback(() => setBuffering(true), []);
  const handleCanPlay = useCallback(() => setBuffering(false), []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const remaining = Math.max(0, duration - currentTime);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 上部バー */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-400 text-black font-bold px-2 py-0.5 rounded">広告</span>
          <span className="text-white text-xs font-medium">スポンサー広告</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
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
      <div className="flex-1 relative bg-black overflow-hidden">
        {useIma ? (
          <div ref={adContainerRef} className="absolute inset-0">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={fallbackVideo}
            muted={muted}
            playsInline
            onLoadedData={handleLoaded}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            className="w-full h-full object-contain"
          />
        )}

        {/* ローディングスピナー */}
        {(!started || (!useIma && buffering)) && !completed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* ミュート中バナー（フォールバック時） */}
        {!useIma && muted && started && !completed && (
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
              {adNumber < 3 ? `あと ${3 - adNumber} 本でJPYC獲得` : '1 JPYC 獲得！'}
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

      {/* 下部：進捗 */}
      <div className="bg-black/90 px-4 py-3">
        {!useIma && (
          <div className="w-full bg-white/20 rounded-full h-1 mb-3 overflow-hidden">
            <div
              className="bg-jpyc-400 h-1 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {!useIma && (
            <span className="text-white/60 text-xs">
              {completed ? '完了' : duration > 0 ? `残り ${formatTime(remaining)}` : '読み込み中…'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
