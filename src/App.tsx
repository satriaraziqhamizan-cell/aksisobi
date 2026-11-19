import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MyPlantSearchPage } from './pages/MyPlantSearchPage';
import { PlantJourneyPage } from './pages/PlantJourneyPage';
import { PlantCatalogPage } from './pages/PlantCatalogPage';
import { EventsPage } from './pages/EventsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/my-plant" element={<MyPlantSearchPage />} />
        <Route path="/plant/:plantId" element={<PlantJourneyPage />} />
        <Route path="/plants" element={<PlantCatalogPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<EventsPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
