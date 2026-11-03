import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { BottomNav } from '@/components/BottomNav';
import { PinLock, ToastHost } from '@/components/feedback';
import { HomeScreen } from '@/screens/HomeScreen';
import { ImportScreen } from '@/screens/ImportScreen';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { VaultScreen } from '@/screens/VaultScreen';
import { DocumentDetailScreen } from '@/screens/DocumentDetailScreen';
import { DeadlinesScreen } from '@/screens/DeadlinesScreen';
import { DeadlineDetailScreen } from '@/screens/DeadlineDetailScreen';
import { ActionsScreen } from '@/screens/ActionsScreen';
import { ActionDetailScreen } from '@/screens/ActionDetailScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { NotFoundScreen } from '@/screens/NotFoundScreen';

/**
 * EKEA — coquille applicative
 *
 * HashRouter est utilisé pour que l’application fonctionne aussi lorsqu’elle est
 * publiée dans un sous-dossier (GitHub Pages, par exemple), sans configuration
 * de réécriture côté serveur.
 */
function Shell() {
  const { profile, ready } = useStore();
  const [unlocked, setUnlocked] = useState(!profile.security.pinEnabled);

  useEffect(() => {
    if (ready) setUnlocked(!profile.security.pinEnabled);
    // L’état initial suffit : le verrou ne se referme pas pendant la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ivory">
        <span className="font-display text-[20px] text-sage">EKEA</span>
      </div>
    );
  }

  if (profile.security.pinEnabled && !unlocked) {
    return (
      <>
        <PinLock onUnlock={() => setUnlocked(true)} />
        <ToastHost />
      </>
    );
  }

  return (
    <>
      <main className="min-h-dvh">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/documents" element={<VaultScreen />} />
          <Route path="/documents/:id" element={<DocumentDetailScreen />} />
          <Route path="/ajouter" element={<ImportScreen />} />
          <Route path="/analyse/:id" element={<AnalysisScreen />} />
          <Route path="/revue/:id" element={<ReviewScreen />} />
          <Route path="/echeances" element={<DeadlinesScreen />} />
          <Route path="/echeances/:id" element={<DeadlineDetailScreen />} />
          <Route path="/actions" element={<ActionsScreen />} />
          <Route path="/actions/:id" element={<ActionDetailScreen />} />
          <Route path="/profil" element={<ProfileScreen />} />
          <Route path="/accueil" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </main>
      <BottomNav />
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
