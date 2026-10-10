import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { TriagePage } from './pages/TriagePage';
import { PortalPage } from './pages/PortalPage';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <div className="aurora" aria-hidden><i /><i /><i /></div>
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        <Routes>
          <Route path="/" element={<TriagePage />} />
          <Route path="/portal" element={<PortalPage />} />
        </Routes>
      </main>
      <footer className="px-6 py-2 text-center text-xs text-slate-500">
        Decision-support prototype with simulated hospital data. A qualified medical professional makes every clinical decision.
      </footer>
    </div>
  );
}
