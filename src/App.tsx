import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, DEMO_ACCOUNTS } from './context/AuthContext';
import { CustomerApp } from './components/customer/CustomerApp';
import { ProviderApp } from './components/provider/ProviderApp';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DualView } from './components/sync/DualView';
import { WelcomeScreen } from './components/common/WelcomeScreen';
import { MobileAppContainer } from './components/mobile/MobileAppContainer';
import { 
  Smartphone, 
  Briefcase, 
  ShieldCheck, 
  SplitSquareVertical, 
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import { api } from './services/api';

export type ActivePanel = 'welcome' | 'customer' | 'provider' | 'admin' | 'sync';

function AppContent() {
  const { user, providerProfile, isLoading, switchDemoAccount, refreshMe } = useAuth();
  const [activePanel, setActivePanel] = useState<ActivePanel>('customer');
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  
  // Floating dev controls state (strictly desktop backdrop only)
  const [isDevToolbarExpanded, setIsDevToolbarExpanded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleRolePerspectiveSelected = (role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') => {
    if (role === 'ADMIN') setActivePanel('admin');
    else if (role === 'PROVIDER') setActivePanel('provider');
    else setActivePanel('customer');
  };

  const handleResetData = async () => {
    if (!confirm('Reset all HelpDesk database records back to pristine initial state?')) return;
    setIsResetting(true);
    try {
      await api.resetDemoData();
      await refreshMe();
      alert('Database successfully reset to pristine seed state!');
      window.location.reload();
    } catch (err: any) {
      alert('Reset error: ' + err.message);
    } finally {
      setIsResetting(false);
    }
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
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white relative">
      
      {/* 
        NO application-level website header rendered above the mobile screens! 
        The mobile apps start directly with their native mobile interfaces.
      */}

      {/* Main Panel Viewport */}
      <main className="flex-1 w-full">
        {activePanel === 'welcome' && (
          <MobileAppContainer appName="HelpDesk Sri Lanka" deviceTheme="dark">
            <WelcomeScreen
              onSelectRolePerspective={handleRolePerspectiveSelected}
              onOpenAdminPortal={() => setActivePanel('admin')}
            />
          </MobileAppContainer>
        )}

        {activePanel === 'customer' && (
          <MobileAppContainer appName="HelpDesk Customer" deviceTheme="dark">
            <CustomerApp
              initialBookingId={targetBookingId}
              onClearInitialBooking={() => setTargetBookingId(null)}
              onSwitchToProviderMode={() => setActivePanel('provider')}
              onOpenAdminPortal={() => setActivePanel('admin')}
            />
          </MobileAppContainer>
        )}

        {activePanel === 'provider' && (
          <MobileAppContainer appName="HelpDesk Partner" deviceTheme="dark">
            <ProviderApp
              initialBookingId={targetBookingId}
              onSwitchToCustomerMode={() => setActivePanel('customer')}
              onOpenAdminPortal={() => setActivePanel('admin')}
            />
          </MobileAppContainer>
        )}

        {activePanel === 'admin' && (
          <AdminDashboard 
            onOpenMobileApp={() => setActivePanel('customer')}
          />
        )}

        {activePanel === 'sync' && (
          <DualView />
        )}
      </main>

      {/* 
        Discreet, external development preview switcher:
        Positioned strictly on desktop viewport backdrop (fixed bottom-3 right-3), 
        completely outside the mobile phone container.
      */}
      <aside 
        aria-label="Development preview toolbar"
        className="fixed bottom-3 right-3 z-50 hidden sm:flex flex-col items-end gap-1.5 pointer-events-auto"
      >
        {isDevToolbarExpanded && (
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl space-y-2 text-xs w-64 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-extrabold text-[11px] text-slate-300 uppercase tracking-wider">
                Dev Preview Switcher
              </span>
              <button 
                onClick={() => setIsDevToolbarExpanded(false)}
                className="text-slate-400 hover:text-white"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel Selector */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { setActivePanel('customer'); setTargetBookingId(null); }}
                className={`py-1.5 px-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  activePanel === 'customer' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>Customer</span>
              </button>

              <button
                onClick={() => { setActivePanel('provider'); setTargetBookingId(null); }}
                className={`py-1.5 px-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  activePanel === 'provider' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                <span>Provider</span>
              </button>

              <button
                onClick={() => { setActivePanel('admin'); setTargetBookingId(null); }}
                className={`py-1.5 px-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  activePanel === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Web</span>
              </button>

              <button
                onClick={() => { setActivePanel('sync'); setTargetBookingId(null); }}
                className={`py-1.5 px-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  activePanel === 'sync' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
                <span>Dual Sync</span>
              </button>
            </div>

            {/* Quick Test Account Switcher */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Quick Demo User:</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={async () => {
                    await switchDemoAccount('customer-dinuka');
                    setActivePanel('customer');
                  }}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-blue-900/60 text-slate-200 rounded-lg text-[10px] font-semibold truncate text-center"
                  title="Dinuka (Customer)"
                >
                  Dinuka (Cust)
                </button>
                <button
                  onClick={async () => {
                    await switchDemoAccount('provider-kasun');
                    setActivePanel('provider');
                  }}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-teal-900/60 text-slate-200 rounded-lg text-[10px] font-semibold truncate text-center"
                  title="Kasun (Approved Plumber)"
                >
                  Kasun (Pro)
                </button>
                <button
                  onClick={async () => {
                    await switchDemoAccount('admin-dilrukshi');
                    setActivePanel('admin');
                  }}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-purple-900/60 text-slate-200 rounded-lg text-[10px] font-semibold truncate text-center"
                  title="Dilrukshi (Admin)"
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Reset Database Button */}
            <div className="pt-1 border-t border-slate-800">
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="w-full py-1 text-[10px] text-slate-400 hover:text-red-300 flex items-center justify-center gap-1 transition"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin text-red-400' : ''}`} />
                <span>{isResetting ? 'Resetting DB...' : 'Reset Demo Data'}</span>
              </button>
            </div>
          </div>
        )}

        {!isDevToolbarExpanded && (
          <button
            onClick={() => setIsDevToolbarExpanded(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700/80 shadow-lg backdrop-blur-xs transition active:scale-95"
            title="Open Developer Preview Switcher"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-300">
              Preview: <strong className="text-white capitalize">{activePanel}</strong>
            </span>
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </aside>

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
