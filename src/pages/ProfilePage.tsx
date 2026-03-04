import { ExternalLink, ChevronRight, Wallet, HelpCircle, Shield, FileText, Lock } from 'lucide-react';
import type { UserState } from '../store/useStore';

interface ProfilePageProps {
  user: UserState;
  onNavigate: (page: string) => void;
}

export function ProfilePage({ user, onNavigate }: ProfilePageProps) {
  return (
    <div className="pb-24">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-gray-700 to-gray-900 pt-12 pb-8 px-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl border-2 border-white/30">
            👤
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{user.name}</h1>
            <p className="text-white/60 text-sm">JPYCポイ活ユーザー</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/70 text-xs mb-1">JPYC残高</p>
          <p className="text-white text-3xl font-bold">{user.jpycBalance.toLocaleString()} <span className="text-lg">JPYC</span></p>
          <button className="mt-3 bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
            <ExternalLink size={12} />
            ウォレットに出金する
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 統計 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-jpyc-600">{user.totalEarned}</p>
            <p className="text-xs text-gray-500">累計獲得 JPYC</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-purple-500">{user.totalAdsWatched}</p>
            <p className="text-xs text-gray-500">総視聴本数</p>
          </div>
        </div>

        {/* メニュー */}
        <div className="card divide-y divide-gray-50">
          {[
            { icon: Wallet, label: 'JPYC出金', desc: 'ウォレットアドレスを登録して出金', color: 'text-jpyc-600', bg: 'bg-jpyc-50', action: undefined },
            { icon: Shield, label: 'セキュリティ設定', desc: 'パスワード・2段階認証', color: 'text-red-600', bg: 'bg-red-50', action: undefined },
            { icon: HelpCircle, label: 'ヘルプ・FAQ', desc: 'よくある質問と回答', color: 'text-blue-600', bg: 'bg-blue-50', action: undefined },
            { icon: FileText, label: '利用規約', desc: '本サービスの利用条件', color: 'text-gray-600', bg: 'bg-gray-100', action: () => onNavigate('terms') },
            { icon: Lock, label: 'プライバシーポリシー', desc: '個人情報の取り扱いについて', color: 'text-gray-600', bg: 'bg-gray-100', action: () => onNavigate('privacy') },
          ].map(({ icon: Icon, label, desc, color, bg, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* JPYC説明 */}
        <div className="card bg-jpyc-50 border-jpyc-100">
          <h3 className="font-bold text-jpyc-900 text-sm mb-2">💡 JPYCとは？</h3>
          <p className="text-xs text-jpyc-700 leading-relaxed">
            JPYCは日本円と等価な日本初のステーブルコインです。1 JPYC = 1円で利用でき、NFT購入・DeFi・日常決済などで活用できます。
          </p>
          <a href="https://jpyc.jp" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-jpyc-600 font-medium mt-2 hover:underline">
            JPYC公式サイト <ExternalLink size={12} />
          </a>
        </div>

        {/* コピーライト */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">© 2026 @Kazami Gin All rights reserved.</p>
          <p className="text-xs text-gray-300 mt-0.5">本サービスは景品表示法・資金決済法等に準拠して運営されています</p>
        </div>
      </div>
    </div>
  );
}
