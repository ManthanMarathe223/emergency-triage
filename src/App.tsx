import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { TriagePage } from './pages/TriagePage';
import { PortalPage } from './pages/PortalPage';
import { RegisterHospitalPage } from './pages/RegisterHospitalPage';
import { HospitalLoginPage } from './pages/HospitalLoginPage';

export default function App() {
  return (
    <div className="flex h-full flex-col bg-app text-primary transition-colors">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<TriagePage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/register" element={<RegisterHospitalPage />} />
          <Route path="/login" element={<HospitalLoginPage />} />
        </Routes>
      </main>
      <footer className="border-t border-app bg-surface px-6 py-2.5 text-center text-xs text-secondary">
        AI-LifeLink Emergency Triage System · Pune & PCMC Clinical Decision Support Platform
      </footer>
    </div>
  );
}
