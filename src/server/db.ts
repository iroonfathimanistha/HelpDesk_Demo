import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  ProviderProfile,
  ServiceCategory,
  ServiceRequest,
  BookingStatusHistory,
  Notification,
  Review,
  Complaint,
  ComplaintStatus,
  Address,
  BookingStatus,
  ProviderVerificationStatus,
  UserNotificationPreferences,
  UserAppSettings,
  AdminPricingRules,
  AdditionalChargeProposal,
  PricingSnapshot,
  ChatMessage,
  UserRole
} from '../types';

export interface DatabaseState {
  users: User[];
  addresses: Address[];
  categories: ServiceCategory[];
  providers: ProviderProfile[];
  bookings: ServiceRequest[];
  statusHistory: BookingStatusHistory[];
  notifications: Notification[];
  reviews: Review[];
  complaints: Complaint[];
  pricingRules: AdminPricingRules;
  chatMessages: ChatMessage[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data', 'helpdesk-db.json');

const ensureDataDir = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const DEFAULT_NOTIF_PREFS: UserNotificationPreferences = {
  bookingStatus: true,
  providerArrival: true,
  completionAndReview: true,
  promotions: false,
  inAppAlerts: true,
  pushEnabled: false // Indicates push requires FCM configuration
};

const DEFAULT_APP_SETTINGS: UserAppSettings = {
  language: 'en',
  theme: 'system',
  currency: 'LKR',
  locationPermission: true,
  fontSize: 'normal'
};

const INITIAL_PRICING_RULES: AdminPricingRules = {
  minCalloutFeeLkr: 1000,
  maxCalloutFeeLkr: 10000,
  platformCommissionPercent: 10,
  travelFeeEnabled: true,
  defaultEmergencyMultiplier: 1.5
};

const INITIAL_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Pipes, taps, toilet cisterns, leaks, water tank repair, and drainage solutions.',
    iconName: 'Wrench',
    baseCalloutFeeLkr: 1500,
    typicalHourlyRateLkr: 1200,
    emergencyMultiplier: 1.5,
    isActive: true,
    popularTasks: ['Leaking tap repair', 'Sink drain unblocking', 'Water pump service', 'Overhead tank float valve']
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    slug: 'electrical',
    description: 'Wiring, circuit breakers, main switches, light fittings, ceiling fans, and power trip fixes.',
    iconName: 'Zap',
    baseCalloutFeeLkr: 1800,
    typicalHourlyRateLkr: 1500,
    emergencyMultiplier: 1.6,
    isActive: true,
    popularTasks: ['Main switch breaker tripping', 'Ceiling fan installation', 'Socket replacement', 'Short circuit detection']
  },
  {
    id: 'cat-ac',
    name: 'AC & Refrigeration',
    slug: 'ac-refrigeration',
    description: 'Inverter AC cleaning, gas refills, compressor diagnosis, and refrigerator cooling repair.',
    iconName: 'Snowflake',
    baseCalloutFeeLkr: 2500,
    typicalHourlyRateLkr: 1800,
    emergencyMultiplier: 1.4,
    isActive: true,
    popularTasks: ['AC regular chemical wash', 'Gas leakage check', 'Water dripping from indoor unit', 'Fridge thermostat repair']
  },
  {
    id: 'cat-carpentry',
    name: 'Carpentry',
    slug: 'carpentry',
    description: 'Door hinge fixes, lock replacements, furniture repairs, wooden windows, and cabinet fittings.',
    iconName: 'Hammer',
    baseCalloutFeeLkr: 1500,
    typicalHourlyRateLkr: 1300,
    emergencyMultiplier: 1.3,
    isActive: true,
    popularTasks: ['Door lock cylinder change', 'Loose pantry drawer repair', 'Wardrobe hinge adjustment', 'Wood restoration']
  },
  {
    id: 'cat-masonry',
    name: 'Masonry',
    slug: 'masonry',
    description: 'Wall plastering, tile replacement, crack repair, bathroom waterproofing, and cement work.',
    iconName: 'Layers',
    baseCalloutFeeLkr: 2000,
    typicalHourlyRateLkr: 1400,
    emergencyMultiplier: 1.2,
    isActive: true,
    popularTasks: ['Bathroom tile crack repair', 'Wall dampness patch', 'Small brickwork', 'Grouting renewal']
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    slug: 'painting',
    description: 'Interior wall painting, weather shield exterior, wood varnish, and enamel coating.',
    iconName: 'Paintbrush',
    baseCalloutFeeLkr: 1500,
    typicalHourlyRateLkr: 1100,
    emergencyMultiplier: 1.2,
    isActive: true,
    popularTasks: ['Single room repaint', 'Water stain primer & coat', 'Gate anti-rust paint', 'Door varnishing']
  },
  {
    id: 'cat-appliance',
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    description: 'Washing machines, microwave ovens, induction cookers, water heaters, and blenders.',
    iconName: 'Tv',
    baseCalloutFeeLkr: 1800,
    typicalHourlyRateLkr: 1400,
    emergencyMultiplier: 1.3,
    isActive: true,
    popularTasks: ['Washing machine spin issue', 'Microwave heating fault', 'Geyser water heater check', 'Induction error']
  },
  {
    id: 'cat-cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep house cleaning, move-out cleaning, sofa shampooing, and water sump scrubbing.',
    iconName: 'Sparkles',
    baseCalloutFeeLkr: 2000,
    typicalHourlyRateLkr: 1200,
    emergencyMultiplier: 1.3,
    isActive: true,
    popularTasks: ['Full house deep clean', 'Sofa fabric wet vacuum', 'Kitchen grease degreasing', 'Sump disinfection']
  },
  {
    id: 'cat-gardening',
    name: 'Gardening & Landscaping',
    slug: 'gardening',
    description: 'Lawn mowing, tree trimming, garden weed clearing, and landscaping maintenance.',
    iconName: 'Flower2',
    baseCalloutFeeLkr: 1500,
    typicalHourlyRateLkr: 1000,
    emergencyMultiplier: 1.2,
    isActive: true,
    popularTasks: ['Grass cutting', 'Overgrown branch trimming', 'Bed weeding', 'Garden waste disposal']
  },
  {
    id: 'cat-other',
    name: 'Other Home Services',
    slug: 'other-services',
    description: 'CCTV installation, roof gutter clearing, pressure washing, pest spray, and miscellaneous repairs.',
    iconName: 'Home',
    baseCalloutFeeLkr: 1600,
    typicalHourlyRateLkr: 1200,
    emergencyMultiplier: 1.3,
    isActive: true,
    popularTasks: ['Roof gutter debris clean', 'High pressure patio wash', 'CCTV camera repositioning', 'Curtain rail mounting']
  }
];

const INITIAL_USERS: User[] = [
  // Admin
  {
    id: 'usr-admin-1',
    name: 'Dilrukshi Alwis',
    email: 'admin@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'ADMIN',
    phone: '+94 77 100 2000',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  // Customers
  {
    id: 'usr-cust-1',
    name: 'Dinuka Senanayake',
    email: 'dinuka@gmail.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'CUSTOMER',
    phone: '+94 77 234 5678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:30:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  {
    id: 'usr-cust-2',
    name: 'Nimalka Ranasinghe',
    email: 'nimalka@gmail.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'CUSTOMER',
    phone: '+94 71 890 1234',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-15T11:20:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  // Providers
  {
    id: 'usr-prov-1',
    name: 'Kasun Perera',
    email: 'kasun.plumber@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROVIDER',
    phone: '+94 77 555 1212',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-15T10:00:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  {
    id: 'usr-prov-2',
    name: 'Nuwan Silva',
    email: 'nuwan.electric@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROVIDER',
    phone: '+94 76 888 3434',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-18T14:00:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  {
    id: 'usr-prov-3',
    name: 'Tharindu Fernando',
    email: 'tharindu.ac@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROVIDER',
    phone: '+94 70 444 9876',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-05T08:45:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  {
    id: 'usr-prov-4',
    name: 'Dilshan Jayasuriya',
    email: 'dilshan.carpenter@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROVIDER',
    phone: '+94 78 333 4567',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-03-01T16:15:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  },
  {
    id: 'usr-prov-5',
    name: 'Chamari Atapattu',
    email: 'chamari.clean@helpdesk.lk',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROVIDER',
    phone: '+94 77 999 8888',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-10T12:00:00.000Z',
    notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
    appSettings: { ...DEFAULT_APP_SETTINGS }
  }
];

const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    userId: 'usr-cust-1',
    label: 'Home',
    addressLine: '45/2 Galle Road, Kollupitiya',
    city: 'Colombo 03',
    district: 'Colombo',
    latitude: 6.9061,
    longitude: 79.8528,
    isDefault: true
  },
  {
    id: 'addr-2',
    userId: 'usr-cust-1',
    label: 'Office',
    addressLine: 'Tower 2, World Trade Center, Echelon Square',
    city: 'Colombo 01',
    district: 'Colombo',
    latitude: 6.9344,
    longitude: 79.8433,
    isDefault: false
  },
  {
    id: 'addr-3',
    userId: 'usr-cust-2',
    label: 'Villa',
    addressLine: "12 Gregory's Road",
    city: 'Colombo 07',
    district: 'Colombo',
    latitude: 6.9112,
    longitude: 79.8702,
    isDefault: true
  }
];

const INITIAL_PROVIDERS: ProviderProfile[] = [
  {
    id: 'prv-1',
    userId: 'usr-prov-1',
    businessName: 'Perera Master Plumbing Solutions',
    categoryIds: ['cat-plumbing'],
    experienceYears: 12,
    bio: 'NVQ Level 4 Certified Master Plumber with over 12 years of residential & commercial plumbing experience across Colombo. Specializes in leak detection, pressure pumps, and emergency drainage clearing.',
    serviceAreas: ['Colombo 01-15', 'Dehiwala', 'Rajagiriya', 'Battaramulla', 'Nawala'],
    workingHours: '7:00 AM - 8:00 PM (Emergency 24/7)',
    baseRateLkr: 1500,
    calloutFeeLkr: 1500,
    categoryPricing: {
      'cat-plumbing': {
        categoryId: 'cat-plumbing',
        baseCalloutFeeLkr: 1500,
        hourlyRateLkr: 1200,
        travelFeePerKmLkr: 50,
        lastUpdatedAt: '2026-01-16T14:30:00.000Z'
      }
    },
    languagesSpoken: ['Sinhala', 'English'],
    preferredContactMethod: 'PHONE',
    qualifications: ['NVQ Level 4 Plumbing License', 'National Police Clearance Certificate'],
    maxServiceDistanceKm: 20,
    verificationStatus: 'APPROVED',
    verificationNotes: 'National ID verified, NVQ certificate verified, clean police clearance certificate inspected.',
    verificationDate: '2026-01-16T14:30:00.000Z',
    isOnline: true,
    rating: 4.9,
    reviewCount: 48,
    completedJobsCount: 152,
    nationalIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    certificateUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
    portfolio: [
      {
        id: 'port-1-1',
        title: 'Master Bathroom Concealed Pipe Replacement',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
        description: 'Repaired underground main valve leak without damaging marble floor tiles.'
      },
      {
        id: 'port-1-2',
        title: 'Automatic Water Tank Float System',
        imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80',
        description: 'Installed 1000L tank stainless valve and high-pressure sensor pump.'
      }
    ],
    latitude: 6.9085,
    longitude: 79.8580
  },
  {
    id: 'prv-2',
    userId: 'usr-prov-2',
    businessName: 'Nuwan Spark Electrical Services',
    categoryIds: ['cat-electrical', 'cat-appliance'],
    experienceYears: 9,
    bio: 'CEB certified wireman specializing in single-phase and three-phase domestic electrical systems, surge protection, trip troubleshooting, and domestic appliance circuitry.',
    serviceAreas: ['Colombo 03-08', 'Nugegoda', 'Maharagama', 'Kotte', 'Dehiwala'],
    workingHours: '8:00 AM - 7:00 PM',
    baseRateLkr: 1800,
    calloutFeeLkr: 1800,
    categoryPricing: {
      'cat-electrical': {
        categoryId: 'cat-electrical',
        baseCalloutFeeLkr: 1800,
        hourlyRateLkr: 1500,
        travelFeePerKmLkr: 60,
        lastUpdatedAt: '2026-01-20T10:15:00.000Z'
      },
      'cat-appliance': {
        categoryId: 'cat-appliance',
        baseCalloutFeeLkr: 1800,
        hourlyRateLkr: 1400,
        travelFeePerKmLkr: 60,
        lastUpdatedAt: '2026-01-20T10:15:00.000Z'
      }
    },
    languagesSpoken: ['Sinhala', 'English'],
    preferredContactMethod: 'IN_APP',
    qualifications: ['CEB Wireman License', 'Industrial Electrical Tech Diploma'],
    maxServiceDistanceKm: 15,
    verificationStatus: 'APPROVED',
    verificationNotes: 'CEB wireman license verified, identity documents validated.',
    verificationDate: '2026-01-20T10:15:00.000Z',
    isOnline: true,
    rating: 4.85,
    reviewCount: 36,
    completedJobsCount: 98,
    nationalIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    certificateUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
    portfolio: [
      {
        id: 'port-2-1',
        title: 'Complete Distribution Board (DB) Rewiring',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
        description: 'Replaced faulty RCCB breaker and balanced phase loads.'
      }
    ],
    latitude: 6.8920,
    longitude: 79.8750
  },
  {
    id: 'prv-3',
    userId: 'usr-prov-3',
    businessName: 'CoolBreeze Air Conditioning',
    categoryIds: ['cat-ac'],
    experienceYears: 7,
    bio: 'Expert in residential inverter air conditioning installation, chemical foam servicing, refrigerant gas recharging (R32 / R410a), and inverter PCB board repair.',
    serviceAreas: ['Colombo District', 'Gampaha', 'Kelaniya', 'Wattala'],
    workingHours: '8:30 AM - 6:30 PM',
    baseRateLkr: 2500,
    calloutFeeLkr: 2000,
    categoryPricing: {
      'cat-ac': {
        categoryId: 'cat-ac',
        baseCalloutFeeLkr: 2000,
        hourlyRateLkr: 1800,
        travelFeePerKmLkr: 70,
        lastUpdatedAt: '2026-02-06T15:00:00.000Z'
      }
    },
    languagesSpoken: ['Sinhala', 'English'],
    preferredContactMethod: 'PHONE',
    maxServiceDistanceKm: 25,
    verificationStatus: 'APPROVED',
    verificationNotes: 'Refrigeration tech certificate verified.',
    verificationDate: '2026-02-06T15:00:00.000Z',
    isOnline: true,
    rating: 4.8,
    reviewCount: 29,
    completedJobsCount: 84,
    nationalIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    certificateUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
    portfolio: [],
    latitude: 6.9400,
    longitude: 79.8700
  },
  {
    id: 'prv-4',
    userId: 'usr-prov-4',
    businessName: 'Dilshan Fine Woodcraft & Carpentry',
    categoryIds: ['cat-carpentry', 'cat-masonry'],
    experienceYears: 6,
    bio: 'Custom timber furniture repair, teak wood door fitting, lock installation, and masonry wall repairs. Freshly applied to HelpDesk platform!',
    serviceAreas: ['Moratuwa', 'Panadura', 'Dehiwala', 'Mount Lavinia'],
    workingHours: '8:00 AM - 5:00 PM',
    baseRateLkr: 1600,
    calloutFeeLkr: 1500,
    categoryPricing: {
      'cat-carpentry': {
        categoryId: 'cat-carpentry',
        baseCalloutFeeLkr: 1500,
        hourlyRateLkr: 1300,
        lastUpdatedAt: '2026-03-01T16:15:00.000Z'
      }
    },
    languagesSpoken: ['Sinhala'],
    preferredContactMethod: 'PHONE',
    maxServiceDistanceKm: 15,
    verificationStatus: 'PENDING_VERIFICATION',
    verificationNotes: 'Registration documents submitted. Awaiting National ID & Police clearance verification by admin.',
    isOnline: false,
    rating: 0,
    reviewCount: 0,
    completedJobsCount: 0,
    nationalIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    certificateUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
    portfolio: [],
    latitude: 6.8350,
    longitude: 79.8820
  },
  {
    id: 'prv-5',
    userId: 'usr-prov-5',
    businessName: 'CleanHome Sri Lanka',
    categoryIds: ['cat-cleaning'],
    experienceYears: 8,
    bio: 'Eco-friendly deep cleaning service using industrial steam equipment. Specializing in move-in/move-out deep sanitization, sofa shampooing, and kitchen grease extraction.',
    serviceAreas: ['Colombo 01-15', 'Rajagiriya', 'Battaramulla', 'Pelawatte'],
    workingHours: '8:00 AM - 6:00 PM',
    baseRateLkr: 2000,
    calloutFeeLkr: 2000,
    categoryPricing: {
      'cat-cleaning': {
        categoryId: 'cat-cleaning',
        baseCalloutFeeLkr: 2000,
        hourlyRateLkr: 1200,
        lastUpdatedAt: '2026-02-12T09:00:00.000Z'
      }
    },
    languagesSpoken: ['Sinhala', 'English', 'Tamil'],
    preferredContactMethod: 'IN_APP',
    maxServiceDistanceKm: 20,
    verificationStatus: 'APPROVED',
    verificationNotes: 'Business registration and hygiene certifications verified.',
    verificationDate: '2026-02-12T09:00:00.000Z',
    isOnline: true,
    rating: 4.95,
    reviewCount: 52,
    completedJobsCount: 168,
    nationalIdUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    certificateUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
    portfolio: [],
    latitude: 6.9010,
    longitude: 79.8650
  }
];

const INITIAL_BOOKINGS: ServiceRequest[] = [
  {
    id: 'req-101',
    bookingReference: 'HD-2026-8941',
    customerId: 'usr-cust-1',
    providerId: 'prv-1',
    categoryId: 'cat-plumbing',
    title: 'Severe water leak under kitchen sink',
    description: 'The kitchen sink drain pipe has cracked and water is flooding into the wooden cupboards every time we run the tap. Urgent help needed.',
    urgency: 'EMERGENCY',
    address: '45/2 Galle Road, Kollupitiya',
    city: 'Colombo 03',
    district: 'Colombo',
    latitude: 6.9061,
    longitude: 79.8528,
    preferredDate: '2026-10-09',
    preferredTime: 'Immediate / ASAP',
    additionalInstructions: 'Please ring the front bell; dog is kept locked inside.',
    attachments: [
      {
        id: 'att-1',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'Cracked PVC siphon pipe under sink'
      }
    ],
    aiClassifiedCategory: 'Plumbing',
    aiSafetyWarning: 'Turn off the main isolation valve beneath the sink or the house main supply stopcock immediately to prevent water damage.',
    aiEstimatedUrgency: 'EMERGENCY',
    status: 'IN_PROGRESS',
    pricingSnapshot: {
      baseCalloutFeeLkr: 2250,
      hourlyRateLkr: 1200,
      urgencyMultiplier: 1.5,
      estimatedLaborHours: 2,
      travelFeeLkr: 0,
      estimatedSubtotalLkr: 4650,
      platformFeeLkr: 465
    },
    calloutFeeLkr: 2250,
    laborChargesLkr: 2500,
    materialCostsLkr: 1800,
    additionalCostsLkr: 1800,
    additionalCostNotes: 'Replaced flexible PVC trap and angle valve.',
    additionalChargeProposals: [
      {
        id: 'prop-1',
        description: 'New high-pressure PVC siphon trap & angle stopcock',
        amountLkr: 1800,
        category: 'MATERIALS',
        proposedAt: '2026-10-09T06:50:00.000Z',
        status: 'APPROVED',
        customerNotes: 'Approved via customer prompt'
      }
    ],
    travelFeeLkr: 0,
    totalAmountLkr: 6550,
    platformCommissionLkr: 655,
    acceptedAt: '2026-10-09T06:15:00.000Z',
    journeyStartedAt: '2026-10-09T06:25:00.000Z',
    arrivedAt: '2026-10-09T06:40:00.000Z',
    workStartedAt: '2026-10-09T06:45:00.000Z',
    completionPhotos: [],
    createdAt: '2026-10-09T06:05:00.000Z',
    updatedAt: '2026-10-09T06:45:00.000Z'
  },
  {
    id: 'req-102',
    bookingReference: 'HD-2026-7812',
    customerId: 'usr-cust-2',
    providerId: 'prv-2',
    categoryId: 'cat-electrical',
    title: 'Main circuit breaker trips when ceiling fan turns on',
    description: 'Whenever we switch on the master bedroom ceiling fan, the main trip switch cuts off the power to the entire second floor.',
    urgency: 'NORMAL',
    address: "12 Gregory's Road",
    city: 'Colombo 07',
    district: 'Colombo',
    latitude: 6.9112,
    longitude: 79.8702,
    preferredDate: '2026-10-09',
    preferredTime: '10:00 AM - 12:00 PM',
    attachments: [],
    aiClassifiedCategory: 'Electrical',
    aiSafetyWarning: 'Do not repeatedly force the breaker back on if it continues tripping. Leave the switch off until inspected.',
    aiEstimatedUrgency: 'NORMAL',
    status: 'COMPLETED',
    pricingSnapshot: {
      baseCalloutFeeLkr: 1800,
      hourlyRateLkr: 1500,
      urgencyMultiplier: 1.0,
      estimatedLaborHours: 1.5,
      travelFeeLkr: 0,
      estimatedSubtotalLkr: 4050,
      platformFeeLkr: 405
    },
    calloutFeeLkr: 1800,
    laborChargesLkr: 2200,
    materialCostsLkr: 950,
    additionalCostsLkr: 950,
    additionalCostNotes: 'Replaced faulty ceiling fan capacitor and regulator.',
    additionalChargeProposals: [
      {
        id: 'prop-2',
        description: 'KDK original 3.5uF ceiling fan capacitor',
        amountLkr: 950,
        category: 'MATERIALS',
        proposedAt: '2026-10-08T10:15:00.000Z',
        status: 'APPROVED',
        customerNotes: 'Approved by customer'
      }
    ],
    travelFeeLkr: 0,
    totalAmountLkr: 4950,
    platformCommissionLkr: 495,
    acceptedAt: '2026-10-08T09:10:00.000Z',
    journeyStartedAt: '2026-10-08T09:40:00.000Z',
    arrivedAt: '2026-10-08T10:00:00.000Z',
    workStartedAt: '2026-10-08T10:05:00.000Z',
    completionSubmittedAt: '2026-10-08T11:15:00.000Z',
    completionConfirmedAt: '2026-10-08T11:30:00.000Z',
    completionNotes: 'Found shorted capacitor in the regulator box. Replaced capacitor and checked insulation resistance.',
    completionPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80'
    ],
    createdAt: '2026-10-08T08:50:00.000Z',
    updatedAt: '2026-10-08T11:30:00.000Z'
  },
  {
    id: 'req-103',
    bookingReference: 'HD-2026-9204',
    customerId: 'usr-cust-1',
    categoryId: 'cat-ac',
    title: 'Living room AC blowing warm air and humming',
    description: 'Panasonic 18000 BTU inverter AC is running but not cooling at all. Air coming out is room temperature.',
    urgency: 'NORMAL',
    address: '45/2 Galle Road, Kollupitiya',
    city: 'Colombo 03',
    district: 'Colombo',
    latitude: 6.9061,
    longitude: 79.8528,
    preferredDate: '2026-10-10',
    preferredTime: '2:00 PM - 4:00 PM',
    attachments: [],
    aiClassifiedCategory: 'AC and Refrigeration',
    aiSafetyWarning: 'Turn the air conditioner unit off at the isolator switch to prevent compressor motor burnout.',
    aiEstimatedUrgency: 'NORMAL',
    status: 'PENDING',
    pricingSnapshot: {
      baseCalloutFeeLkr: 2000,
      hourlyRateLkr: 1800,
      urgencyMultiplier: 1.0,
      estimatedLaborHours: 1,
      travelFeeLkr: 0,
      estimatedSubtotalLkr: 2000,
      platformFeeLkr: 200
    },
    calloutFeeLkr: 2000,
    laborChargesLkr: 0,
    materialCostsLkr: 0,
    additionalCostsLkr: 0,
    additionalChargeProposals: [],
    travelFeeLkr: 0,
    totalAmountLkr: 2000,
    platformCommissionLkr: 200,
    completionPhotos: [],
    createdAt: '2026-10-09T07:15:00.000Z',
    updatedAt: '2026-10-09T07:15:00.000Z'
  }
];

const INITIAL_STATUS_HISTORY: BookingStatusHistory[] = [
  {
    id: 'bsh-1',
    bookingId: 'req-101',
    fromStatus: 'PENDING',
    toStatus: 'ACCEPTED',
    changedByUserId: 'usr-prov-1',
    changedByRole: 'PROVIDER',
    note: 'Kasun Perera accepted the emergency plumbing request.',
    timestamp: '2026-10-09T06:15:00.000Z'
  },
  {
    id: 'bsh-2',
    bookingId: 'req-101',
    fromStatus: 'ACCEPTED',
    toStatus: 'ON_THE_WAY',
    changedByUserId: 'usr-prov-1',
    changedByRole: 'PROVIDER',
    note: 'Kasun started journey to customer location in Kollupitiya.',
    timestamp: '2026-10-09T06:25:00.000Z'
  },
  {
    id: 'bsh-2b',
    bookingId: 'req-101',
    fromStatus: 'ON_THE_WAY',
    toStatus: 'ARRIVED',
    changedByUserId: 'usr-prov-1',
    changedByRole: 'PROVIDER',
    note: 'Kasun arrived at the customer premises.',
    timestamp: '2026-10-09T06:40:00.000Z'
  },
  {
    id: 'bsh-3',
    bookingId: 'req-101',
    fromStatus: 'ARRIVED',
    toStatus: 'IN_PROGRESS',
    changedByUserId: 'usr-prov-1',
    changedByRole: 'PROVIDER',
    note: 'Began disassembling kitchen sink drainage.',
    timestamp: '2026-10-09T06:45:00.000Z'
  },
  {
    id: 'bsh-4',
    bookingId: 'req-102',
    fromStatus: 'PENDING',
    toStatus: 'ACCEPTED',
    changedByUserId: 'usr-prov-2',
    changedByRole: 'PROVIDER',
    note: 'Nuwan Silva accepted the electrical request.',
    timestamp: '2026-10-08T09:10:00.000Z'
  },
  {
    id: 'bsh-5',
    bookingId: 'req-102',
    fromStatus: 'ACCEPTED',
    toStatus: 'ON_THE_WAY',
    changedByUserId: 'usr-prov-2',
    changedByRole: 'PROVIDER',
    note: 'Nuwan on the way.',
    timestamp: '2026-10-08T09:40:00.000Z'
  },
  {
    id: 'bsh-5b',
    bookingId: 'req-102',
    fromStatus: 'ON_THE_WAY',
    toStatus: 'ARRIVED',
    changedByUserId: 'usr-prov-2',
    changedByRole: 'PROVIDER',
    note: 'Nuwan arrived at Colombo 07 premises.',
    timestamp: '2026-10-08T10:00:00.000Z'
  },
  {
    id: 'bsh-6',
    bookingId: 'req-102',
    fromStatus: 'ARRIVED',
    toStatus: 'IN_PROGRESS',
    changedByUserId: 'usr-prov-2',
    changedByRole: 'PROVIDER',
    note: 'Inspection of ceiling fan regulator circuit initiated.',
    timestamp: '2026-10-08T10:05:00.000Z'
  },
  {
    id: 'bsh-7',
    bookingId: 'req-102',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'AWAITING_CUSTOMER_CONFIRMATION',
    changedByUserId: 'usr-prov-2',
    changedByRole: 'PROVIDER',
    note: 'Replaced faulty capacitor and tested. Work submitted for customer sign-off.',
    timestamp: '2026-10-08T11:15:00.000Z'
  },
  {
    id: 'bsh-8',
    bookingId: 'req-102',
    fromStatus: 'AWAITING_CUSTOMER_CONFIRMATION',
    toStatus: 'COMPLETED',
    changedByUserId: 'usr-cust-2',
    changedByRole: 'CUSTOMER',
    note: 'Customer verified and confirmed completed repair.',
    timestamp: '2026-10-08T11:30:00.000Z'
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'usr-cust-1',
    title: 'Professional Assigned',
    message: 'Kasun Perera has accepted your emergency plumbing request HD-2026-8941.',
    type: 'BOOKING_UPDATE',
    bookingId: 'req-101',
    isRead: false,
    createdAt: '2026-10-09T06:15:00.000Z'
  },
  {
    id: 'notif-2',
    userId: 'usr-cust-1',
    title: 'Work In Progress',
    message: 'Kasun Perera has arrived and started repair work at your Kollupitiya residence.',
    type: 'BOOKING_UPDATE',
    bookingId: 'req-101',
    isRead: false,
    createdAt: '2026-10-09T06:45:00.000Z'
  },
  {
    id: 'notif-3',
    userId: 'usr-cust-2',
    title: 'Service Completed',
    message: 'Nuwan Silva completed electrical repair HD-2026-7812. Thank you for your review!',
    type: 'BOOKING_UPDATE',
    bookingId: 'req-102',
    isRead: true,
    createdAt: '2026-10-08T11:30:00.000Z'
  },
  {
    id: 'notif-4',
    userId: 'usr-admin-1',
    title: 'New Provider Verification',
    message: 'Dilshan Jayasuriya submitted documents for Carpentry & Masonry verification.',
    type: 'VERIFICATION',
    isRead: false,
    createdAt: '2026-03-01T16:15:00.000Z'
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    bookingId: 'req-102',
    customerId: 'usr-cust-2',
    providerId: 'prv-2',
    rating: 5,
    comment: 'Excellent and very prompt service! Nuwan arrived with all testing instruments, identified the shorted capacitor in under 15 minutes, and replaced it cleanly. Highly recommended for electrical work in Colombo.',
    response: 'Thank you Nimalka! Glad to restore smooth operation to your ceiling fan. Call anytime if you need electrical assistance.',
    responseAt: '2026-10-08T12:00:00.000Z',
    createdAt: '2026-10-08T11:35:00.000Z'
  }
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-1',
    bookingId: 'req-102',
    filedByUserId: 'usr-cust-2',
    filedByRole: 'CUSTOMER',
    againstUserId: 'usr-prov-2',
    subject: 'Billing inquiry regarding replacement part receipt',
    description: 'Wanted clarification on the warranty card for the replacement ceiling fan capacitor.',
    status: 'RESOLVED',
    resolutionNotes: 'Provider provided official 6-month manufacturer warranty slip via chat. Customer satisfied.',
    resolvedAt: '2026-10-08T14:00:00.000Z',
    createdAt: '2026-10-08T12:00:00.000Z'
  }
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    bookingId: 'req-101',
    senderId: 'usr-prov-1',
    senderName: 'Kasun Perera',
    senderRole: 'PROVIDER',
    text: 'Ayubowan Dinuka! I have packed my pipe inspection tools and replacement valves. I will reach your Kollupitiya location in approximately 15 minutes.',
    createdAt: '2026-10-09T07:15:00.000Z'
  },
  {
    id: 'msg-2',
    bookingId: 'req-101',
    senderId: 'usr-cust-1',
    senderName: 'Dinuka Senanayake',
    senderRole: 'CUSTOMER',
    text: 'Thank you Kasun! Please ring the bell at gate #45/2. The water main shutoff valve is currently turned off to avoid flooding.',
    createdAt: '2026-10-09T07:18:00.000Z'
  }
];

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        if (!loaded.chatMessages) {
          loaded.chatMessages = [...INITIAL_CHAT_MESSAGES];
        }
        return loaded;
      } catch (err) {
        console.error('Failed to parse database file, re-seeding:', err);
      }
    }
    return this.getInitialState();
  }

  private persist() {
    ensureDataDir();
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getInitialState(): DatabaseState {
    return {
      users: [...INITIAL_USERS],
      addresses: [...INITIAL_ADDRESSES],
      categories: [...INITIAL_CATEGORIES],
      providers: [...INITIAL_PROVIDERS],
      bookings: [...INITIAL_BOOKINGS],
      statusHistory: [...INITIAL_STATUS_HISTORY],
      notifications: [...INITIAL_NOTIFICATIONS],
      reviews: [...INITIAL_REVIEWS],
      complaints: [...INITIAL_COMPLAINTS],
      pricingRules: { ...INITIAL_PRICING_RULES },
      chatMessages: [...INITIAL_CHAT_MESSAGES]
    };
  }

  public resetToSeed(): DatabaseState {
    this.state = this.getInitialState();
    this.persist();
    return this.state;
  }

  // --- Users & Auth ---
  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const user: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
      notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
      appSettings: { ...DEFAULT_APP_SETTINGS }
    };
    this.state.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.persist();
    return user;
  }

  public updateNotificationPreferences(userId: string, prefs: Partial<UserNotificationPreferences>): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    user.notificationPreferences = {
      ...(user.notificationPreferences || DEFAULT_NOTIF_PREFS),
      ...prefs
    };
    this.persist();
    return user;
  }

  public updateAppSettings(userId: string, settings: Partial<UserAppSettings>): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    user.appSettings = {
      ...(user.appSettings || DEFAULT_APP_SETTINGS),
      ...settings
    };
    this.persist();
    return user;
  }

  public changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'User not found' };
    const valid = bcrypt.compareSync(oldPass, user.passwordHash);
    if (!valid) return { success: false, error: 'Current password is incorrect' };
    user.passwordHash = bcrypt.hashSync(newPass, 10);
    this.persist();
    return { success: true };
  }

  public deleteAccount(userId: string): { success: boolean; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'User not found' };
    // Remove user
    this.state.users = this.state.users.filter(u => u.id !== userId);
    // If provider, remove provider profile
    this.state.providers = this.state.providers.filter(p => p.userId !== userId);
    this.persist();
    return { success: true };
  }

  public getAllUsers(): User[] {
    return [...this.state.users];
  }

  // --- Addresses ---
  public getUserAddresses(userId: string): Address[] {
    return this.state.addresses.filter(a => a.userId === userId);
  }

  public addAddress(address: Omit<Address, 'id'>): Address {
    const id = `addr-${Date.now()}`;
    const newAddr: Address = { ...address, id };
    if (newAddr.isDefault) {
      this.state.addresses.forEach(a => {
        if (a.userId === newAddr.userId) a.isDefault = false;
      });
    }
    this.state.addresses.push(newAddr);
    this.persist();
    return newAddr;
  }

  public setDefaultAddress(userId: string, addressId: string): Address | undefined {
    let target: Address | undefined;
    this.state.addresses.forEach(a => {
      if (a.userId === userId) {
        if (a.id === addressId) {
          a.isDefault = true;
          target = a;
        } else {
          a.isDefault = false;
        }
      }
    });
    this.persist();
    return target;
  }

  public deleteAddress(userId: string, addressId: string): boolean {
    const initialLen = this.state.addresses.length;
    this.state.addresses = this.state.addresses.filter(a => !(a.userId === userId && a.id === addressId));
    this.persist();
    return this.state.addresses.length < initialLen;
  }

  // --- Categories ---
  public getCategories(): ServiceCategory[] {
    return this.state.categories;
  }

  public getCategoryById(id: string): ServiceCategory | undefined {
    return this.state.categories.find(c => c.id === id || c.slug === id);
  }

  // --- Pricing Rules ---
  public getPricingRules(): AdminPricingRules {
    return this.state.pricingRules || INITIAL_PRICING_RULES;
  }

  public updatePricingRules(rules: Partial<AdminPricingRules>): AdminPricingRules {
    this.state.pricingRules = {
      ...(this.state.pricingRules || INITIAL_PRICING_RULES),
      ...rules
    };
    this.persist();
    return this.state.pricingRules;
  }

  // --- Providers ---
  public getProviders(): ProviderProfile[] {
    return this.state.providers;
  }

  public getProviderById(id: string): ProviderProfile | undefined {
    return this.state.providers.find(p => p.id === id || p.userId === id);
  }

  public createProviderProfile(profileData: Omit<ProviderProfile, 'id' | 'rating' | 'reviewCount' | 'completedJobsCount'>): ProviderProfile {
    const id = `prv-${Date.now()}`;
    const profile: ProviderProfile = {
      ...profileData,
      id,
      rating: 0,
      reviewCount: 0,
      completedJobsCount: 0,
      categoryPricing: profileData.categoryPricing || {},
      languagesSpoken: profileData.languagesSpoken || ['Sinhala', 'English'],
      portfolio: profileData.portfolio || []
    };
    this.state.providers.push(profile);
    this.persist();
    return profile;
  }

  public updateProviderProfile(id: string, updates: Partial<ProviderProfile>): ProviderProfile | undefined {
    const profile = this.getProviderById(id);
    if (!profile) return undefined;
    Object.assign(profile, updates);
    this.persist();
    return profile;
  }

  public updateProviderCategoryPricing(providerId: string, categoryId: string, pricing: { baseCalloutFeeLkr: number; hourlyRateLkr: number; travelFeePerKmLkr?: number }): ProviderProfile | undefined {
    const profile = this.getProviderById(providerId);
    if (!profile) return undefined;
    if (!profile.categoryPricing) profile.categoryPricing = {};
    
    // Validate against admin limits
    const rules = this.getPricingRules();
    const baseFee = Math.max(rules.minCalloutFeeLkr, Math.min(rules.maxCalloutFeeLkr, pricing.baseCalloutFeeLkr));

    profile.categoryPricing[categoryId] = {
      categoryId,
      baseCalloutFeeLkr: baseFee,
      hourlyRateLkr: pricing.hourlyRateLkr,
      travelFeePerKmLkr: pricing.travelFeePerKmLkr ?? 0,
      lastUpdatedAt: new Date().toISOString()
    };
    // Also update top-level calloutFeeLkr if matches main category
    if (profile.categoryIds[0] === categoryId) {
      profile.calloutFeeLkr = baseFee;
      profile.baseRateLkr = pricing.hourlyRateLkr;
    }
    this.persist();
    return profile;
  }

  public verifyProvider(providerId: string, status: ProviderVerificationStatus, notes?: string): ProviderProfile | undefined {
    const profile = this.getProviderById(providerId);
    if (!profile) return undefined;
    profile.verificationStatus = status;
    if (notes) profile.verificationNotes = notes;
    if (status === 'APPROVED') {
      profile.verificationDate = new Date().toISOString();
    }
    this.persist();

    this.createNotification({
      userId: profile.userId,
      title: `Account Verification: ${status}`,
      message: status === 'APPROVED' 
        ? 'Congratulations! Your HelpDesk service provider profile has been approved. You can now go online to receive service requests.'
        : `Your verification status has been updated to ${status}. Notes: ${notes || 'Contact admin support.'}`,
      type: 'VERIFICATION'
    });

    return profile;
  }

  // --- Bookings / Service Requests ---
  public getBookings(): ServiceRequest[] {
    return this.state.bookings;
  }

  public getBookingById(id: string): ServiceRequest | undefined {
    return this.state.bookings.find(b => b.id === id || b.bookingReference === id);
  }

  public getCustomerBookings(customerId: string): ServiceRequest[] {
    return this.state.bookings.filter(b => b.customerId === customerId);
  }

  public getProviderBookings(providerId: string): ServiceRequest[] {
    return this.state.bookings.filter(b => b.providerId === providerId);
  }

  public getOpenPendingRequests(categoryId?: string): ServiceRequest[] {
    return this.state.bookings.filter(b => {
      const isPending = b.status === 'PENDING' && !b.providerId;
      const matchesCat = !categoryId || b.categoryId === categoryId;
      return isPending && matchesCat;
    });
  }

  public createServiceRequest(requestData: Omit<ServiceRequest, 'id' | 'bookingReference' | 'status' | 'createdAt' | 'updatedAt' | 'platformCommissionLkr' | 'additionalChargeProposals' | 'materialCostsLkr' | 'travelFeeLkr'>): ServiceRequest {
    const id = `req-${Date.now()}`;
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `HD-2026-${randNum}`;
    const now = new Date().toISOString();

    const rules = this.getPricingRules();
    const commission = Math.round(requestData.totalAmountLkr * (rules.platformCommissionPercent / 100));

    const booking: ServiceRequest = {
      ...requestData,
      id,
      bookingReference,
      status: 'PENDING',
      materialCostsLkr: 0,
      additionalChargeProposals: [],
      travelFeeLkr: 0,
      platformCommissionLkr: commission,
      createdAt: now,
      updatedAt: now
    };

    this.state.bookings.unshift(booking);

    // Initial status history
    this.state.statusHistory.push({
      id: `bsh-${Date.now()}`,
      bookingId: id,
      fromStatus: 'PENDING',
      toStatus: 'PENDING',
      changedByUserId: requestData.customerId,
      changedByRole: 'CUSTOMER',
      note: 'Service request submitted by customer.',
      timestamp: now
    });

    // Notify customer
    this.createNotification({
      userId: requestData.customerId,
      title: 'Service Request Submitted',
      message: `Your ${requestData.urgency === 'EMERGENCY' ? 'EMERGENCY ' : ''}request ${bookingReference} has been placed. Nearby verified professionals are being notified.`,
      type: 'BOOKING_UPDATE',
      bookingId: id
    });

    this.persist();
    return booking;
  }

  // ATOMIC ACCEPTANCE OPERATION
  public acceptBooking(bookingId: string, providerId: string): { success: boolean; booking?: ServiceRequest; error?: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.status !== 'PENDING' || booking.providerId) {
      return { success: false, error: 'This booking has already been accepted by another provider or is no longer pending.' };
    }

    const provider = this.getProviderById(providerId);
    if (!provider) {
      return { success: false, error: 'Provider profile not found' };
    }

    if (provider.verificationStatus !== 'APPROVED') {
      return { success: false, error: 'Unverified providers cannot accept customer requests.' };
    }

    // Atomic assignment & Freeze pricing snapshot
    const now = new Date().toISOString();
    booking.providerId = provider.id;
    booking.status = 'ACCEPTED';
    booking.acceptedAt = now;
    booking.updatedAt = now;

    // Snapshot pricing from provider configured category pricing
    const catPricing = provider.categoryPricing?.[booking.categoryId];
    const baseCallout = catPricing?.baseCalloutFeeLkr || provider.calloutFeeLkr || booking.calloutFeeLkr;
    const hourly = catPricing?.hourlyRateLkr || provider.baseRateLkr || 1200;
    const rules = this.getPricingRules();
    const urgencyMult = booking.urgency === 'EMERGENCY' ? rules.defaultEmergencyMultiplier : 1.0;
    const effectiveCallout = Math.round(baseCallout * urgencyMult);

    booking.calloutFeeLkr = effectiveCallout;
    booking.pricingSnapshot = {
      baseCalloutFeeLkr: effectiveCallout,
      hourlyRateLkr: hourly,
      urgencyMultiplier: urgencyMult,
      estimatedLaborHours: 1.5,
      travelFeeLkr: 0,
      estimatedSubtotalLkr: effectiveCallout + Math.round(hourly * 1.5),
      platformFeeLkr: Math.round((effectiveCallout + Math.round(hourly * 1.5)) * (rules.platformCommissionPercent / 100))
    };
    booking.totalAmountLkr = effectiveCallout;
    booking.platformCommissionLkr = Math.round(effectiveCallout * (rules.platformCommissionPercent / 100));

    this.state.statusHistory.push({
      id: `bsh-${Date.now()}`,
      bookingId: booking.id,
      fromStatus: 'PENDING',
      toStatus: 'ACCEPTED',
      changedByUserId: provider.userId,
      changedByRole: 'PROVIDER',
      note: `Accepted by professional ${provider.businessName || 'Service Provider'}.`,
      timestamp: now
    });

    const providerUser = this.findUserById(provider.userId);
    const providerName = providerUser?.name || 'Your Service Provider';

    this.createNotification({
      userId: booking.customerId,
      title: 'Professional Accepted Your Request',
      message: `${providerName} has accepted your request ${booking.bookingReference}.`,
      type: 'BOOKING_UPDATE',
      bookingId: booking.id
    });

    this.persist();
    return { success: true, booking };
  }

  // LIFECYCLE STATUS TRANSITIONS
  public updateBookingStatus(
    bookingId: string,
    toStatus: BookingStatus,
    userId: string,
    role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN',
    metadata?: {
      note?: string;
      laborChargesLkr?: number;
      materialCostsLkr?: number;
      additionalCostsLkr?: number;
      additionalCostNotes?: string;
      completionNotes?: string;
      completionPhotos?: string[];
      cancellationReason?: string;
    }
  ): { success: boolean; booking?: ServiceRequest; error?: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    const fromStatus = booking.status;
    const now = new Date().toISOString();

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ['ACCEPTED', 'CANCELLED', 'REJECTED'],
      ACCEPTED: ['ON_THE_WAY', 'CANCELLED', 'REJECTED'],
      ON_THE_WAY: ['ARRIVED', 'IN_PROGRESS', 'CANCELLED'],
      ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['AWAITING_CUSTOMER_CONFIRMATION', 'CANCELLED'],
      AWAITING_CUSTOMER_CONFIRMATION: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: []
    };

    if (!validTransitions[fromStatus].includes(toStatus)) {
      return { success: false, error: `Invalid transition from ${fromStatus} to ${toStatus}.` };
    }

    if (toStatus === 'COMPLETED' && role === 'PROVIDER') {
      return { 
        success: false, 
        error: 'Providers cannot mark a booking as COMPLETED directly. You must mark it as AWAITING_CUSTOMER_CONFIRMATION for customer approval.' 
      };
    }

    booking.status = toStatus;
    booking.updatedAt = now;

    if (toStatus === 'ON_THE_WAY') {
      booking.journeyStartedAt = now;
      this.createNotification({
        userId: booking.customerId,
        title: 'Professional On The Way',
        message: `Your professional is travelling to your location for booking ${booking.bookingReference}.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking.id
      });
    } else if (toStatus === 'ARRIVED') {
      booking.arrivedAt = now;
      this.createNotification({
        userId: booking.customerId,
        title: 'Professional Arrived at Location',
        message: `Your professional has arrived at your address for booking ${booking.bookingReference}.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking.id
      });
    } else if (toStatus === 'IN_PROGRESS') {
      booking.workStartedAt = now;
      this.createNotification({
        userId: booking.customerId,
        title: 'Work Started',
        message: `Work has officially started for booking ${booking.bookingReference}.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking.id
      });
    } else if (toStatus === 'AWAITING_CUSTOMER_CONFIRMATION') {
      booking.completionSubmittedAt = now;
      if (metadata?.laborChargesLkr !== undefined) booking.laborChargesLkr = metadata.laborChargesLkr;
      if (metadata?.materialCostsLkr !== undefined) booking.materialCostsLkr = metadata.materialCostsLkr;
      if (metadata?.additionalCostsLkr !== undefined) booking.additionalCostsLkr = metadata.additionalCostsLkr;
      if (metadata?.additionalCostNotes) booking.additionalCostNotes = metadata.additionalCostNotes;
      if (metadata?.completionNotes) booking.completionNotes = metadata.completionNotes;
      if (metadata?.completionPhotos) booking.completionPhotos = metadata.completionPhotos;

      const subtotal = (booking.calloutFeeLkr || 0) + (booking.laborChargesLkr || 0) + (booking.materialCostsLkr || 0) + (booking.additionalCostsLkr || 0) + (booking.travelFeeLkr || 0);
      booking.totalAmountLkr = subtotal;
      const rules = this.getPricingRules();
      booking.platformCommissionLkr = Math.round(booking.totalAmountLkr * (rules.platformCommissionPercent / 100));

      this.createNotification({
        userId: booking.customerId,
        title: 'Service Completed — Please Confirm',
        message: `Your professional has marked booking ${booking.bookingReference} complete. Total: Rs. ${booking.totalAmountLkr.toLocaleString()}. Please review and confirm.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking.id
      });
    } else if (toStatus === 'COMPLETED') {
      booking.completionConfirmedAt = now;
      if (booking.providerId) {
        const prov = this.getProviderById(booking.providerId);
        if (prov) {
          prov.completedJobsCount += 1;
          this.createNotification({
            userId: prov.userId,
            title: 'Job Confirmed & Completed!',
            message: `Customer confirmed completion for booking ${booking.bookingReference}. Net earnings recorded: Rs. ${(booking.totalAmountLkr - booking.platformCommissionLkr).toLocaleString()}.`,
            type: 'BOOKING_UPDATE',
            bookingId: booking.id
          });
        }
      }
    } else if (toStatus === 'CANCELLED') {
      booking.cancelledAt = now;
      booking.cancellationReason = metadata?.cancellationReason || 'Cancelled by user';
      const targetUser = role === 'CUSTOMER' && booking.providerId 
        ? this.getProviderById(booking.providerId)?.userId 
        : booking.customerId;
      if (targetUser) {
        this.createNotification({
          userId: targetUser,
          title: 'Booking Cancelled',
          message: `Booking ${booking.bookingReference} was cancelled. Reason: ${booking.cancellationReason}`,
          type: 'BOOKING_UPDATE',
          bookingId: booking.id
        });
      }
    }

    this.state.statusHistory.push({
      id: `bsh-${Date.now()}`,
      bookingId: booking.id,
      fromStatus,
      toStatus,
      changedByUserId: userId,
      changedByRole: role,
      note: metadata?.note || `Status changed from ${fromStatus} to ${toStatus}.`,
      timestamp: now
    });

    this.persist();
    return { success: true, booking };
  }

  // --- Additional Cost Proposals Workflow ---
  public proposeAdditionalCost(bookingId: string, proposal: Omit<AdditionalChargeProposal, 'id' | 'proposedAt' | 'status'>): { success: boolean; booking?: ServiceRequest; error?: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    if (!['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(booking.status)) {
      return { success: false, error: 'Additional costs can only be proposed while job is in progress' };
    }

    const newProposal: AdditionalChargeProposal = {
      ...proposal,
      id: `prop-${Date.now()}`,
      proposedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL'
    };

    if (!booking.additionalChargeProposals) booking.additionalChargeProposals = [];
    booking.additionalChargeProposals.push(newProposal);

    // Notify customer
    this.createNotification({
      userId: booking.customerId,
      title: 'Additional Charge Proposal Received',
      message: `Technician proposed additional charge for ${proposal.category}: "${proposal.description}" (Rs. ${proposal.amountLkr.toLocaleString()}). Requires your review.`,
      type: 'BOOKING_UPDATE',
      bookingId: booking.id
    });

    this.persist();
    return { success: true, booking };
  }

  public respondToAdditionalCost(bookingId: string, proposalId: string, customerId: string, approved: boolean, customerNotes?: string): { success: boolean; booking?: ServiceRequest; error?: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };
    if (booking.customerId !== customerId) return { success: false, error: 'Unauthorized to respond to this proposal' };

    const proposal = booking.additionalChargeProposals?.find(p => p.id === proposalId);
    if (!proposal) return { success: false, error: 'Proposal not found' };

    if (proposal.status !== 'PENDING_APPROVAL') {
      return { success: false, error: 'Proposal has already been answered' };
    }

    proposal.status = approved ? 'APPROVED' : 'REJECTED';
    proposal.customerNotes = customerNotes;

    if (approved) {
      if (proposal.category === 'MATERIALS') {
        booking.materialCostsLkr = (booking.materialCostsLkr || 0) + proposal.amountLkr;
      } else {
        booking.additionalCostsLkr = (booking.additionalCostsLkr || 0) + proposal.amountLkr;
      }
      booking.totalAmountLkr = (booking.calloutFeeLkr || 0) + (booking.laborChargesLkr || 0) + (booking.materialCostsLkr || 0) + (booking.additionalCostsLkr || 0) + (booking.travelFeeLkr || 0);
      const rules = this.getPricingRules();
      booking.platformCommissionLkr = Math.round(booking.totalAmountLkr * (rules.platformCommissionPercent / 100));
    }

    if (booking.providerId) {
      const prov = this.getProviderById(booking.providerId);
      if (prov) {
        this.createNotification({
          userId: prov.userId,
          title: approved ? 'Additional Charge Approved! ✓' : 'Additional Charge Declined',
          message: `Customer ${approved ? 'approved' : 'declined'} your proposal for "${proposal.description}" (Rs. ${proposal.amountLkr.toLocaleString()}).`,
          type: 'BOOKING_UPDATE',
          bookingId: booking.id
        });
      }
    }

    this.persist();
    return { success: true, booking };
  }

  // --- Status History ---
  public getBookingHistory(bookingId: string): BookingStatusHistory[] {
    return this.state.statusHistory.filter(h => h.bookingId === bookingId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- Notifications ---
  public getNotifications(userId: string): Notification[] {
    return this.state.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newNotif: Notification = {
      ...notif,
      id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.state.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.state.notifications.find(n => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    this.persist();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.state.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.persist();
  }

  // --- Reviews ---
  public getProviderReviews(providerId: string): Review[] {
    return this.state.reviews.filter(r => r.providerId === providerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCustomerReviews(customerId: string): Review[] {
    return this.state.reviews.filter(r => r.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public submitReview(bookingId: string, customerId: string, rating: number, comment: string, tags?: string[]): { success: boolean; review?: Review; error?: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };
    if (booking.customerId !== customerId) return { success: false, error: 'Unauthorized to review this booking' };
    if (booking.status !== 'COMPLETED') return { success: false, error: 'Only completed bookings can be reviewed' };

    const existing = this.state.reviews.find(r => r.bookingId === bookingId);
    if (existing) return { success: false, error: 'A review has already been submitted for this booking' };

    if (!booking.providerId) return { success: false, error: 'No provider associated with this booking' };

    const review: Review = {
      id: `rev-${Date.now()}`,
      bookingId,
      customerId,
      providerId: booking.providerId,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    this.state.reviews.push(review);

    const providerReviews = this.state.reviews.filter(r => r.providerId === booking.providerId);
    const sum = providerReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = parseFloat((sum / providerReviews.length).toFixed(2));

    const prov = this.getProviderById(booking.providerId);
    if (prov) {
      prov.rating = avg;
      prov.reviewCount = providerReviews.length;
      
      this.createNotification({
        userId: prov.userId,
        title: 'New Review Received! ⭐',
        message: `Customer left a ${review.rating}-star review for booking ${booking.bookingReference}: "${review.comment.substring(0, 50)}..."`,
        type: 'REVIEW',
        bookingId: booking.id
      });
    }

    this.persist();
    return { success: true, review };
  }

  public respondToReview(reviewId: string, providerId: string, responseText: string): { success: boolean; review?: Review; error?: string } {
    const review = this.state.reviews.find(r => r.id === reviewId);
    if (!review) return { success: false, error: 'Review not found' };
    if (review.providerId !== providerId) return { success: false, error: 'Unauthorized to respond to this review' };

    review.response = responseText;
    review.responseAt = new Date().toISOString();
    this.persist();
    return { success: true, review };
  }

  // --- Complaints ---
  public getComplaints(): Complaint[] {
    return this.state.complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public submitComplaint(data: Omit<Complaint, 'id' | 'status' | 'createdAt'>): Complaint {
    const id = `cmp-${Date.now()}`;
    const comp: Complaint = {
      ...data,
      id,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    this.state.complaints.unshift(comp);

    const admins = this.state.users.filter(u => u.role === 'ADMIN');
    admins.forEach(admin => {
      this.createNotification({
        userId: admin.id,
        title: 'New Complaint Filed',
        message: `Complaint #${id} filed on booking for: "${data.subject}"`,
        type: 'SYSTEM',
        bookingId: data.bookingId
      });
    });

    this.persist();
    return comp;
  }

  public resolveComplaint(id: string, resolutionNotes: string, status: ComplaintStatus = 'RESOLVED'): Complaint | undefined {
    const complaint = this.state.complaints.find(c => c.id === id);
    if (!complaint) return undefined;
    complaint.status = status;
    complaint.resolutionNotes = resolutionNotes;
    complaint.resolvedAt = new Date().toISOString();
    this.persist();
    return complaint;
  }

  // --- Chat Messages ---
  public getBookingMessages(bookingId: string): ChatMessage[] {
    if (!this.state.chatMessages) this.state.chatMessages = [];
    return this.state.chatMessages
      .filter(m => m.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public sendBookingMessage(data: {
    bookingId: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    text: string;
  }): ChatMessage {
    if (!this.state.chatMessages) this.state.chatMessages = [];
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId: data.bookingId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      text: data.text,
      createdAt: new Date().toISOString()
    };
    this.state.chatMessages.push(msg);

    // Notify the other party
    const booking = this.getBookingById(data.bookingId);
    if (booking) {
      let recipientUserId: string | undefined;
      if (data.senderRole === 'CUSTOMER') {
        if (booking.providerId) {
          const prov = this.getProviderById(booking.providerId);
          recipientUserId = prov?.userId;
        }
      } else {
        recipientUserId = booking.customerId;
      }

      if (recipientUserId) {
        this.createNotification({
          userId: recipientUserId,
          title: `Message from ${data.senderName}`,
          message: data.text.length > 60 ? data.text.substring(0, 57) + '...' : data.text,
          type: 'BOOKING_UPDATE',
          bookingId: data.bookingId
        });
      }
    }

    this.persist();
    return msg;
  }
}

export const db = new Database();
