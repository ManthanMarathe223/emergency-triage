import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { TriagePage } from './pages/TriagePage';
import { PortalPage } from './pages/PortalPage';
import { RegisterHospitalPage } from './pages/RegisterHospitalPage';
import { HospitalLoginPage } from './pages/HospitalLoginPage';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<TriagePage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/register" element={<RegisterHospitalPage />} />
          <Route path="/login" element={<HospitalLoginPage />} />
        </Routes>
      </main>
      <footer className="border-t border-white/5 bg-slate-950/40 px-6 py-2.5 text-center text-xs text-slate-400">
        Emergency Triage & Hospital Telemetry System · Pune & PCMC Metropolitan Healthcare Network · Built for rapid clinical decision support.
      </footer>
    </div>
  );
}
