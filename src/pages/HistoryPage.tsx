import { TrendingUp, TrendingDown, Play } from 'lucide-react';
import type { UserState, Transaction } from '../store/useStore';

interface HistoryPageProps {
  user: UserState;
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const isExchange = tx.type === 'exchange';
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isExchange ? 'bg-purple-50' : 'bg-jpyc-50'}`}>
        {isExchange ? <TrendingDown size={16} className="text-purple-500" /> : <TrendingUp size={16} className="text-jpyc-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400">{tx.date}</p>
      </div>
      <div className={`font-bold text-sm ${isExchange ? 'text-purple-500' : 'text-jpyc-600'}`}>
        {!isExchange ? '+' : '-'}{tx.amount.toLocaleString()}<span className="text-xs ml-0.5">JPYC</span>
      </div>
    </div>
  );
}

export function HistoryPage({ user }: HistoryPageProps) {
  const earnTotal = user.transactions.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0);
  const grouped = user.transactions.reduce((acc: Record<string, Transaction[]>, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="pb-24">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-3">取引履歴</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-jpyc-50 rounded-xl p-3">
            <div className="flex items-center gap-1 text-jpyc-600 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">累計獲得</span>
            </div>
            <p className="text-jpyc-700 font-bold text-lg">+{earnTotal}</p>
            <p className="text-xs text-jpyc-500">JPYC</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="flex items-center gap-1 text-purple-600 mb-1">
              <Play size={14} />
              <span className="text-xs font-medium">総視聴本数</span>
            </div>
            <p className="text-purple-700 font-bold text-lg">{user.totalAdsWatched}</p>
            <p className="text-xs text-purple-500">本</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {sortedDates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Play size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">まだ取引がありません</p>
            <p className="text-sm mt-1">広告を視聴してJPYCを獲得しましょう</p>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-500">{date}</p>
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs text-jpyc-600 font-medium">
                  +{grouped[date].reduce((s, t) => s + t.amount, 0)} JPYC
                </p>
              </div>
              <div className="card space-y-3 divide-y divide-gray-50">
                {grouped[date].map((tx, i) => (
                  <div key={tx.id} className={i > 0 ? 'pt-3' : ''}>
                    <TransactionItem tx={tx} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
