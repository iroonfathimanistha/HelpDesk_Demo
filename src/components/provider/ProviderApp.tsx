import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceRequest, ProviderProfile, ServiceCategory } from '../../types';
import { 
  Radar, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  DollarSign, 
  ShieldCheck, 
  Star, 
  Phone, 
  Navigation, 
  Play, 
  Check, 
  Camera, 
  ArrowRight,
  Briefcase,
  History,
  User as UserIcon,
  RefreshCw,
  ExternalLink,
  X,
  FileText,
  Calendar,
  Settings,
  Plus,
  Send,
  MessageSquare,
  HelpCircle,
  Eye,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcons';
import { ActionButton } from '../common/ActionButton';

interface Props {
  initialBookingId?: string | null;
}

export type ProviderTab = 'dashboard' | 'requests' | 'jobs' | 'earnings' | 'profile';

export const ProviderApp: React.FC<Props> = ({ initialBookingId }) => {
  const { user, providerProfile, refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState<ProviderTab>('dashboard');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [incomingJobs, setIncomingJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(providerProfile?.isOnline ?? true);
  const [loading, setLoading] = useState(false);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filter for Job Requests Inbox tab
  const [requestsFilter, setRequestsFilter] = useState<'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED'>('NEW');

  // Completion modal form states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [laborCharges, setLaborCharges] = useState<number>(2000);
  const [materialCosts, setMaterialCosts] = useState<number>(1500);
  const [additionalCostNotes, setAdditionalCostNotes] = useState<string>('Replacement parts and fittings');
  const [completionNotes, setCompletionNotes] = useState<string>('Repairs completed according to standard codes. System inspected and tested.');
  const [completionPhoto, setCompletionPhoto] = useState<string>('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Propose extra charge modal states
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalAmount, setProposalAmount] = useState<number>(1500);
  const [proposalCategory, setProposalCategory] = useState<'MATERIALS' | 'EXTRA_LABOR' | 'UNFORESEEN_WORK'>('MATERIALS');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Pricing configuration modal in Profile tab
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingCategoryId, setPricingCategoryId] = useState('');
  const [configBaseCallout, setConfigBaseCallout] = useState(1500);
  const [configHourlyRate, setConfigHourlyRate] = useState(1200);
  const [configTravelFee, setConfigTravelFee] = useState(50);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Review response state
  const [respondingReviewId, setRespondingReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Provider Chat modal states
  const [showProviderChatModal, setShowProviderChatModal] = useState(false);
  const [providerChatMessages, setProviderChatMessages] = useState<any[]>([]);
  const [providerChatInput, setProviderChatInput] = useState('');
  const [isSendingProviderChat, setIsSendingProviderChat] = useState(false);

  const loadProviderChatMessages = async () => {
    if (!activeJob) return;
    try {
      const msgs = await api.getBookingMessages(activeJob.id);
      setProviderChatMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showProviderChatModal && activeJob) {
      loadProviderChatMessages();
      const timer = setInterval(() => {
        loadProviderChatMessages();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [showProviderChatModal, activeJob?.id]);

  const handleSendProviderMessage = async (customText?: string) => {
    const text = customText || providerChatInput;
    if (!activeJob || !text.trim() || isSendingProviderChat) return;
    setIsSendingProviderChat(true);
    try {
      const msg = await api.sendBookingMessage(activeJob.id, text.trim());
      setProviderChatMessages(prev => [...prev, msg]);
      setProviderChatInput('');
    } catch (err: any) {
      alert('Could not send message: ' + err.message);
    } finally {
      setIsSendingProviderChat(false);
    }
  };

  const loadProviderData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cats, incoming, assigned] = await Promise.all([
        api.getCategories(),
        api.getServiceRequests({ tab: 'incoming' }),
        api.getServiceRequests()
      ]);
      setCategories(cats);
      setIncomingJobs(incoming);
      setMyJobs(assigned);

      if (providerProfile) {
        const revs = await api.getProviderReviews(providerProfile.id).catch(() => []);
        setReviews(revs);
      }

      // Find current ongoing job
      const current = assigned.find(j => 
        ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(j.status)
      );

      if (current) {
        const details = await api.getServiceRequest(current.id);
        setActiveJob(details);
      } else {
        setActiveJob(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, [user, providerProfile?.verificationStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadProviderData();
    }, 4000);
    return () => clearInterval(timer);
  }, [user]);

  // Online / Offline toggle
  const handleToggleOnline = async () => {
    if (providerProfile?.verificationStatus !== 'APPROVED') {
      alert('You cannot go online until your account is approved by admin.');
      return;
    }
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await api.setProviderAvailability(nextState);
      await refreshMe();
    } catch (err: any) {
      alert('Could not update status: ' + err.message);
      setIsOnline(!nextState);
    }
  };

  // Atomic Accept Job
  const handleAcceptJob = async (jobId: string) => {
    if (providerProfile?.verificationStatus !== 'APPROVED') {
      alert('Unverified accounts cannot accept customer bookings.');
      return;
    }
    setAcceptingJobId(jobId);
    try {
      const res = await api.acceptServiceRequest(jobId);
      await loadProviderData();
      const details = await api.getServiceRequest(res.booking.id);
      setActiveJob(details);
      setActiveTab('jobs');
    } catch (err: any) {
      alert('Error accepting request: ' + err.message);
      await loadProviderData();
    } finally {
      setAcceptingJobId(null);
    }
  };

  // Lifecycle Progression Actions
  const handleUpdateStatus = async (targetStatus: any, note: string) => {
    if (!activeJob || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateServiceRequestStatus(activeJob.id, {
        status: targetStatus,
        note
      });
      setActiveJob(res.booking);
      await loadProviderData();
    } catch (err: any) {
      alert('Status update error: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Proposal for extra charge
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !proposalDescription || !proposalAmount) return;
    setIsSubmittingProposal(true);
    try {
      const res = await api.proposeAdditionalCost(activeJob.id, {
        description: proposalDescription,
        amountLkr: Number(proposalAmount),
        category: proposalCategory
      });
      setShowProposalModal(false);
      setProposalDescription('');
      setActiveJob(res.booking);
      alert('Additional cost proposal sent to customer for in-app approval!');
    } catch (err: any) {
      alert('Proposal error: ' + err.message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Complete Work submission
  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    setIsSubmittingCompletion(true);
    try {
      const res = await api.updateServiceRequestStatus(activeJob.id, {
        status: 'AWAITING_CUSTOMER_CONFIRMATION',
        note: 'Technician completed repairs and submitted final itemized invoice for customer sign-off.',
        laborChargesLkr: Number(laborCharges),
        materialCostsLkr: Number(materialCosts),
        additionalCostNotes,
        completionNotes,
        completionPhotos: completionPhoto ? [completionPhoto] : []
      });
      setShowCompletionModal(false);
      setActiveJob(res.booking);
      await loadProviderData();
      alert('Work marked completed and sent to customer for review and sign-off!');
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Save Pricing configuration
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingCategoryId) return;
    setIsSavingPricing(true);
    try {
      await api.updateProviderCategoryPricing({
        categoryId: pricingCategoryId,
        baseCalloutFeeLkr: Number(configBaseCallout),
        hourlyRateLkr: Number(configHourlyRate),
        travelFeePerKmLkr: Number(configTravelFee)
      });
      await refreshMe();
      setShowPricingModal(false);
      alert('Category pricing updated successfully!');
    } catch (err: any) {
      alert('Pricing error: ' + err.message);
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Respond to Review
  const handlePostReviewResponse = async (reviewId: string) => {
    if (!responseText) return;
    try {
      await api.respondToReview(reviewId, responseText);
      alert('Response posted!');
      setRespondingReviewId(null);
      setResponseText('');
      await loadProviderData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Earnings calculations
  const completedJobs = myJobs.filter(j => j.status === 'COMPLETED');
  const totalGrossLkr = completedJobs.reduce((sum, j) => sum + (j.totalAmountLkr || 0), 0);
  const totalCommissionLkr = completedJobs.reduce((sum, j) => sum + (j.platformCommissionLkr || 0), 0);
  const netPayoutLkr = totalGrossLkr - totalCommissionLkr;
  const todayJobs = completedJobs.filter(j => new Date(j.updatedAt).toDateString() === new Date().toDateString());
  const todayNetLkr = todayJobs.reduce((sum, j) => sum + ((j.totalAmountLkr || 0) - (j.platformCommissionLkr || 0)), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-4 px-2 sm:px-4">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh]">

        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 pt-4 pb-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-sm shadow-xs">
              PRO
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">HelpDesk Partner</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                {user?.name || 'Technician'}
                {providerProfile?.verificationStatus === 'APPROVED' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </span>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOnline}
              disabled={providerProfile?.verificationStatus !== 'APPROVED'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                isOnline && providerProfile?.verificationStatus === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                isOnline && providerProfile?.verificationStatus === 'APPROVED'
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-slate-500'
              }`} />
              <span>{isOnline && providerProfile?.verificationStatus === 'APPROVED' ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>

        {/* Verification Status Warning if pending */}
        {providerProfile?.verificationStatus === 'PENDING_VERIFICATION' && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-start gap-2.5 text-xs font-medium shadow-inner shrink-0">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Pending Administrative Review: </strong>
              Your national ID and credentials are currently being inspected by Admin. You cannot go online or accept bookings until approved.
            </div>
          </div>
        )}

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="p-4 space-y-4">
              
              {/* Today's Metrics Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Today's Net</span>
                  <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                    Rs. {todayNetLkr.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rating</span>
                  <span className="text-sm font-extrabold text-amber-600 flex items-center justify-center gap-0.5 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {providerProfile?.rating || 'New'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Completed</span>
                  <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                    {completedJobs.length} Jobs
                  </span>
                </div>
              </div>

              {/* Active Ongoing Job Card */}
              {activeJob && (
                <div 
                  onClick={() => setActiveTab('jobs')}
                  className="bg-gradient-to-r from-teal-700 to-emerald-900 text-white p-4 rounded-3xl shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                        Current Job ({activeJob.status.replace(/_/g, ' ')})
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-[190px]">
                        {activeJob.title}
                      </h4>
                      <p className="text-[11px] text-teal-100">{activeJob.address}, {activeJob.city}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition flex items-center gap-2.5"
                  >
                    <Radar className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Job Radar</span>
                      <span className="text-[10px] text-slate-500">{incomingJobs.length} new requests</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition flex items-center gap-2.5"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">View Earnings</span>
                      <span className="text-[10px] text-slate-500">Rs. {netPayoutLkr.toLocaleString()} net</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const firstCat = providerProfile?.categoryIds[0] || 'cat-plumbing';
                      setPricingCategoryId(firstCat);
                      const current = providerProfile?.categoryPricing?.[firstCat];
                      if (current) {
                        setConfigBaseCallout(current.baseCalloutFeeLkr);
                        setConfigHourlyRate(current.hourlyRateLkr);
                        setConfigTravelFee(current.travelFeePerKmLkr || 50);
                      }
                      setShowPricingModal(true);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-left transition flex items-center gap-2.5"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pricing Rules</span>
                      <span className="text-[10px] text-slate-500">Base fee & hourly rate</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-left transition flex items-center gap-2.5"
                  >
                    <UserIcon className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">My Profile</span>
                      <span className="text-[10px] text-slate-500">Bio & portfolio</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Weekly Performance Bar Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Weekly Completed Volume
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold">10% Platform Fee</span>
                </div>

                <div className="h-20 flex items-end justify-between gap-2 pt-2 px-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
                    const heights = [30, 45, 60, 40, 75, 90, 80];
                    const h = heights[idx];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          style={{ height: `${h}%` }}
                          className={`w-full rounded-t-lg transition ${idx === 6 ? 'bg-teal-600' : 'bg-slate-200'}`}
                        />
                        <span className="text-[9px] text-slate-400 font-medium">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB 2: JOB REQUESTS (INBOX) ==================== */}
          {activeTab === 'requests' && (
            <div className="p-4 space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Job Requests Radar</h3>
                  <p className="text-xs text-slate-500">Matching your certified categories</p>
                </div>
                <button
                  onClick={loadProviderData}
                  className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                  title="Refresh Radar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Incoming Cards List */}
              <div className="space-y-3">
                {incomingJobs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Radar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No Pending Requests</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Keep your app online. Nearby customer requests will appear in real time.
                    </p>
                  </div>
                ) : (
                  incomingJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-400 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{job.bookingReference}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              job.urgency === 'EMERGENCY' ? 'bg-orange-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {job.urgency}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">
                            {job.categoryName}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 block">
                            Rs. {job.calloutFeeLkr?.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">Callout Fee</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{job.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="font-medium truncate">{job.address}, {job.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Requested: {job.preferredDate} ({job.preferredTime})</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <ActionButton
                          onClick={() => handleAcceptJob(job.id)}
                          isLoading={acceptingJobId === job.id}
                          loadingLabel="Accepting..."
                          label="Accept Job Request"
                          icon={<Check className="w-4 h-4" />}
                          variant="primary"
                          size="md"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* ==================== TAB 3: MY JOBS (MANAGEMENT TIMELINE) ==================== */}
          {activeTab === 'jobs' && (
            <div className="p-4 space-y-4">
              {!activeJob ? (
                <div className="py-16 text-center text-slate-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">No Active Job In Progress</p>
                  <p className="text-xs text-slate-500 mt-1">Accept an incoming request from the radar to start work.</p>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                  >
                    Go To Radar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Job Header Card */}
                  <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">{activeJob.bookingReference}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 font-bold text-[10px]">
                        {activeJob.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">{activeJob.title}</h3>
                      <p className="text-xs text-slate-300 mt-0.5">{activeJob.description}</p>
                    </div>

                    {/* Customer Info Card */}
                    <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">{activeJob.customer?.name}</span>
                        <span className="text-[11px] text-slate-400">{activeJob.address}, {activeJob.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowProviderChatModal(true);
                            loadProviderChatMessages();
                          }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-teal-300 rounded-xl transition flex items-center gap-1 text-[11px] font-bold"
                          title="Message Customer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                        <a
                          href={`tel:${activeJob.customer?.phone}`}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 6-Stage Workflow Actions */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Work Lifecycle Action
                    </h4>

                    {/* Step 1: ACCEPTED -> Action: START JOURNEY */}
                    {activeJob.status === 'ACCEPTED' && (
                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-600">
                          You have accepted this job. Tap below when you begin travelling to the customer.
                        </p>
                        <ActionButton
                          onClick={() => handleUpdateStatus('ON_THE_WAY', 'Provider started travelling to location')}
                          isLoading={isUpdatingStatus}
                          loadingLabel="Starting Journey..."
                          label="Start Journey to Location"
                          icon={<Navigation className="w-4 h-4" />}
                          variant="primary"
                          size="md"
                        />
                      </div>
                    )}

                    {/* Step 2: ON_THE_WAY -> Action: MARK ARRIVED */}
                    {activeJob.status === 'ON_THE_WAY' && (
                      <div className="space-y-2.5">
                        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-xs text-blue-900">
                          Customer was notified that you are en route.
                        </div>
                        <ActionButton
                          onClick={() => handleUpdateStatus('ARRIVED', 'Provider arrived at service address')}
                          isLoading={isUpdatingStatus}
                          loadingLabel="Updating Status..."
                          label="I Have Arrived at Location"
                          icon={<MapPin className="w-4 h-4" />}
                          variant="success"
                          size="md"
                        />
                      </div>
                    )}

                    {/* Step 3: ARRIVED -> Action: START WORK */}
                    {activeJob.status === 'ARRIVED' && (
                      <div className="space-y-2.5">
                        <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-xs text-teal-900">
                          Arrived on site. Perform initial safety check before opening main repair tools.
                        </div>
                        <ActionButton
                          onClick={() => handleUpdateStatus('IN_PROGRESS', 'Provider officially started repair work')}
                          isLoading={isUpdatingStatus}
                          loadingLabel="Starting Work..."
                          label="Start Repair Work"
                          icon={<Play className="w-4 h-4 fill-white" />}
                          variant="secondary"
                          size="md"
                        />
                      </div>
                    )}

                    {/* Step 4: IN_PROGRESS -> Options: PROPOSE EXTRA COST & COMPLETE WORK */}
                    {activeJob.status === 'IN_PROGRESS' && (
                      <div className="space-y-3">
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          <span>Work in progress. Keep notes of all parts and materials used.</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowProposalModal(true)}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Propose Extra Cost
                          </button>
                          <button
                            onClick={() => setShowCompletionModal(true)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Work
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: AWAITING_CUSTOMER_CONFIRMATION */}
                    {activeJob.status === 'AWAITING_CUSTOMER_CONFIRMATION' && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 space-y-1.5">
                        <span className="font-bold block flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Awaiting Customer Confirmation
                        </span>
                        <p className="text-[11px] leading-relaxed">
                          Final invoice (Rs. {activeJob.totalAmountLkr?.toLocaleString()}) submitted. The customer is currently reviewing and confirming completion.
                        </p>
                      </div>
                    )}

                    {/* Step 6: COMPLETED */}
                    {activeJob.status === 'COMPLETED' && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-900 space-y-1">
                        <span className="font-bold block flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Job Successfully Completed & Paid!
                        </span>
                        <p className="text-[11px]">
                          Customer signed off and released payment. Net earnings recorded in your ledger.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs text-xs space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Job Financial Summary
                    </h4>
                    <div className="divide-y divide-slate-100">
                      <div className="py-1 flex justify-between text-slate-600">
                        <span>Base Callout Fee:</span>
                        <span>Rs. {activeJob.calloutFeeLkr?.toLocaleString()}</span>
                      </div>
                      <div className="py-1 flex justify-between text-slate-600">
                        <span>Labor Charges:</span>
                        <span>Rs. {(activeJob.laborChargesLkr || 0).toLocaleString()}</span>
                      </div>
                      <div className="py-1 flex justify-between text-slate-600">
                        <span>Materials / Extras:</span>
                        <span>Rs. {((activeJob.materialCostsLkr || 0) + (activeJob.additionalCostsLkr || 0)).toLocaleString()}</span>
                      </div>
                      <div className="pt-1.5 flex justify-between font-bold text-slate-900">
                        <span>Customer Total:</span>
                        <span className="text-blue-600">Rs. {activeJob.totalAmountLkr?.toLocaleString()}</span>
                      </div>
                      <div className="pt-1 flex justify-between text-[11px] text-emerald-600 font-semibold">
                        <span>Net Payout (90%):</span>
                        <span>Rs. {Math.round((activeJob.totalAmountLkr || 0) * 0.9).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: EARNINGS & PAYOUTS ==================== */}
          {activeTab === 'earnings' && (
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Earnings & Payout Ledger</h3>

              {/* Earnings Hero Card */}
              <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white p-5 rounded-3xl shadow-sm space-y-2">
                <span className="text-xs text-teal-200 font-medium block">Total Net Payout Balance</span>
                <h2 className="text-3xl font-extrabold">Rs. {netPayoutLkr.toLocaleString()}</h2>
                <div className="flex items-center justify-between text-xs text-teal-100 pt-2 border-t border-teal-600/60">
                  <span>Gross Volume: Rs. {totalGrossLkr.toLocaleString()}</span>
                  <span>Platform Fee (10%): Rs. {totalCommissionLkr.toLocaleString()}</span>
                </div>
              </div>

              {/* Completed Jobs History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Completed Services ({completedJobs.length})
                </h4>

                <div className="space-y-2">
                  {completedJobs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No completed jobs yet. Complete jobs to see recorded earnings.
                    </div>
                  ) : (
                    completedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{job.bookingReference}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                              Paid
                            </span>
                          </div>
                          <h5 className="text-xs font-semibold text-slate-700 mt-0.5 truncate max-w-[180px]">
                            {job.title}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {new Date(job.updatedAt).toLocaleDateString()} • {job.city}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-emerald-600 block">
                            Rs. {Math.round(job.totalAmountLkr * 0.9).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Gross: Rs. {job.totalAmountLkr}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: PROFILE & PRICING ==================== */}
          {activeTab === 'profile' && (
            <div className="p-4 space-y-4">
              
              {/* Profile Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3">
                <img
                  src={user?.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                    {providerProfile?.verificationStatus === 'APPROVED' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">{providerProfile?.businessName}</span>
                  <span className="text-xs text-blue-600 font-semibold">{user?.phone}</span>
                </div>
              </div>

              {/* Service Pricing Rules Management Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Category Base Fees & Pricing
                  </h4>
                  <button
                    onClick={() => {
                      const firstCat = providerProfile?.categoryIds[0] || 'cat-plumbing';
                      setPricingCategoryId(firstCat);
                      const current = providerProfile?.categoryPricing?.[firstCat];
                      if (current) {
                        setConfigBaseCallout(current.baseCalloutFeeLkr);
                        setConfigHourlyRate(current.hourlyRateLkr);
                        setConfigTravelFee(current.travelFeePerKmLkr || 50);
                      }
                      setShowPricingModal(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Edit Pricing
                  </button>
                </div>

                <div className="space-y-2">
                  {providerProfile?.categoryIds.map((catId) => {
                    const cat = categories.find(c => c.id === catId);
                    const pricing = providerProfile.categoryPricing?.[catId];
                    return (
                      <div key={catId} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{cat?.name || catId}</span>
                          <span className="text-blue-600">Base: Rs. {pricing?.baseCalloutFeeLkr || providerProfile.calloutFeeLkr}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Hourly Rate: Rs. {pricing?.hourlyRateLkr || providerProfile.baseRateLkr}/hr</span>
                          <span>Travel Fee: Rs. {pricing?.travelFeePerKmLkr || 50}/km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Reviews & Response Section */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Customer Reviews ({reviews.length})
                </h4>

                <div className="space-y-2.5">
                  {reviews.length === 0 ? (
                    <span className="text-xs text-slate-400 block">No reviews received yet.</span>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900">{r.customerName}</span>
                          <span className="text-amber-600 font-bold">⭐ {r.rating}/5</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">"{r.comment}"</p>

                        {/* Existing Response or Respond button */}
                        {r.response ? (
                          <div className="mt-1 p-2 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                            <strong>Your Reply: </strong> "{r.response}"
                          </div>
                        ) : (
                          <div>
                            {respondingReviewId === r.id ? (
                              <div className="space-y-1.5 pt-1">
                                <input
                                  type="text"
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Write a polite response..."
                                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setRespondingReviewId(null)}
                                    className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handlePostReviewResponse(r.id)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Post Reply
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setRespondingReviewId(r.id);
                                  setResponseText('');
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                Reply to Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Tab Bar (5 Clear Tabs) */}
        <div className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold transition ${
              activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'dashboard' ? 'bg-teal-50' : ''}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold transition ${
              activeTab === 'requests' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'requests' ? 'bg-teal-50' : ''}`}>
              <Radar className="w-4 h-4" />
            </div>
            <span>Requests</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold transition ${
              activeTab === 'jobs' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'jobs' ? 'bg-teal-50' : ''}`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <span>My Jobs</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold transition ${
              activeTab === 'earnings' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'earnings' ? 'bg-teal-50' : ''}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <span>Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold transition ${
              activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'profile' ? 'bg-teal-50' : ''}`}>
              <UserIcon className="w-4 h-4" />
            </div>
            <span>Profile</span>
          </button>
        </div>

      </div>

      {/* ==================== MODAL: PROPOSE EXTRA CHARGE ==================== */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Propose Additional Charge</h3>
              <button onClick={() => setShowProposalModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Customer must explicitly approve this proposal in their app before it is added to the final invoice.
            </p>

            <form onSubmit={handleSubmitProposal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
                <select
                  value={proposalCategory}
                  onChange={(e: any) => setProposalCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="MATERIALS">Replacement Materials & Parts</option>
                  <option value="EXTRA_LABOR">Unforeseen Additional Labor</option>
                  <option value="UNFORESEEN_WORK">Structural / Specialist Work</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Description *</label>
                <input
                  type="text"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="e.g. 25mm PVC elbow joint and pressure glue"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Amount (LKR) *</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSubmittingProposal ? 'Sending...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: COMPLETION ==================== */}
      {showCompletionModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Submit Job Completion</h3>
              <button onClick={() => setShowCompletionModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Labor Charges (LKR) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={laborCharges}
                  onChange={(e) => setLaborCharges(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Material Costs (LKR)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={materialCosts}
                  onChange={(e) => setMaterialCosts(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Materials / Notes</label>
                <input
                  type="text"
                  value={additionalCostNotes}
                  onChange={(e) => setAdditionalCostNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Completion Notes *</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Total Calculation */}
              <div className="bg-slate-100 p-3 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Callout Fee:</span>
                  <span>Rs. {activeJob.calloutFeeLkr}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Labor:</span>
                  <span>Rs. {laborCharges}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Materials:</span>
                  <span>Rs. {materialCosts}</span>
                </div>
                <div className="pt-1 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Final Total to Customer:</span>
                  <span className="text-blue-600">
                    Rs. {(activeJob.calloutFeeLkr + laborCharges + materialCosts).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompletion}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {isSubmittingCompletion ? 'Submitting...' : 'Submit for Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CATEGORY PRICING RULES ==================== */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Configure Service Pricing</h3>
              <button onClick={() => setShowPricingModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Service Category</label>
                <select
                  value={pricingCategoryId}
                  onChange={(e) => setPricingCategoryId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  {providerProfile?.categoryIds.map((cId) => (
                    <option key={cId} value={cId}>
                      {categories.find(c => c.id === cId)?.name || cId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Base Callout Fee (LKR) *</label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="100"
                  value={configBaseCallout}
                  onChange={(e) => setConfigBaseCallout(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Allowed range: Rs. 1,000 - Rs. 10,000</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Hourly Labor Rate (LKR) *</label>
                <input
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={configHourlyRate}
                  onChange={(e) => setConfigHourlyRate(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Travel Rate per km (LKR)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="10"
                  value={configTravelFee}
                  onChange={(e) => setConfigTravelFee(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPricing}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSavingPricing ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: PROVIDER CHAT WITH CUSTOMER ==================== */}
      {showProviderChatModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[75vh] overflow-hidden">
            {/* Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {activeJob.customer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{activeJob.customer?.name || 'Customer'}</h4>
                  <span className="text-[10px] text-slate-400 block">{activeJob.bookingReference}</span>
                </div>
              </div>
              <button
                onClick={() => setShowProviderChatModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50">
              {providerChatMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Send an update to the customer</p>
                  <p className="text-[10px] text-slate-400">Notify about arrival ETA, gate access, or repair progress.</p>
                </div>
              ) : (
                providerChatMessages.map((msg) => {
                  const isProvider = msg.senderRole === 'PROVIDER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isProvider ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[9px] font-bold text-slate-500">
                          {isProvider ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[8px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isProvider
                            ? 'bg-teal-700 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Technician Response Chips */}
            <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                "Ayubowan! Starting my journey now.",
                "I have arrived at your premises/gate.",
                "Inspecting the issue now.",
                "Work completed and tested."
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendProviderMessage(chip)}
                  className="text-[10px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shrink-0 transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendProviderMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={providerChatInput}
                onChange={(e) => setProviderChatInput(e.target.value)}
                placeholder="Type a message to customer..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <button
                type="submit"
                disabled={isSendingProviderChat || !providerChatInput.trim()}
                className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
