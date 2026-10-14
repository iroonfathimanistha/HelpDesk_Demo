import React from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  User as UserIcon,
  Power
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ProviderMobileHeaderProps {
  screenTitle?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  isDashboard?: boolean;
}

export const ProviderMobileHeader: React.FC<ProviderMobileHeaderProps> = ({
  screenTitle,
  canGoBack = false,
  onGoBack,
  onOpenNotifications,
  onOpenProfile,
  isOnline = false,
  onToggleOnline,
  isDashboard = true
}) => {
  const { user, providerProfile } = useAuth();
  const isApproved = providerProfile?.verificationStatus === 'APPROVED';

  return (
    <header className="bg-slate-900 text-white px-4 pt-3 pb-3 border-b border-slate-800 shadow-sm shrink-0 z-10 select-none">
      {isDashboard ? (
        // ===== Provider Dashboard Top Bar =====
        <div className="flex items-center justify-between gap-3">
          {/* Left: Provider Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0 hover:ring-2 hover:ring-teal-400 transition"
              title="Open Provider Profile"
            >
              PRO
            </button>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                HelpDesk Partner
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                {user?.name || 'Technician'}
                {isApproved && (
                  <span title="Verified Technician" className="inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right: Online / Offline Availability Toggle */}
          <button
            type="button"
            onClick={onToggleOnline}
            disabled={!isApproved}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border shrink-0 active:scale-95 ${
              isOnline && isApproved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            } ${!isApproved ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isApproved ? (isOnline ? 'Go Offline' : 'Go Online') : 'Account verification required'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline && isApproved ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] font-extrabold tracking-wide">
              {isOnline && isApproved ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
        </div>
      ) : (
        // ===== Provider Sub-screen Header =====
        <div className="flex items-center justify-between gap-2">
          {/* Back button */}
          <div className="w-9 flex items-center">
            {canGoBack && onGoBack ? (
              <button
                type="button"
                onClick={onGoBack}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-sm font-bold text-white tracking-tight text-center truncate flex-1">
            {screenTitle || 'Provider Console'}
          </h2>

          {/* Right: Online mini status pill */}
          <div className="w-9 flex justify-end">
            <span 
              className={`w-2.5 h-2.5 rounded-full mt-1 ${isOnline && isApproved ? 'bg-emerald-400' : 'bg-slate-600'}`} 
              title={isOnline && isApproved ? 'You are Online' : 'You are Offline'}
            />
          </div>
        </div>
      )}
    </header>
  );
};
