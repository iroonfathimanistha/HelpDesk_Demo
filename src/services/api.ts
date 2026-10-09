import { 
  User, 
  ProviderProfile, 
  ServiceCategory, 
  ServiceRequest, 
  BookingStatusHistory, 
  Notification, 
  Review, 
  Complaint, 
  Address,
  BookingStatus,
  ProviderVerificationStatus,
  UserNotificationPreferences,
  UserAppSettings,
  AdminPricingRules
} from '../types';

const API_BASE = (import.meta.env?.VITE_API_URL as string) || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('helpdesk_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('helpdesk_token', token);
    } else {
      localStorage.removeItem('helpdesk_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  // Auth
  public async login(email: string, password: string) {
    const res = await this.request<{ token: string; user: User; providerProfile?: ProviderProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async register(payload: any) {
    const res = await this.request<{ token: string; user: User; providerProfile?: ProviderProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe() {
    return this.request<{ user: User; providerProfile?: ProviderProfile }>('/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // User Settings & Addresses
  public async updateNotificationPreferences(prefs: Partial<UserNotificationPreferences>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs)
    });
  }

  public async updateAppSettings(settings: Partial<UserAppSettings>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/app-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  public async deleteAccount(confirmation: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation })
    });
  }

  public async getAddresses(): Promise<Address[]> {
    return this.request<Address[]>('/users/addresses');
  }

  public async addAddress(addr: Omit<Address, 'id'>): Promise<Address> {
    return this.request<Address>('/users/addresses', {
      method: 'POST',
      body: JSON.stringify(addr)
    });
  }

  public async setDefaultAddress(id: string): Promise<Address> {
    return this.request<Address>(`/users/addresses/${id}/default`, {
      method: 'PUT'
    });
  }

  public async deleteAddress(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/addresses/${id}`, {
      method: 'DELETE'
    });
  }

  public async getMyReviews(): Promise<any[]> {
    return this.request<any[]>('/users/my-reviews');
  }

  public async updateUserProfile(payload: { name?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Categories
  public async getCategories(): Promise<ServiceCategory[]> {
    return this.request<ServiceCategory[]>('/categories');
  }

  // Providers
  public async getProviders(params: { categoryId?: string; search?: string; verifiedOnly?: boolean } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.search) query.append('search', params.search);
    if (params.verifiedOnly !== undefined) query.append('verifiedOnly', String(params.verifiedOnly));
    return this.request<any[]>(`/providers?${query.toString()}`);
  }

  public async getProvider(id: string): Promise<any> {
    return this.request<any>(`/providers/${id}`);
  }

  public async updateProviderProfile(updates: Partial<ProviderProfile>): Promise<ProviderProfile> {
    return this.request<ProviderProfile>('/providers/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async updateProviderCategoryPricing(payload: { categoryId: string; baseCalloutFeeLkr: number; hourlyRateLkr: number; travelFeePerKmLkr?: number }): Promise<any> {
    return this.request<any>('/providers/category-pricing', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async setProviderAvailability(isOnline: boolean): Promise<ProviderProfile> {
    return this.request<ProviderProfile>('/providers/availability', {
      method: 'PUT',
      body: JSON.stringify({ isOnline })
    });
  }

  public async respondToReview(reviewId: string, responseText: string): Promise<any> {
    return this.request<any>(`/providers/reviews/${reviewId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ responseText })
    });
  }

  // Bookings
  public async createServiceRequest(payload: any): Promise<ServiceRequest> {
    return this.request<ServiceRequest>('/service-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getServiceRequests(params: { status?: string; categoryId?: string; tab?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.tab) query.append('tab', params.tab);
    return this.request<any[]>(`/service-requests?${query.toString()}`);
  }

  public async getServiceRequest(id: string): Promise<any> {
    return this.request<any>(`/service-requests/${id}`);
  }

  public async acceptServiceRequest(id: string): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${id}/accept`, {
      method: 'PUT'
    });
  }

  public async updateServiceRequestStatus(id: string, payload: {
    status: BookingStatus;
    note?: string;
    laborChargesLkr?: number;
    materialCostsLkr?: number;
    additionalCostsLkr?: number;
    additionalCostNotes?: string;
    completionNotes?: string;
    completionPhotos?: string[];
  }): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async proposeAdditionalCost(bookingId: string, payload: { description: string; amountLkr: number; category?: string }): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${bookingId}/propose-cost`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async respondToAdditionalCost(bookingId: string, payload: { proposalId: string; approved: boolean; customerNotes?: string }): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${bookingId}/respond-cost`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async confirmCompletion(id: string): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${id}/confirm-completion`, {
      method: 'PUT'
    });
  }

  public async cancelServiceRequest(id: string, reason?: string): Promise<{ message: string; booking: ServiceRequest }> {
    return this.request<{ message: string; booking: ServiceRequest }>(`/service-requests/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  // Reviews
  public async submitReview(bookingId: string, rating: number, comment: string, tags?: string[]): Promise<{ message: string; review: Review }> {
    return this.request<{ message: string; review: Review }>(`/service-requests/${bookingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment, tags })
    });
  }

  public async getProviderReviews(providerId: string): Promise<any[]> {
    return this.request<any[]>(`/providers/${providerId}/reviews`);
  }

  // Complaints
  public async submitComplaint(bookingId: string, subject: string, description: string): Promise<any> {
    return this.request<any>(`/service-requests/${bookingId}/complaints`, {
      method: 'POST',
      body: JSON.stringify({ subject, description })
    });
  }

  public async getComplaints(): Promise<any[]> {
    return this.request<any[]>('/complaints');
  }

  public async resolveComplaint(id: string, resolutionNotes: string, status?: string): Promise<any> {
    return this.request<any>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes, status })
    });
  }

  // Notifications
  public async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return this.request<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  }

  // Booking Chat Messages
  public async getBookingMessages(bookingId: string): Promise<any[]> {
    return this.request<any[]>(`/service-requests/${bookingId}/messages`);
  }

  public async sendBookingMessage(bookingId: string, text: string): Promise<any> {
    return this.request<any>(`/service-requests/${bookingId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  public async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  public async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT'
    });
  }

  // AI
  public async classifyProblem(problemDescription: string, imageBase64?: string): Promise<any> {
    return this.request<any>('/ai/classify', {
      method: 'POST',
      body: JSON.stringify({ problemDescription, imageBase64 })
    });
  }

  public async getProjectPlan(projectOverview: string): Promise<any> {
    return this.request<any>('/ai/project-plan', {
      method: 'POST',
      body: JSON.stringify({ projectOverview })
    });
  }

  // Admin
  public async getAdminDashboard(): Promise<any> {
    return this.request<any>('/admin/dashboard');
  }

  public async getAdminPricingRules(): Promise<AdminPricingRules> {
    return this.request<AdminPricingRules>('/admin/pricing-rules');
  }

  public async updateAdminPricingRules(rules: Partial<AdminPricingRules>): Promise<AdminPricingRules> {
    return this.request<AdminPricingRules>('/admin/pricing-rules', {
      method: 'PUT',
      body: JSON.stringify(rules)
    });
  }

  public async getAdminUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', statusReason?: string): Promise<any> {
    return this.request<any>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, statusReason })
    });
  }

  public async getPendingProviders(): Promise<any[]> {
    return this.request<any[]>('/admin/providers/pending');
  }

  public async verifyProvider(id: string, status: ProviderVerificationStatus, notes?: string): Promise<any> {
    return this.request<any>(`/admin/providers/${id}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  }

  public async resetDemoData(): Promise<any> {
    return this.request<any>('/admin/reset-data', {
      method: 'POST'
    });
  }
}

export const api = new ApiClient();
