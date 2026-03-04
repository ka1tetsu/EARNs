import { ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="pb-24">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">プライバシーポリシー</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">最終更新日：2026年3月2日</p>

        <p>
          <strong>@Kazami Gin</strong>（以下「当社」）は、個人情報の保護に関する法律（個人情報保護法）を遵守し、ユーザーの個人情報を適切に管理します。
        </p>

        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">収集する情報</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>氏名・メールアドレス等の登録情報</li>
            <li>広告視聴履歴・JPYC取得履歴</li>
            <li>IPアドレス・デバイス情報・ブラウザ情報</li>
            <li>アクセス日時・操作ログ</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">利用目的</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>本サービスの提供・運営</li>
            <li>JPYC付与・管理</li>
            <li>広告効果の測定・不正検知</li>
            <li>サービス改善・新機能開発</li>
            <li>法令に基づく対応</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第三者提供</h2>
          <p>当社は、以下の場合を除き個人情報を第三者に提供しません。</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>広告効果測定のため匿名化した情報を広告主と共有する場合</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">Cookie・トラッキング</h2>
          <p>当社は、サービス改善・広告最適化のためCookieおよびトラッキング技術を使用します。ブラウザ設定によりCookieを無効にできますが、一部機能が利用できなくなる場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">お問い合わせ</h2>
          <p>個人情報の開示・訂正・削除のご要望は、アプリ内サポートよりご連絡ください。</p>
        </section>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 text-center">© 2026 @Kazami Gin All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
