import { useState, useCallback } from 'react';
import { BottomNav } from './components/BottomNav';
import { BannerAd } from './components/BannerAd';
import { HomePage } from './pages/HomePage';
import { AdsPage } from './pages/AdsPage';
import { ShopPage } from './pages/ShopPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useStore } from './store/useStore';

type Page = 'home' | 'ads' | 'shop' | 'history' | 'profile' | 'terms' | 'privacy';
const NAV_PAGES: Page[] = ['home', 'ads', 'shop', 'history', 'profile'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { user, authToken, watchAd, exchangeJPYC, connectWallet, disconnectWallet } = useStore();

  const navigate = useCallback((page: string) => {
    setCurrentPage(page as Page);
  }, []);

  const isNavPage = NAV_PAGES.includes(currentPage);

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">

      {/* バナー広告（ナビページのみ表示、最上部に固定） */}
      {isNavPage && (
        <div className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto">
          <BannerAd />
        </div>
      )}

      {/* メインコンテンツ（バナー分だけ下にずらす） */}
      <main className={isNavPage ? 'pt-[52px]' : ''}>
        {currentPage === 'home'    && <HomePage user={user} onNavigate={navigate} />}
        {currentPage === 'ads'     && <AdsPage user={user} onWatchAd={watchAd} />}
        {currentPage === 'shop'    && <ShopPage user={user} authToken={authToken} onExchange={exchangeJPYC} onConnectWallet={connectWallet} onDisconnectWallet={disconnectWallet} />}
        {currentPage === 'history' && <HistoryPage user={user} />}
        {currentPage === 'profile' && <ProfilePage user={user} onNavigate={navigate} />}
        {currentPage === 'terms'   && <TermsPage onBack={() => navigate('profile')} />}
        {currentPage === 'privacy' && <PrivacyPage onBack={() => navigate('profile')} />}
      </main>

      {isNavPage && (
        <BottomNav currentPage={currentPage} onNavigate={navigate} />
      )}
    </div>
  );
}
