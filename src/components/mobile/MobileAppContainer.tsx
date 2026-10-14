import React from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';

interface MobileAppContainerProps {
  children: React.ReactNode;
  appName?: string;
  deviceTheme?: 'light' | 'dark';
}

export const MobileAppContainer: React.FC<MobileAppContainerProps> = ({
  children,
  appName = 'HelpDesk Mobile',
  deviceTheme = 'dark'
}) => {
  return (
    <div className="w-full flex justify-center items-center py-0 sm:py-3 px-0 sm:px-4 bg-slate-100 min-h-screen">
      {/* Smartphone Device Frame */}
      <div className="w-full max-w-md h-screen sm:h-[860px] sm:max-h-[96vh] bg-slate-900 sm:rounded-[38px] sm:border-[5px] sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative sm:ring-8 sm:ring-slate-900/10 transition-all">
        
        {/* Device Top Speaker Slit & Status Bar */}
        <div className="shrink-0 relative">
          {/* Subtle phone speaker slit on hardware bezel */}
          <div className="hidden sm:block absolute top-1 left-1/2 -translate-x-1/2 w-14 h-1 bg-slate-700 rounded-full z-30" />
          <AndroidStatusBar theme={deviceTheme} carrier="HelpDesk 5G" />
        </div>

        {/* Screen Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
          {children}
        </div>

        {/* Native Android / iOS Bottom Home Pill Bar */}
        <div className="bg-slate-900 py-1 flex items-center justify-center shrink-0 z-20">
          <div className="w-28 h-1 bg-slate-600/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
