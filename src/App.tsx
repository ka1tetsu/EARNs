import { useState, useCallback } from 'react';
import { BottomNav } from './components/BottomNav';
import { BannerAd, ADSENSE_ENABLED } from './components/BannerAd';
import { HomePage } from './pages/HomePage';
import { AdsPage } from './pages/AdsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useStore } from './store/useStore';

type Page = 'home' | 'ads' | 'history' | 'profile' | 'terms' | 'privacy';
const NAV_PAGES: Page[] = ['home', 'ads', 'history', 'profile'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { user, watchAd } = useStore();

  const navigate = useCallback((page: string) => {
    setCurrentPage(page as Page);
  }, []);

  const isNavPage = NAV_PAGES.includes(currentPage);
  const showBanner = isNavPage && ADSENSE_ENABLED;

  return (
    <div className="min-h-screen bg-gray-50 w-full relative">

      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto">
          <BannerAd />
        </div>
      )}

      <main className={showBanner ? 'pt-[60px]' : ''}>
        {currentPage === 'home'    && <HomePage user={user} onNavigate={navigate} />}
        {currentPage === 'ads'     && <AdsPage user={user} onWatchAd={watchAd} />}
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
