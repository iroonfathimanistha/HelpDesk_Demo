import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { NotificationsModal } from './NotificationsModal';
import { 
  Wrench, 
  Smartphone, 
  Briefcase, 
  Shield, 
  SplitSquareVertical, 
  Bell, 
  ChevronDown, 
  UserCheck, 
  RotateCcw,
  LogOut,
  MapPin,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export type ActivePanel = 'customer' | 'provider' | 'admin' | 'sync';

interface Props {
  activePanel: ActivePanel;
  onSelectPanel: (panel: ActivePanel) => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const NavigationHeader: React.FC<Props> = ({ activePanel, onSelectPanel, onSelectBooking }) => {
  const { user, providerProfile, logout, switchDemoAccount, unreadCount, refreshMe } = useAuth();
  const [showAccountsDropdown, setShowAccountsDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (!confirm('Reset all demo data back to default initial state?')) return;
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

  const handleSwitchAccount = async (id: string) => {
    setShowAccountsDropdown(false);
    await switchDemoAccount(id);
    const acc = DEMO_ACCOUNTS.find(a => a.id === id);
    if (acc) {
      if (acc.role === 'CUSTOMER' && activePanel === 'admin') {
        onSelectPanel('customer');
      } else if (acc.role === 'PROVIDER' && activePanel === 'admin') {
        onSelectPanel('provider');
      } else if (acc.role === 'ADMIN') {
        onSelectPanel('admin');
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-teal-500 flex items-center justify-center shadow-md shadow-blue-900/50">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  HelpDesk
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SRI LANKA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Skilled Help, Right When You Need It.
              </p>
            </div>
          </div>

          {/* Panel Switcher (The 3 connected panels + dual sync view) */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => onSelectPanel('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activePanel === 'customer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>

            <button
              onClick={() => onSelectPanel('provider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activePanel === 'provider'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Provider App</span>
            </button>

            <button
              onClick={() => onSelectPanel('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activePanel === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => onSelectPanel('sync')}
              title="Interactive Side-by-Side Customer & Provider View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activePanel === 'sync'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-300 hover:text-teal-200 hover:bg-slate-700/50'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dual Live Sync</span>
              <span className="md:hidden">Dual</span>
            </button>
          </div>

          {/* User Controls & Demo Switcher */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Quick Demo Account Selector */}
            <div className="relative">
              <button
                onClick={() => setShowAccountsDropdown(!showAccountsDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-white leading-tight truncate max-w-[110px]">
                    {user?.name || 'Select Account'}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user?.role || 'Guest'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showAccountsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Quick Switch Test Account</span>
                    <span className="text-[10px] text-blue-400">One-Click</span>
                  </div>

                  <div className="divide-y divide-slate-700/50 py-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user?.email === acc.email;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => handleSwitchAccount(acc.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                            isCurrent
                              ? 'bg-blue-600/20 border border-blue-500/30'
                              : 'hover:bg-slate-700/60'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            acc.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                            acc.role === 'PROVIDER' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {acc.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-white truncate">
                                {acc.name}
                              </span>
                              {isCurrent && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-blue-400 block truncate">
                              {acc.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {acc.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Reset Seed Button */}
                  <div className="pt-2 mt-1 border-t border-slate-700 flex items-center justify-between px-1">
                    <button
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1.5 p-1 rounded transition"
                      title="Reset database to initial demo records"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                      Reset Demo Data
                    </button>
                    <button
                      onClick={() => { setShowAccountsDropdown(false); logout(); }}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 p-1 rounded transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        onSelectBooking={onSelectBooking}
      />
    </>
  );
};
