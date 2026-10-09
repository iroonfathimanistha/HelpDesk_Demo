import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationHeader, ActivePanel } from './components/common/NavigationHeader';
import { CustomerApp } from './components/customer/CustomerApp';
import { ProviderApp } from './components/provider/ProviderApp';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DualView } from './components/sync/DualView';

function AppContent() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('customer');
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);

  const handleSelectBookingFromNotif = (bookingId: string) => {
    setTargetBookingId(bookingId);
    setActivePanel('customer');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Universal Platform Header with Panel Switcher & Demo Account Switcher */}
      <NavigationHeader
        activePanel={activePanel}
        onSelectPanel={(panel) => {
          setActivePanel(panel);
          setTargetBookingId(null);
        }}
        onSelectBooking={handleSelectBookingFromNotif}
      />

      {/* Main Panel Viewport */}
      <main className="flex-1 w-full">
        {activePanel === 'customer' && (
          <CustomerApp
            initialBookingId={targetBookingId}
            onClearInitialBooking={() => setTargetBookingId(null)}
          />
        )}

        {activePanel === 'provider' && (
          <ProviderApp
            initialBookingId={targetBookingId}
          />
        )}

        {activePanel === 'admin' && (
          <AdminDashboard />
        )}

        {activePanel === 'sync' && (
          <DualView />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="py-3 px-4 bg-slate-900 text-slate-400 text-center text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 HelpDesk Platform (Sri Lanka). Skilled Help, Right When You Need It.</p>
          <p className="text-[11px] text-slate-500">
            Colombo • Kandy • Gampaha • Galle | Full-stack PostgreSQL, Express & Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
