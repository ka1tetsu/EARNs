import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div className="pb-24">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">利用規約</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">最終更新日：2026年3月2日</p>

        <p>
          本利用規約（以下「本規約」）は、<strong>@Kazami Gin</strong>（以下「当社」）が提供するJPYCポイ活サービス（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。
        </p>

        {/* 第1条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第1条（本サービスの内容）</h2>
          <p>本サービスは、動画広告の視聴に対する報酬としてJPYC（日本円ステーブルコイン）を付与するサービスです。本サービスは日本国内法令に準拠して運営されます。なお、本サービスは景品表示法（不当景品類及び不当表示防止法）、資金決済に関する法律その他関連法令を遵守します。</p>
        </section>

        {/* 第2条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第2条（利用登録）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>本サービスの利用には、当社所定の方法による登録が必要です。</li>
            <li>利用登録にあたり虚偽の情報を提供したユーザーは、当社の判断により登録を取り消すことができます。</li>
            <li>1人のユーザーは1アカウントのみ登録できます。複数アカウントの作成は禁止します。</li>
            <li>未成年者は保護者の同意を得た上でご利用ください。</li>
          </ol>
        </section>

        {/* 第3条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第3条（JPYCの取得・利用）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>ユーザーは、動画広告3本の完全視聴により1JPYCを取得できます。</li>
            <li>JPYCの取得は当社が定める条件を満たした場合のみ有効とします。</li>
            <li>当社は、当社の裁量により、JPYCの付与レート、付与上限、付与条件を予告なく変更できるものとします。</li>
            <li>取得したJPYCの有効期限は最終取得日から1年間とします。</li>
            <li>JPYCは現金への交換はできません。JPYCはJPYC Inc.が発行する前払式支払手段であり、当社はその配布に関する媒介をするものです。</li>
            <li>当社はいかなる理由においてもJPYCの価値を保証しません。</li>
            <li>当社は、本サービスの終了、当社の都合その他理由を問わず、ユーザーが保有するJPYCを失効させる権利を留保します。</li>
          </ol>
        </section>

        {/* 第4条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第4条（広告視聴）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>ユーザーは、本サービス内で表示される広告動画を最後まで視聴した場合に限り、視聴完了とみなします。</li>
            <li>ユーザーは、広告視聴の際に広告主が提供するコンテンツを閲覧することに同意します。</li>
            <li>当社は、ユーザーに対して広告の内容・品質・サービスについて一切の保証を行いません。</li>
            <li>ユーザーの視聴行動に関するデータは、広告効果測定のために利用される場合があります。</li>
          </ol>
        </section>

        {/* 第5条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第5条（禁止事項）</h2>
          <p className="mb-1">ユーザーは以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>ボット、スクリプト、自動化ツール等を用いた不正な視聴</li>
            <li>複数アカウントの作成・利用</li>
            <li>本サービスのシステムへの不正アクセスまたはその試み</li>
            <li>当社または第三者の知的財産権を侵害する行為</li>
            <li>当社または第三者を誹謗中傷する行為</li>
            <li>法令または公序良俗に反する行為</li>
            <li>その他当社が不適切と判断する行為</li>
          </ul>
          <p className="mt-2">前項の禁止行為が発覚した場合、当社はアカウント停止・獲得JPYCの無効化を即座に行うことができます。これによりユーザーに損害が生じても当社は一切責任を負いません。</p>
        </section>

        {/* 第6条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第6条（サービスの変更・中断・終了）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>当社は、ユーザーへの事前通知なく、本サービスの内容を変更、追加、または削除できます。</li>
            <li>当社は、以下の場合に本サービスを中断または終了できます。
              <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                <li>システムのメンテナンスまたは障害対応</li>
                <li>天災、停電その他不可抗力による場合</li>
                <li>当社の都合による場合</li>
              </ul>
            </li>
            <li>本サービスの変更・中断・終了によりユーザーに生じた損害について、当社は一切の責任を負いません。</li>
          </ol>
        </section>

        {/* 第7条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第7条（免責事項）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>当社は、本サービスの正確性、完全性、有用性、適法性、安全性について何ら保証しません。</li>
            <li>当社は、本サービスに関連してユーザーに生じた損害（直接損害・間接損害・逸失利益を含む一切の損害）について、当社に故意または重大な過失がある場合を除き、責任を負いません。</li>
            <li>当社の責任が認められる場合でも、その賠償額は当該ユーザーが直近3ヶ月に当社から受け取ったJPYCの円換算額を上限とします。</li>
            <li>当社は、JPYCのブロックチェーンネットワークの障害、遅延、エラーについて一切責任を負いません。</li>
          </ol>
        </section>

        {/* 第8条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第8条（知的財産権）</h2>
          <p>本サービスに関するすべてのコンテンツ、デザイン、商標、著作物の権利は当社または正当な権利者に帰属します。ユーザーは、当社の書面による事前承諾なく、これらを複製・転載・改変・販売・配布することはできません。</p>
        </section>

        {/* 第9条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第9条（個人情報の取扱い）</h2>
          <p>当社は、個人情報の保護に関する法律（個人情報保護法）を遵守し、ユーザーの個人情報を適切に管理します。詳細はプライバシーポリシーをご参照ください。当社はユーザーの同意なく第三者に個人情報を提供しません（ただし法令に基づく場合を除く）。</p>
        </section>

        {/* 第10条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第10条（規約の改定）</h2>
          <p>当社は、必要と判断した場合、ユーザーへの通知なく本規約を変更できます。変更後の本規約は、本サービス上に掲示した時点で効力を生じます。変更後も本サービスを継続利用した場合、ユーザーは変更後の規約に同意したものとみなします。</p>
        </section>

        {/* 第11条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第11条（準拠法・管轄裁判所）</h2>
          <p>本規約は日本法に準拠します。本規約に関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        {/* 第12条 */}
        <section>
          <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-jpyc-500 pl-3">第12条（関連法令への準拠）</h2>
          <p>本サービスは以下の法令を遵守して運営されます。</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>不当景品類及び不当表示防止法（景品表示法）</li>
            <li>資金決済に関する法律</li>
            <li>個人情報の保護に関する法律</li>
            <li>特定商取引に関する法律</li>
            <li>不正競争防止法</li>
          </ul>
        </section>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-xs text-gray-500 text-center">
            © 2026 @Kazami Gin All rights reserved.
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            本規約に関するお問い合わせは、アプリ内のサポートよりご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}
