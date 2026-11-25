import { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlantDataProvider } from './context/PlantDataContext';
import { HomePage } from './pages/HomePage';
import { MyPlantSearchPage } from './pages/MyPlantSearchPage';
import { PlantJourneyPage } from './pages/PlantJourneyPage';
import { PlantCatalogPage } from './pages/PlantCatalogPage';
import { EventsPage } from './pages/EventsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { extractPlantIdFromScan } from './utils/qrLinks';

function ScrollManager() {
  const { pathname, hash, search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Jika pengguna datang membawa ?plant=SB26-0001 / ?id=SB26-0001 atau #/plant/SB26-0001,
    // langsung arahkan ke halaman unik milik masing-masing peserta.
    const params = new URLSearchParams(search);
    const paramCandidate =
      params.get('plant') || params.get('id') || params.get('code') || '';
    if (paramCandidate && !pathname.startsWith('/plant/')) {
      const extracted = extractPlantIdFromScan(paramCandidate);
      if (extracted) {
        navigate(`/plant/${encodeURIComponent(extracted)}`, { replace: true });
        return;
      }
    }

    if (hash && hash.startsWith('#/plant/')) {
      const extracted = extractPlantIdFromScan(hash);
      if (extracted) {
        navigate(`/plant/${encodeURIComponent(extracted)}`, { replace: true });
        return;
      }
    }

    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash, search, navigate]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlantDataProvider>
        <BrowserRouter>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-plant" element={<MyPlantSearchPage />} />
            <Route path="/plant/:plantId" element={<PlantJourneyPage />} />
            <Route path="/plants" element={<PlantCatalogPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventsPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </PlantDataProvider>
    </ErrorBoundary>
  );
}
