export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type ProviderVerificationStatus = 
  | 'PENDING_VERIFICATION' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'SUSPENDED';

export type BookingStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_CUSTOMER_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type RequestUrgency = 'NORMAL' | 'EMERGENCY';

export type ComplaintStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface UserNotificationPreferences {
  bookingStatus: boolean;
  providerArrival: boolean;
  completionAndReview: boolean;
  promotions: boolean;
  inAppAlerts: boolean;
  pushEnabled: boolean;
}

export interface UserAppSettings {
  language: 'en' | 'si' | 'ta';
  theme: 'system' | 'light' | 'dark';
  currency: 'LKR';
  locationPermission: boolean;
  fontSize: 'normal' | 'large';
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  avatarUrl: string;
  status: UserStatus;
  statusReason?: string;
  createdAt: string;
  notificationPreferences?: UserNotificationPreferences;
  appSettings?: UserAppSettings;
}

export interface Address {
  id: string;
  userId: string;
  label: string; // 'Home', 'Office', 'Apartment'
  addressLine: string;
  district: string; // 'Colombo', 'Gampaha', 'Kandy'
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  baseCalloutFeeLkr: number;
  typicalHourlyRateLkr: number;
  emergencyMultiplier: number;
  isActive: boolean;
  popularTasks: string[];
}

export interface ProviderPortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}

export interface ProviderCategoryPricing {
  categoryId: string;
  baseCalloutFeeLkr: number;
  hourlyRateLkr: number;
  travelFeePerKmLkr?: number;
  lastUpdatedAt: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName?: string;
  categoryIds: string[];
  experienceYears: number;
  bio: string;
  serviceAreas: string[]; // ['Colombo 01-15', 'Dehiwala', 'Mount Lavinia', 'Nugegoda']
  workingHours: string; // '8:00 AM - 6:00 PM'
  baseRateLkr: number;
  calloutFeeLkr: number;
  categoryPricing: Record<string, ProviderCategoryPricing>;
  languagesSpoken: string[];
  preferredContactMethod?: 'PHONE' | 'IN_APP' | 'SMS';
  qualifications?: string[];
  maxServiceDistanceKm?: number;
  verificationStatus: ProviderVerificationStatus;
  verificationNotes?: string;
  verificationDate?: string;
  isOnline: boolean;
  rating: number; // 0.0 - 5.0
  reviewCount: number;
  completedJobsCount: number;
  nationalIdUrl?: string;
  policeReportUrl?: string;
  certificateUrl?: string;
  portfolio: ProviderPortfolioItem[];
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ServiceAttachment {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
}

export interface AdditionalChargeProposal {
  id: string;
  description: string;
  amountLkr: number;
  category: 'MATERIALS' | 'EXTRA_LABOR' | 'UNFORESEEN_WORK';
  proposedAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  customerNotes?: string;
}

export interface PricingSnapshot {
  baseCalloutFeeLkr: number;
  hourlyRateLkr: number;
  urgencyMultiplier: number;
  estimatedLaborHours?: number;
  travelFeeLkr: number;
  estimatedSubtotalLkr: number;
  platformFeeLkr: number;
}

export interface ServiceRequest {
  id: string;
  bookingReference: string; // e.g. 'HD-2026-8941'
  customerId: string;
  providerId?: string;
  categoryId: string;
  title: string;
  description: string;
  urgency: RequestUrgency;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  preferredDate: string;
  preferredTime: string;
  additionalInstructions?: string;
  attachments: ServiceAttachment[];
  
  // AI assist metadata
  aiClassifiedCategory?: string;
  aiSafetyWarning?: string;
  aiEstimatedUrgency?: RequestUrgency;
  
  // Status & Financials
  status: BookingStatus;
  pricingSnapshot?: PricingSnapshot;
  calloutFeeLkr: number;
  laborChargesLkr: number;
  materialCostsLkr: number;
  additionalCostsLkr: number;
  additionalCostNotes?: string;
  additionalChargeProposals: AdditionalChargeProposal[];
  travelFeeLkr: number;
  totalAmountLkr: number;
  platformCommissionLkr: number;
  
  // Lifecycle timestamps & notes
  acceptedAt?: string;
  journeyStartedAt?: string;
  arrivedAt?: string;
  workStartedAt?: string;
  completionSubmittedAt?: string;
  completionConfirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  completionNotes?: string;
  completionPhotos: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  changedByUserId: string;
  changedByRole: UserRole;
  note: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING_UPDATE' | 'VERIFICATION' | 'SYSTEM' | 'REVIEW';
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[];
  response?: string;
  responseAt?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  bookingId: string;
  filedByUserId: string;
  filedByRole: UserRole;
  againstUserId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AdminPricingRules {
  minCalloutFeeLkr: number;
  maxCalloutFeeLkr: number;
  platformCommissionPercent: number;
  travelFeeEnabled: boolean;
  defaultEmergencyMultiplier: number;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}
