import React from 'react';
import { 
  ArrowLeft, 
  Bell, 
  MapPin, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface CustomerMobileHeaderProps {
  screenTitle?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  greeting?: string;
  serviceAddress?: string;
  onAddressClick?: () => void;
  isHomeScreen?: boolean;
}

export const CustomerMobileHeader: React.FC<CustomerMobileHeaderProps> = ({
  screenTitle = 'HelpDesk',
  canGoBack = false,
  onGoBack,
  onOpenNotifications,
  onOpenProfile,
  greeting = 'Good day',
  serviceAddress = 'Colombo 03',
  onAddressClick,
  isHomeScreen = false
}) => {
  const { user, unreadCount } = useAuth();

  return (
    <header className="bg-slate-900 text-white px-4 pt-3 pb-3 border-b border-slate-800 shadow-sm shrink-0 z-10 select-none">
      {isHomeScreen ? (
        // ===== Home Screen Header =====
        <div className="flex items-center justify-between gap-3">
          {/* Left: User greeting & Location */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0 hover:ring-2 hover:ring-blue-400 transition"
              title="Open Profile"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </button>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                {greeting}
              </span>
              <button
                onClick={onAddressClick}
                className="flex items-center gap-1 text-xs font-bold text-white hover:text-blue-300 transition text-left group"
                title="Change Service Address"
              >
                <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate max-w-[170px] xs:max-w-[210px]">{serviceAddress}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0" />
              </button>
            </div>
          </div>

          {/* Right: Notifications */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        // ===== Sub-screen Navigation Header =====
        <div className="flex items-center justify-between gap-2">
          {/* Back button or placeholder */}
          <div className="w-9 flex items-center">
            {canGoBack && onGoBack ? (
              <button
                type="button"
                onClick={onGoBack}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-sm font-bold text-white tracking-tight text-center truncate flex-1">
            {screenTitle}
          </h2>

          {/* Right Action */}
          <div className="w-9 flex justify-end">
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
