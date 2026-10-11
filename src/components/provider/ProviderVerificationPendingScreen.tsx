import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionButton } from '../common/ActionButton';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  User as UserIcon, 
  RotateCw,
  Phone,
  Briefcase
} from 'lucide-react';

interface Props {
  onBackToCustomerMode?: () => void;
}

export const ProviderVerificationPendingScreen: React.FC<Props> = ({ onBackToCustomerMode }) => {
  const { user, providerProfile, refreshMe, logout, switchMode } = useAuth();
  
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [nationalIdUrl, setNationalIdUrl] = useState(providerProfile?.nationalIdUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80');
  const [certificateUrl, setCertificateUrl] = useState(providerProfile?.certificateUrl || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80');
  const [policeReportUrl, setPoliceReportUrl] = useState(providerProfile?.policeReportUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80');
  const [experienceYears, setExperienceYears] = useState(providerProfile?.experienceYears || 3);
  const [bio, setBio] = useState(providerProfile?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const status = providerProfile?.verificationStatus || 'PENDING_VERIFICATION';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMe();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitProviderVerification({
        nationalIdUrl,
        certificateUrl,
        policeReportUrl,
        experienceYears: Number(experienceYears),
        bio
      });
      await refreshMe();
      setResubmitSuccess(true);
      setShowResubmitModal(false);
    } catch (err: any) {
      alert('Resubmission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Status Header */}
        <div className={`p-6 text-white text-center relative ${
          status === 'REJECTED'
            ? 'bg-gradient-to-br from-red-600 to-rose-700'
            : status === 'SUSPENDED'
            ? 'bg-gradient-to-br from-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-amber-600 to-orange-700'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            {status === 'REJECTED' ? (
              <XCircle className="w-8 h-8 text-white" />
            ) : status === 'SUSPENDED' ? (
              <AlertTriangle className="w-8 h-8 text-amber-300" />
            ) : (
              <Clock className="w-8 h-8 text-white animate-pulse" />
            )}
          </div>
          
          <h2 className="text-xl font-extrabold tracking-tight">
            {status === 'REJECTED'
              ? 'Verification Application Rejected'
              : status === 'SUSPENDED'
              ? 'Service Provider Account Suspended'
              : 'Verification Pending Review'}
          </h2>

          <p className="text-xs text-white/90 mt-1 max-w-sm mx-auto">
            {status === 'REJECTED'
              ? 'Your submitted trade credentials could not be verified by the HelpDesk compliance team.'
              : status === 'SUSPENDED'
              ? 'This provider profile has been temporarily suspended by administration.'
              : 'Our compliance team is verifying your National Identity Card and trade qualifications.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1">
          
          {/* Notes or Feedback from Admin */}
          {providerProfile?.verificationNotes && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              status === 'REJECTED'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4" />
                <span>Administrative Notes:</span>
              </div>
              <p>{providerProfile.verificationNotes}</p>
            </div>
          )}

          {/* Profile Overview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Submitted Professional Profile
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Technician Name</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Registered Business</span>
                <span className="font-semibold text-slate-900">{providerProfile?.businessName || 'Independent Pro'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Primary Experience</span>
                <span className="font-semibold text-slate-900">{providerProfile?.experienceYears || 1} Years</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Application Status</span>
                <span className={`font-bold inline-block px-2 py-0.5 rounded-full text-[10px] ${
                  status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">Review Checklist (Admin SLA: ~2 Hours):</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>National Identity Card (NIC) front & back check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Police clearance certificate or reference validation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Technical trade certificate (CEB, NAITA, NVQ, etc.)</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <ActionButton
              type="button"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingLabel="Checking status..."
              label="Check Verification Status"
              variant="outline"
              size="md"
              icon={<RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            />

            {(status === 'REJECTED' || status === 'PENDING_VERIFICATION') && (
              <button
                type="button"
                onClick={() => setShowResubmitModal(true)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Update & Resubmit Verification Documents</span>
              </button>
            )}

            {/* If user also has Customer mode authorization, allow switching */}
            {(user?.roles?.includes('CUSTOMER') || user?.role === 'CUSTOMER') && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await switchMode('CUSTOMER');
                    if (onBackToCustomerMode) onBackToCustomerMode();
                  } catch (err: any) {
                    alert('Switch mode error: ' + err.message);
                  }
                }}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Switch to Customer Mode (Book Services)</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 text-slate-500 hover:text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of HelpDesk</span>
            </button>
          </div>

        </div>

      </div>

      {/* Resubmit Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Resubmit Verification Documents</h3>
              <button onClick={() => setShowResubmitModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleResubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">National ID Document Photo URL</label>
                <input
                  type="url"
                  value={nationalIdUrl}
                  onChange={(e) => setNationalIdUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Trade Certificate / NVQ URL</label>
                <input
                  type="url"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Police Clearance Report URL</label>
                <input
                  type="url"
                  value={policeReportUrl}
                  onChange={(e) => setPoliceReportUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Years of Practical Experience</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Clarification Notes for Admin</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Explain your qualification details or uploaded files..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
