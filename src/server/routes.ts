import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { aiService } from './ai';
import { User, UserRole, BookingStatus, ProviderVerificationStatus } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'helpdesk-secret-key-lk-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'This account has been suspended by administration.' });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied: user not authenticated' });
    }
    const userRole = req.user.role;
    const userRoles = req.user.roles || [userRole];
    const hasRole = roles.includes(userRole) || roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const generateToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ==================== AUTH ROUTES ====================

// POST /api/auth/register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, serviceCategoryIds, experienceYears, bio, serviceAreas } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const assignedRole: UserRole = role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = db.createUser({
      name,
      email,
      passwordHash,
      role: assignedRole,
      phone,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      status: 'ACTIVE'
    });

    let providerProfile = undefined;
    if (assignedRole === 'PROVIDER') {
      const primaryCat = serviceCategoryIds?.[0] || 'cat-plumbing';
      providerProfile = db.createProviderProfile({
        userId: user.id,
        businessName: `${name} Services`,
        categoryIds: serviceCategoryIds || ['cat-plumbing'],
        experienceYears: experienceYears || 1,
        bio: bio || 'Professional skilled technician registered on HelpDesk Sri Lanka.',
        serviceAreas: serviceAreas || ['Colombo 01-15'],
        workingHours: '8:00 AM - 6:00 PM',
        baseRateLkr: 1500,
        calloutFeeLkr: 1500,
        categoryPricing: {
          [primaryCat]: {
            categoryId: primaryCat,
            baseCalloutFeeLkr: 1500,
            hourlyRateLkr: 1200,
            travelFeePerKmLkr: 50,
            lastUpdatedAt: new Date().toISOString()
          }
        },
        languagesSpoken: ['Sinhala', 'English'],
        preferredContactMethod: 'PHONE',
        verificationStatus: 'PENDING_VERIFICATION',
        verificationNotes: 'New registration awaiting administrative background & certificate review.',
        isOnline: false,
        portfolio: [],
        latitude: 6.9271,
        longitude: 79.8612
      });

      const admins = db.getAllUsers().filter(u => u.role === 'ADMIN');
      admins.forEach(admin => {
        db.createNotification({
          userId: admin.id,
          title: 'New Provider Registration',
          message: `${name} registered as a service provider and submitted details for verification.`,
          type: 'VERIFICATION'
        });
      });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({
      token,
      user: safeUser,
      providerProfile
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account has been suspended. Reason: ' + (user.statusReason || 'Violation of terms') });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    const providerProfile = user.role === 'PROVIDER' ? db.getProviderById(user.id) : undefined;

    res.json({
      token,
      user: safeUser,
      providerProfile
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;
  const providerProfile = user.role === 'PROVIDER' ? db.getProviderById(user.id) : undefined;
  res.json({
    user: safeUser,
    providerProfile
  });
});

// POST /api/auth/logout
router.post('/auth/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/switch-mode
router.post('/auth/switch-mode', authenticateToken, (req: AuthRequest, res: Response) => {
  const { targetRole } = req.body;
  const user = req.user!;
  
  if (!targetRole || !['CUSTOMER', 'PROVIDER'].includes(targetRole)) {
    return res.status(400).json({ error: 'Target role must be CUSTOMER or PROVIDER' });
  }

  const authorizedRoles = user.roles || [user.role];
  if (!authorizedRoles.includes(targetRole)) {
    return res.status(403).json({ error: `Account does not have authorization for role ${targetRole}. You must register or apply first.` });
  }

  // Update activeRole on user
  const updated = db.updateUser(user.id, { activeRole: targetRole });
  const { passwordHash: _, ...safeUser } = updated || user;
  const providerProfile = db.getProviderById(user.id);

  res.json({
    message: `Switched active mode to ${targetRole}`,
    user: safeUser,
    providerProfile
  });
});

// ==================== USER PROFILE & SETTINGS ROUTES ====================

// PUT /api/users/notification-preferences
router.put('/users/notification-preferences', authenticateToken, (req: AuthRequest, res: Response) => {
  const updated = db.updateNotificationPreferences(req.user!.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safe } = updated;
  res.json({ message: 'Notification preferences updated', user: safe });
});

// PUT /api/users/app-settings
router.put('/users/app-settings', authenticateToken, (req: AuthRequest, res: Response) => {
  const updated = db.updateAppSettings(req.user!.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safe } = updated;
  res.json({ message: 'App settings saved', user: safe });
});

// PUT /api/users/change-password
router.put('/users/change-password', authenticateToken, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  const result = db.changePassword(req.user!.id, currentPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ message: 'Password changed successfully' });
});

// DELETE /api/users/account
router.delete('/users/account', authenticateToken, (req: AuthRequest, res: Response) => {
  const { confirmation } = req.body;
  if (confirmation !== 'DELETE') {
    return res.status(400).json({ error: 'Type "DELETE" to confirm account deletion' });
  }
  const result = db.deleteAccount(req.user!.id);
  res.json(result);
});

// GET /api/users/addresses
router.get('/users/addresses', authenticateToken, (req: AuthRequest, res: Response) => {
  const addresses = db.getUserAddresses(req.user!.id);
  res.json(addresses);
});

// POST /api/users/addresses
router.post('/users/addresses', authenticateToken, (req: AuthRequest, res: Response) => {
  const { label, addressLine, district, city, latitude, longitude, isDefault } = req.body;
  if (!addressLine || !city) {
    return res.status(400).json({ error: 'Address line and city are required' });
  }
  const address = db.addAddress({
    userId: req.user!.id,
    label: label || 'Home',
    addressLine,
    district: district || 'Colombo',
    city,
    latitude: latitude || 6.9271,
    longitude: longitude || 79.8612,
    isDefault: !!isDefault
  });
  res.status(201).json(address);
});

// PUT /api/users/addresses/:id/default
router.put('/users/addresses/:id/default', authenticateToken, (req: AuthRequest, res: Response) => {
  const addr = db.setDefaultAddress(req.user!.id, req.params.id);
  if (!addr) return res.status(404).json({ error: 'Address not found' });
  res.json(addr);
});

// DELETE /api/users/addresses/:id
router.delete('/users/addresses/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const ok = db.deleteAddress(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// GET /api/users/my-reviews
router.get('/users/my-reviews', authenticateToken, (req: AuthRequest, res: Response) => {
  const reviews = db.getCustomerReviews(req.user!.id).map(r => {
    const prov = db.getProviderById(r.providerId);
    const provUser = prov ? db.findUserById(prov.userId) : undefined;
    return {
      ...r,
      providerName: prov?.businessName || provUser?.name || 'Technician',
      providerAvatar: provUser?.avatarUrl
    };
  });
  res.json(reviews);
});

// GET /api/users/me
router.get('/users/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/users/me
router.put('/users/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, phone, avatarUrl } = req.body;
  const updated = db.updateUser(req.user!.id, {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(avatarUrl && { avatarUrl })
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

// ==================== CATEGORIES ROUTES ====================

// GET /api/categories
router.get('/categories', (req: Request, res: Response) => {
  const categories = db.getCategories().filter(c => c.isActive);
  res.json(categories);
});

// ==================== PROVIDER DISCOVERY & PROFILES ====================

// GET /api/providers
router.get('/providers', (req: Request, res: Response) => {
  const { categoryId, search, verifiedOnly } = req.query;
  let list = db.getProviders();

  if (verifiedOnly !== 'false') {
    list = list.filter(p => p.verificationStatus === 'APPROVED');
  }

  if (categoryId && typeof categoryId === 'string') {
    list = list.filter(p => p.categoryIds.includes(categoryId));
  }

  const mapped = list.map(p => {
    const user = db.findUserById(p.userId);
    return {
      ...p,
      name: user?.name || 'Service Professional',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || ''
    };
  });

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    res.json(mapped.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.businessName?.toLowerCase().includes(s) || 
      p.bio.toLowerCase().includes(s) ||
      p.serviceAreas.some(a => a.toLowerCase().includes(s))
    ));
    return;
  }

  res.json(mapped);
});

// GET /api/providers/me
router.get('/providers/me', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });
  const user = db.findUserById(profile.userId);
  res.json({
    ...profile,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    avatarUrl: user?.avatarUrl
  });
});

// GET /api/providers/:id
router.get('/providers/:id', (req: Request, res: Response) => {
  if (req.params.id === 'me') {
    return res.status(401).json({ error: 'Authentication required for /providers/me' });
  }
  const provider = db.getProviderById(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  const user = db.findUserById(provider.userId);
  const reviews = db.getProviderReviews(provider.id);
  res.json({
    ...provider,
    name: user?.name || 'Service Professional',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
    reviews
  });
});

// POST /api/providers/verification
router.post('/providers/verification', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  const { nationalIdUrl, certificateUrl, policeReportUrl, experienceYears, bio, categoryIds, serviceAreas } = req.body;
  const updated = db.updateProviderProfile(profile.id, {
    ...(nationalIdUrl && { nationalIdUrl }),
    ...(certificateUrl && { certificateUrl }),
    ...(policeReportUrl && { policeReportUrl }),
    ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
    ...(bio && { bio }),
    ...(categoryIds && { categoryIds }),
    ...(serviceAreas && { serviceAreas }),
    verificationStatus: 'PENDING_VERIFICATION',
    verificationNotes: 'Updated verification documents re-submitted for administrative review.'
  });

  const admins = db.getAllUsers().filter(u => u.role === 'ADMIN');
  admins.forEach(admin => {
    db.createNotification({
      userId: admin.id,
      title: 'Provider Document Resubmission',
      message: `${req.user!.name} re-submitted verification documents for review.`,
      type: 'VERIFICATION'
    });
  });

  res.json({ message: 'Verification application submitted successfully', profile: updated });
});

// PUT /api/providers/me
router.put('/providers/me', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  const { businessName, bio, categoryIds, serviceAreas, workingHours, baseRateLkr, calloutFeeLkr, languagesSpoken, preferredContactMethod, qualifications, maxServiceDistanceKm } = req.body;
  const updated = db.updateProviderProfile(profile.id, {
    ...(businessName && { businessName }),
    ...(bio && { bio }),
    ...(categoryIds && { categoryIds }),
    ...(serviceAreas && { serviceAreas }),
    ...(workingHours && { workingHours }),
    ...(languagesSpoken && { languagesSpoken }),
    ...(preferredContactMethod && { preferredContactMethod }),
    ...(qualifications && { qualifications }),
    ...(maxServiceDistanceKm !== undefined && { maxServiceDistanceKm: Number(maxServiceDistanceKm) }),
    ...(baseRateLkr !== undefined && { baseRateLkr: Number(baseRateLkr) }),
    ...(calloutFeeLkr !== undefined && { calloutFeeLkr: Number(calloutFeeLkr) })
  });

  res.json(updated);
});

// PUT /api/providers/category-pricing
router.put('/providers/category-pricing', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  const { categoryId, baseCalloutFeeLkr, hourlyRateLkr, travelFeePerKmLkr } = req.body;
  if (!categoryId || baseCalloutFeeLkr === undefined || hourlyRateLkr === undefined) {
    return res.status(400).json({ error: 'categoryId, baseCalloutFeeLkr, and hourlyRateLkr are required' });
  }

  const updated = db.updateProviderCategoryPricing(profile.id, categoryId, {
    baseCalloutFeeLkr: Number(baseCalloutFeeLkr),
    hourlyRateLkr: Number(hourlyRateLkr),
    travelFeePerKmLkr: travelFeePerKmLkr ? Number(travelFeePerKmLkr) : 0
  });

  res.json({ message: 'Pricing updated successfully', profile: updated });
});

// PUT /api/providers/availability
router.put('/providers/availability', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  if (profile.verificationStatus !== 'APPROVED') {
    return res.status(403).json({ error: 'You cannot go online until your account is approved by admin.' });
  }

  const { isOnline } = req.body;
  const updated = db.updateProviderProfile(profile.id, { isOnline: !!isOnline });
  res.json(updated);
});

// ==================== SERVICE REQUESTS & BOOKINGS ====================

// POST /api/service-requests
router.post('/service-requests', authenticateToken, requireRole(['CUSTOMER']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      categoryId,
      title,
      description,
      urgency,
      address,
      city,
      district,
      latitude,
      longitude,
      preferredDate,
      preferredTime,
      additionalInstructions,
      attachments,
      providerId
    } = req.body;

    if (!categoryId || !title || !description || !address || !preferredDate) {
      return res.status(400).json({ error: 'Category, title, description, address, and preferred date are required' });
    }

    const category = db.getCategoryById(categoryId);
    const rules = db.getPricingRules();
    const isUrgent = urgency === 'EMERGENCY';
    const emergencyMultiplier = isUrgent ? (category?.emergencyMultiplier || rules.defaultEmergencyMultiplier) : 1.0;

    let baseCallout = category ? category.baseCalloutFeeLkr : 1500;
    let hourlyRate = category ? category.typicalHourlyRateLkr : 1200;

    // If specific provider selected, use their configured category pricing
    if (providerId) {
      const selectedProv = db.getProviderById(providerId);
      if (selectedProv && selectedProv.categoryPricing?.[categoryId]) {
        baseCallout = selectedProv.categoryPricing[categoryId].baseCalloutFeeLkr;
        hourlyRate = selectedProv.categoryPricing[categoryId].hourlyRateLkr;
      }
    }

    const effectiveCallout = Math.round(baseCallout * emergencyMultiplier);
    const estimatedSubtotal = effectiveCallout + Math.round(hourlyRate * 1.5);
    const platformFee = Math.round(estimatedSubtotal * (rules.platformCommissionPercent / 100));

    const aiDiag = await aiService.classifyProblem(description);

    const booking = db.createServiceRequest({
      customerId: req.user!.id,
      providerId: providerId || undefined,
      categoryId,
      title,
      description,
      urgency: isUrgent ? 'EMERGENCY' : 'NORMAL',
      address,
      city: city || 'Colombo',
      district: district || 'Colombo',
      latitude: latitude || 6.9271,
      longitude: longitude || 79.8612,
      preferredDate,
      preferredTime: preferredTime || 'ASAP',
      additionalInstructions,
      attachments: attachments || [],
      aiClassifiedCategory: aiDiag.suggestedCategoryName,
      aiSafetyWarning: aiDiag.safetyWarning,
      aiEstimatedUrgency: aiDiag.urgency,
      pricingSnapshot: {
        baseCalloutFeeLkr: effectiveCallout,
        hourlyRateLkr: hourlyRate,
        urgencyMultiplier: emergencyMultiplier,
        estimatedLaborHours: 1.5,
        travelFeeLkr: 0,
        estimatedSubtotalLkr: estimatedSubtotal,
        platformFeeLkr: platformFee
      },
      calloutFeeLkr: effectiveCallout,
      laborChargesLkr: 0,
      additionalCostsLkr: 0,
      totalAmountLkr: effectiveCallout,
      completionPhotos: []
    });

    if (providerId) {
      const targetProv = db.getProviderById(providerId);
      if (targetProv) {
        db.createNotification({
          userId: targetProv.userId,
          title: isUrgent ? '🚨 EMERGENCY Job Request!' : 'Direct Job Request',
          message: `Customer booked you for: "${title}". Ref: ${booking.bookingReference}`,
          type: 'BOOKING_UPDATE',
          bookingId: booking.id
        });
      }
    }

    res.status(201).json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create service request' });
  }
});

// GET /api/service-requests
router.get('/service-requests', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { status, categoryId, tab } = req.query;

  let bookings: any[] = [];

  if (user.role === 'ADMIN') {
    bookings = db.getBookings();
  } else if (user.role === 'CUSTOMER') {
    bookings = db.getCustomerBookings(user.id);
  } else if (user.role === 'PROVIDER') {
    const profile = db.getProviderById(user.id);
    if (!profile) return res.json([]);

    if (tab === 'incoming') {
      bookings = db.getOpenPendingRequests().filter(b => profile.categoryIds.includes(b.categoryId));
    } else {
      bookings = db.getProviderBookings(profile.id);
    }
  }

  if (status && typeof status === 'string') {
    bookings = bookings.filter(b => b.status === status);
  }

  if (categoryId && typeof categoryId === 'string') {
    bookings = bookings.filter(b => b.categoryId === categoryId);
  }

  const enriched = bookings.map(b => {
    const customer = db.findUserById(b.customerId);
    const category = db.getCategoryById(b.categoryId);
    let providerName = undefined;
    let providerPhone = undefined;
    if (b.providerId) {
      const prov = db.getProviderById(b.providerId);
      if (prov) {
        const provUser = db.findUserById(prov.userId);
        providerName = prov.businessName || provUser?.name;
        providerPhone = provUser?.phone;
      }
    }

    return {
      ...b,
      customerName: customer?.name || 'Customer',
      customerPhone: customer?.phone || '',
      categoryName: category?.name || 'Home Service',
      categoryIcon: category?.iconName || 'Wrench',
      providerName,
      providerPhone
    };
  });

  res.json(enriched);
});

// GET /api/service-requests/:id
router.get('/service-requests/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const user = req.user!;
  const isCustomer = user.role === 'CUSTOMER' && booking.customerId === user.id;
  const isAssignedProvider = user.role === 'PROVIDER' && db.getProviderById(user.id)?.id === booking.providerId;
  const isAvailablePending = user.role === 'PROVIDER' && booking.status === 'PENDING';
  const isAdmin = user.role === 'ADMIN';

  if (!isCustomer && !isAssignedProvider && !isAvailablePending && !isAdmin) {
    return res.status(403).json({ error: 'Access denied for this booking' });
  }

  const history = db.getBookingHistory(booking.id);
  const customer = db.findUserById(booking.customerId);
  const category = db.getCategoryById(booking.categoryId);
  let provider = undefined;
  if (booking.providerId) {
    const provProfile = db.getProviderById(booking.providerId);
    if (provProfile) {
      const provUser = db.findUserById(provProfile.userId);
      provider = {
        ...provProfile,
        name: provUser?.name,
        phone: provUser?.phone,
        avatarUrl: provUser?.avatarUrl
      };
    }
  }

  const reviews = db.getProviderReviews(booking.providerId || '').filter(r => r.bookingId === booking.id);

  res.json({
    ...booking,
    customer: {
      name: customer?.name,
      phone: customer?.phone,
      avatarUrl: customer?.avatarUrl
    },
    category,
    provider,
    history,
    review: reviews[0] || null
  });
});

// PUT /api/service-requests/:id/accept (ATOMIC ACCEPTANCE)
router.put('/service-requests/:id/accept', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  const result = db.acceptBooking(req.params.id, profile.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Request accepted successfully', booking: result.booking });
});

// PUT /api/service-requests/:id/status (PROVIDER LIFECYCLE ACTIONS)
router.put('/service-requests/:id/status', authenticateToken, requireRole(['PROVIDER', 'ADMIN']), (req: AuthRequest, res: Response) => {
  const { status, note, laborChargesLkr, materialCostsLkr, additionalCostsLkr, additionalCostNotes, completionNotes, completionPhotos } = req.body;

  if (!status) return res.status(400).json({ error: 'Target status is required' });

  const result = db.updateBookingStatus(
    req.params.id,
    status as BookingStatus,
    req.user!.id,
    req.user!.role,
    {
      note,
      laborChargesLkr: laborChargesLkr !== undefined ? Number(laborChargesLkr) : undefined,
      materialCostsLkr: materialCostsLkr !== undefined ? Number(materialCostsLkr) : undefined,
      additionalCostsLkr: additionalCostsLkr !== undefined ? Number(additionalCostsLkr) : undefined,
      additionalCostNotes,
      completionNotes,
      completionPhotos
    }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: `Status updated to ${status}`, booking: result.booking });
});

// POST /api/service-requests/:id/propose-cost (PROVIDER PROPOSES EXTRA COST)
router.post('/service-requests/:id/propose-cost', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const { description, amountLkr, category } = req.body;
  if (!description || !amountLkr) {
    return res.status(400).json({ error: 'Description and amount in LKR are required' });
  }

  const result = db.proposeAdditionalCost(req.params.id, {
    description,
    amountLkr: Number(amountLkr),
    category: category || 'MATERIALS'
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Additional cost proposed to customer for sign-off', booking: result.booking });
});

// PUT /api/service-requests/:id/respond-cost (CUSTOMER APPROVES / DECLINES EXTRA COST)
router.put('/service-requests/:id/respond-cost', authenticateToken, requireRole(['CUSTOMER']), (req: AuthRequest, res: Response) => {
  const { proposalId, approved, customerNotes } = req.body;
  if (!proposalId || approved === undefined) {
    return res.status(400).json({ error: 'proposalId and approved boolean are required' });
  }

  const result = db.respondToAdditionalCost(req.params.id, proposalId, req.user!.id, !!approved, customerNotes);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: `Proposal ${approved ? 'approved' : 'declined'} successfully`, booking: result.booking });
});

// PUT /api/service-requests/:id/confirm-completion (CUSTOMER CONFIRMATION)
router.put('/service-requests/:id/confirm-completion', authenticateToken, requireRole(['CUSTOMER', 'ADMIN']), (req: AuthRequest, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.user!.role === 'CUSTOMER' && booking.customerId !== req.user!.id) {
    return res.status(403).json({ error: 'Only the booking owner can confirm service completion' });
  }

  if (booking.status !== 'AWAITING_CUSTOMER_CONFIRMATION') {
    return res.status(400).json({ error: `Cannot confirm completion from status: ${booking.status}. It must be AWAITING_CUSTOMER_CONFIRMATION.` });
  }

  const result = db.updateBookingStatus(
    booking.id,
    'COMPLETED',
    req.user!.id,
    req.user!.role,
    { note: 'Customer verified and confirmed completion of all service tasks.' }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Service marked as COMPLETED. You can now leave a rating and review.', booking: result.booking });
});

// PUT /api/service-requests/:id/cancel
router.put('/service-requests/:id/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { reason } = req.body;
  const result = db.updateBookingStatus(
    booking.id,
    'CANCELLED',
    req.user!.id,
    req.user!.role,
    { cancellationReason: reason || 'Cancelled by user' }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Booking cancelled', booking: result.booking });
});

// ==================== IN-APP BOOKING CHAT MESSAGES ====================

// GET /api/service-requests/:id/messages
router.get('/service-requests/:id/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const messages = db.getBookingMessages(req.params.id);
  res.json(messages);
});

// POST /api/service-requests/:id/messages
router.post('/service-requests/:id/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const msg = db.sendBookingMessage({
    bookingId: req.params.id,
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderRole: req.user!.role,
    text: text.trim()
  });

  res.status(201).json(msg);
});

// ==================== REVIEWS ====================

// POST /api/service-requests/:id/reviews
router.post('/service-requests/:id/reviews', authenticateToken, requireRole(['CUSTOMER']), (req: AuthRequest, res: Response) => {
  const { rating, comment, tags } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating (1-5) and review comment are required' });
  }

  const result = db.submitReview(req.params.id, req.user!.id, Number(rating), comment, Array.isArray(tags) ? tags : []);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({ message: 'Review submitted successfully', review: result.review });
});

// POST /api/providers/reviews/:id/respond (PROVIDER RESPONDS TO REVIEW)
router.post('/providers/reviews/:id/respond', authenticateToken, requireRole(['PROVIDER']), (req: AuthRequest, res: Response) => {
  const profile = db.getProviderById(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'Provider profile not found' });

  const { responseText } = req.body;
  if (!responseText) return res.status(400).json({ error: 'Response text required' });

  const result = db.respondToReview(req.params.id, profile.id, responseText);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Response posted to customer review', review: result.review });
});

// GET /api/providers/:id/reviews
router.get('/providers/:id/reviews', (req: Request, res: Response) => {
  const reviews = db.getProviderReviews(req.params.id).map(r => {
    const cust = db.findUserById(r.customerId);
    return {
      ...r,
      customerName: cust?.name || 'Verified Customer',
      customerAvatar: cust?.avatarUrl || ''
    };
  });
  res.json(reviews);
});

// ==================== COMPLAINTS ====================

// POST /api/service-requests/:id/complaints
router.post('/service-requests/:id/complaints', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { subject, description } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const againstUserId = req.user!.role === 'CUSTOMER' 
    ? (booking.providerId ? db.getProviderById(booking.providerId)?.userId || '' : '')
    : booking.customerId;

  const complaint = db.submitComplaint({
    bookingId: booking.id,
    filedByUserId: req.user!.id,
    filedByRole: req.user!.role,
    againstUserId,
    subject,
    description
  });

  res.status(201).json({ message: 'Complaint filed successfully. Admin is investigating.', complaint });
});

// GET /api/complaints
router.get('/complaints', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const complaints = db.getComplaints().map(c => {
    const filer = db.findUserById(c.filedByUserId);
    const against = db.findUserById(c.againstUserId);
    const booking = db.getBookingById(c.bookingId);
    return {
      ...c,
      filerName: filer?.name || 'User',
      againstName: against?.name || 'User',
      bookingReference: booking?.bookingReference || c.bookingId
    };
  });
  res.json(complaints);
});

// PUT /api/complaints/:id
router.put('/complaints/:id', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { resolutionNotes, status } = req.body;
  const complaint = db.resolveComplaint(req.params.id, resolutionNotes || 'Investigated and resolved by HelpDesk Admin.', status || 'RESOLVED');
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  res.json(complaint);
});

// ==================== NOTIFICATIONS ====================

// GET /api/notifications
router.get('/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifications = db.getNotifications(req.user!.id);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  res.json({ notifications, unreadCount });
});

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const ok = db.markNotificationAsRead(req.params.id, req.user!.id);
  res.json({ success: ok });
});

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  db.markAllNotificationsAsRead(req.user!.id);
  res.json({ success: true });
});

// ==================== AI ENDPOINTS ====================

// POST /api/ai/classify
router.post('/ai/classify', async (req: Request, res: Response) => {
  try {
    const { problemDescription, imageBase64 } = req.body;
    if (!problemDescription) {
      return res.status(400).json({ error: 'Problem description is required' });
    }
    const result = await aiService.classifyProblem(problemDescription, imageBase64);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI Classification failed' });
  }
});

// POST /api/ai/project-plan
router.post('/ai/project-plan', async (req: Request, res: Response) => {
  try {
    const { projectOverview } = req.body;
    if (!projectOverview) {
      return res.status(400).json({ error: 'Project overview is required' });
    }
    const result = await aiService.generateProjectPlan(projectOverview);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Project plan generation failed' });
  }
});

// ==================== ADMIN MANAGEMENT ROUTES ====================

// GET /api/admin/dashboard
router.get('/admin/dashboard', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const users = db.getAllUsers();
  const customers = users.filter(u => u.role === 'CUSTOMER');
  const providers = users.filter(u => u.role === 'PROVIDER');
  const providerProfiles = db.getProviders();
  const pendingVerifications = providerProfiles.filter(p => p.verificationStatus === 'PENDING_VERIFICATION');

  const bookings = db.getBookings();
  const activeBookings = bookings.filter(b => ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  const complaints = db.getComplaints();
  const openComplaints = complaints.filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING');

  const totalGrossLkr = completedBookings.reduce((sum, b) => sum + (b.totalAmountLkr || 0), 0);
  const totalCommissionLkr = completedBookings.reduce((sum, b) => sum + (b.platformCommissionLkr || 0), 0);

  const statusCounts: Record<string, number> = {};
  bookings.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  const categoryCounts: Record<string, number> = {};
  bookings.forEach(b => {
    const cat = db.getCategoryById(b.categoryId);
    const catName = cat?.name || b.categoryId;
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });

  res.json({
    stats: {
      totalCustomers: customers.length,
      totalProviders: providers.length,
      pendingVerificationsCount: pendingVerifications.length,
      totalBookings: bookings.length,
      activeBookingsCount: activeBookings.length,
      completedBookingsCount: completedBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      openComplaintsCount: openComplaints.length,
      totalGrossLkr,
      totalCommissionLkr
    },
    statusCounts,
    categoryCounts
  });
});

// GET /api/admin/pricing-rules
router.get('/admin/pricing-rules', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  res.json(db.getPricingRules());
});

// PUT /api/admin/pricing-rules
router.put('/admin/pricing-rules', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const updated = db.updatePricingRules(req.body);
  res.json(updated);
});

// GET /api/admin/users
router.get('/admin/users', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const users = db.getAllUsers().map(u => {
    const { passwordHash: _, ...safe } = u;
    const providerProfile = u.role === 'PROVIDER' ? db.getProviderById(u.id) : undefined;
    return {
      ...safe,
      providerProfile
    };
  });
  res.json(users);
});

// PUT /api/admin/users/:id/status
router.put('/api/admin/users/:id/status', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { status, statusReason } = req.body;
  if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED' });
  }

  const updated = db.updateUser(req.params.id, {
    status,
    statusReason: statusReason || 'Administrative decision'
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });

  if (updated.role === 'PROVIDER') {
    const profile = db.getProviderById(updated.id);
    if (profile) {
      db.updateProviderProfile(profile.id, {
        verificationStatus: status === 'SUSPENDED' ? 'SUSPENDED' : profile.verificationStatus,
        isOnline: status === 'SUSPENDED' ? false : profile.isOnline
      });
    }
  }

  const { passwordHash: _, ...safe } = updated;
  res.json(safe);
});

// GET /api/admin/providers/pending
router.get('/admin/providers/pending', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const pending = db.getProviders()
    .filter(p => p.verificationStatus === 'PENDING_VERIFICATION')
    .map(p => {
      const user = db.findUserById(p.userId);
      return {
        ...p,
        userName: user?.name,
        userEmail: user?.email,
        userPhone: user?.phone,
        userAvatar: user?.avatarUrl
      };
    });
  res.json(pending);
});

// PUT /api/admin/providers/:id/verification
router.put('/admin/providers/:id/verification', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { status, notes } = req.body;
  if (!status || !['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(status)) {
    return res.status(400).json({ error: 'Valid verification status required' });
  }

  const updated = db.verifyProvider(req.params.id, status as ProviderVerificationStatus, notes);
  if (!updated) return res.status(404).json({ error: 'Provider not found' });
  res.json(updated);
});

// POST /api/admin/reset-data
router.post('/admin/reset-data', authenticateToken, requireRole(['ADMIN']), (req: Request, res: Response) => {
  db.resetToSeed();
  res.json({ message: 'Database reset to initial demo seeds successfully' });
});

export default router;
