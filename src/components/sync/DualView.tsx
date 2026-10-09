import React, { useState } from 'react';
import { CustomerApp } from '../customer/CustomerApp';
import { ProviderApp } from '../provider/ProviderApp';
import { useAuth } from '../../context/AuthContext';
import { 
  SplitSquareVertical, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Briefcase,
  Play
} from 'lucide-react';
import { api } from '../../services/api';

export const DualView: React.FC = () => {
  const { switchDemoAccount } = useAuth();
  const [syncedBookingId, setSyncedBookingId] = useState<string | null>(null);
  const [isSeedingQuickFlow, setIsSeedingQuickFlow] = useState(false);

  // Quick helper to seed an interactive booking right at step 1 for testing
  const handleSeedQuickFlow = async () => {
    setIsSeedingQuickFlow(true);
    try {
      // Login as customer Dinuka
      await switchDemoAccount('customer-dinuka');
      
      const newBooking = await api.createServiceRequest({
        categoryId: 'cat-plumbing',
        title: 'Emergency bathroom pipe burst in Kollupitiya',
        description: 'Main copper supply valve has split open and spraying water over the floor. Need urgent master plumber.',
        urgency: 'EMERGENCY',
        address: '45/2 Galle Road, Kollupitiya',
        city: 'Colombo 03',
        district: 'Colombo',
        preferredDate: '2026-10-09',
        preferredTime: 'Immediate'
      });

      setSyncedBookingId(newBooking.id);
      alert(`Created test emergency request: ${newBooking.bookingReference}! Watch it appear on the Provider radar on the right.`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSeedingQuickFlow(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-4 space-y-4">
      
      {/* Top Banner explaining the dual sync simulation */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white">
                Interactive Dual-Device Live Synchronization Mode
              </h2>
              <span className="text-[10px] font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full">
                REAL-TIME PERSISTENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interact between Customer (left) and Service Provider (right) against the shared PostgreSQL & Express backend.
            </p>
          </div>
        </div>

        {/* Quick Lifecycle Trigger Button */}
        <button
          onClick={handleSeedQuickFlow}
          disabled={isSeedingQuickFlow}
          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>{isSeedingQuickFlow ? 'Dispatching...' : 'Create Quick Emergency Request'}</span>
        </button>
      </div>

      {/* 19-Step Acceptance Flow Guide Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs overflow-x-auto gap-2">
        <span className="font-bold text-slate-900 shrink-0 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Acceptance Lifecycle:
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 shrink-0">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">1. Customer Submits</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">2. Provider Accepts</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">3. Start Journey</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">4. Start Work</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">5. Submit Invoice</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold">6. Customer Confirms & Rates</span>
        </div>
      </div>

      {/* Side-by-Side Dual View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Customer App Device */}
        <div className="flex flex-col items-center">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Customer Mobile App (Client Perspective)</span>
          </div>
          <div className="w-full">
            <CustomerApp 
              initialBookingId={syncedBookingId} 
              onClearInitialBooking={() => setSyncedBookingId(null)} 
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Service Provider App Device */}
        <div className="flex flex-col items-center">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>Service Provider Mobile App (Technician Radar)</span>
          </div>
          <div className="w-full">
            <ProviderApp initialBookingId={syncedBookingId} />
          </div>
        </div>

      </div>

    </div>
  );
};
