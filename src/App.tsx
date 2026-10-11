import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationHeader, ActivePanel } from './components/common/NavigationHeader';
import { CustomerApp } from './components/customer/CustomerApp';
import { ProviderApp } from './components/provider/ProviderApp';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DualView } from './components/sync/DualView';
import { WelcomeScreen } from './components/common/WelcomeScreen';

function AppContent() {
  const { user, providerProfile, isLoading } = useAuth();
  const [activePanel, setActivePanel] = useState<ActivePanel>('customer');
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);

  // Sync activePanel with authenticated user's actual role / activeRole on bootstrap or login
  useEffect(() => {
    if (!user) {
      // If not logged in, default to welcome screen
      setActivePanel('welcome');
    } else {
      const effectiveRole = user.activeRole || user.role;
      if (effectiveRole === 'ADMIN') {
        setActivePanel('admin');
      } else if (effectiveRole === 'PROVIDER') {
        setActivePanel('provider');
      } else {
        setActivePanel('customer');
      }
    }
  }, [user?.id, user?.activeRole, user?.role]);

  const handleSelectBookingFromNotif = (bookingId: string) => {
    setTargetBookingId(bookingId);
    setActivePanel('customer');
  };

  const handleRolePerspectiveSelected = (role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') => {
    if (role === 'ADMIN') setActivePanel('admin');
    else if (role === 'PROVIDER') setActivePanel('provider');
    else setActivePanel('customer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center animate-pulse mb-3 shadow-lg shadow-blue-500/30">
          <span className="font-extrabold text-lg">HD</span>
        </div>
        <h2 className="text-base font-bold">Restoring HelpDesk Session...</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying authenticated role and permissions</p>
      </div>
    );
  }

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
        {activePanel === 'welcome' && (
          <WelcomeScreen
            onSelectRolePerspective={handleRolePerspectiveSelected}
            onOpenAdminPortal={() => setActivePanel('admin')}
          />
        )}

        {activePanel === 'customer' && (
          <CustomerApp
            initialBookingId={targetBookingId}
            onClearInitialBooking={() => setTargetBookingId(null)}
            onSwitchToProviderMode={() => setActivePanel('provider')}
          />
        )}

        {activePanel === 'provider' && (
          <ProviderApp
            initialBookingId={targetBookingId}
            onSwitchToCustomerMode={() => setActivePanel('customer')}
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
