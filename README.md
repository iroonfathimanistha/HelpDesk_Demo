# HelpDesk — On-Demand Skilled Services Platform (Sri Lanka)

> *"Skilled Help, Right When You Need It."*

HelpDesk is an AI-powered, on-demand home and facility maintenance platform engineered for the Sri Lankan service marketplace. It connects residential and commercial property owners with background-verified trade professionals including plumbers, electricians, air conditioning mechanics, carpenters, masons, painters, and appliance technicians across Colombo, Gampaha, Kandy, and Galle.

---

## 1. Problem Statement & Platform Goals

In Sri Lanka, finding reliable, certified trade technicians during household emergencies (such as a burst water pipe or short-circuited breaker) is notoriously fragmented, reliant on word-of-mouth, and fraught with opaque pricing:

1. **Unpredictable Pricing**: Customers are routinely overcharged without transparent hourly or callout baselines.
2. **Safety & Credential Uncertainty**: Unverified technicians enter private homes without background checks or verified certifications.
3. **Dispatch & Tracking Friction**: Customers have no real-time visibility into whether a technician has departed, arrived, or started work.
4. **Dispute Vulnerability**: Lack of itemized invoices for parts and labor leads to unresolved billing disputes.

**HelpDesk's Goals**:
- Provide instant mobile access with a native mobile look-and-feel for customers and service technicians.
- Enforce mandatory administrative background and certification approvals before any technician can accept jobs.
- Provide AI-driven triage (powered by Google Gemini) to identify trade categories, estimate urgency, and provide immediate safety precautions (such as shutting off the water stopcock).
- Provide a full 9-stage dispatch lifecycle with customer verification sign-off, itemized parts approval, and 5-star reviews.
- Provide a dedicated, professional desktop Web Admin Console for operations governance, dispute mediation, and pricing controls.

---

## 2. Main Features

- **📱 Customer Mobile Experience**:
  - Safe-area mobile layout with native Android/iOS status bar and bottom tab bar (`Home`, `My Jobs`, `Messages`, `Profile`).
  - Upfront trade directory (10 trades) with transparent base callout fees in Sri Lankan Rupees (LKR).
  - Normal vs. Emergency dispatch toggle (with 1.5x surge transparency).
  - Gemini AI Problem Triage: instant category classification and household safety advice.
  - Interactive Colombo radar map view and verified provider profiles.
  - Live 9-stage booking tracker with technician arrival ETA and live direct messaging.
  - Transparent itemized invoice review with one-tap approval/rejection for extra materials.
  - 5-star review and feedback engine with quality badges.

- **🛠️ Service Provider Mobile Experience**:
  - Verification state enforcement: unverified providers (`PENDING_VERIFICATION`) are blocked from accepting bookings until vetted by an Admin.
  - Real-time online/offline toggle.
  - Local job radar displaying eligible requests matching technician skill categories and coverage districts.
  - Single-action dispatch controls: `Accept Request` → `Start Journey` → `Arrived` → `Start Work` → `Propose Extra Material Cost` → `Submit Final Work for Customer Sign-off`.
  - Earnings tracker (daily gross, platform commission, net take-home).

- **💻 Admin Management Web Console**:
  - Desktop-optimized interface with KPI strip, revenue auditing, and dispatch metrics.
  - Technician Verification Queue: review national IDs, NVQ trade certificates, and police reports with 1-click Approve/Reject.
  - Master Booking Auditor: inspect step-by-step history and timestamps for every order.
  - Customer Dispute & Complaint Mediation Console with status tracking.
  - Real-time pricing & commission control rules.

- **🔀 Dual-Device Live Sync View**:
  - Split-screen customer and provider simulation allowing full end-to-end evaluation of the entire service lifecycle on a single display.

---

## 3. User Roles & Access Control

| Role | Interface | Primary Capabilities |
|---|---|---|
| **`CUSTOMER`** | Mobile App | Search services, submit requests, track technician GPS status, approve extra charges, confirm completion, rate technicians. |
| **`PROVIDER`** | Mobile App | Submit credentials, go online/offline, view nearby requests, accept jobs, execute dispatch stages, propose parts costs, submit invoices. Blocked from accepting jobs until approved. |
| **`ADMIN`** | Web Portal | Verify provider credentials, audit all service requests, resolve customer complaints, configure base pricing, suspend/reactivate accounts. |

---

## 4. Technology Stack

- **Mobile Client**: React Native architecture, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Web Admin Panel**: React 19, Vite, Tailwind CSS, Responsive Desktop Dashboard.
- **Backend**: Node.js, Express.js REST API.
- **Database**: PostgreSQL (Sequelize ORM models, migrations, and seeders) with a resilient JSON database fallback for zero-dependency local previews.
- **Authentication**: JWT (JSON Web Tokens), bcrypt password hashing, role-based authorization middleware.
- **AI Integration**: Google Gemini API (`@google/genai` SDK) for fault diagnosis and safety advice.

---

## 5. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Google Gemini API                               │
│              Fault Diagnosis • Safety Warnings • Triage                │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Server-Side SDK (@google/genai)
┌──────────────────────┐            │            ┌──────────────────────┐
│ Customer Mobile App  │◄───────────┴───────────►│ Provider Mobile App  │
│  (React Native/TS)   │                         │  (React Native/TS)   │
└──────────▲───────────┘                         └──────────▲───────────┘
           │                                                │
           │              REST API + Bearer JWT             │
           │                                                │
           └────────────────────────┬───────────────────────┘
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                 Node.js / Express Backend               │
       │  Auth • Booking State Machine • Persistence • AI Proxy  │
       └────────────────────────────▲────────────────────────────┘
                                    │
                                    ├──────────────────────────┐
                                    ▼                          ▼
       ┌────────────────────────────────────────┐ ┌───────────────────────────┐
       │       Admin Web Console (React.js)     │ │ PostgreSQL Database       │
       │   Provider Vetting • Disputes • Audits │ │ (Sequelize Models/Rules)  │
       └────────────────────────────────────────┘ └───────────────────────────┘
```

---

## 6. Project Folder Structure

```
├── .env.example                       # Template for environment secrets
├── package.json                       # Dependencies and operational scripts
├── server.ts                          # Full-stack Express backend & Vite dev server entry
├── test-e2e.js                        # Complete 35-step end-to-end audit test suite
├── database/
│   ├── migrations/
│   │   └── 20261009000001-create-helpdesk-tables.cjs # Sequelize DB migration
│   └── seeders/
│       └── 20261009000001-seed-demo-data.cjs         # Seed demo accounts and jobs
├── docs/
│   ├── ARCHITECTURE.md                # System design & lifecycle state machine
│   └── API_SPEC.md                    # Detailed REST API endpoints specification
├── src/
│   ├── App.tsx                        # Root router (clean mobile app container & admin routing)
│   ├── main.tsx                       # React DOM entry point
│   ├── components/
│   │   ├── mobile/                    # Native smartphone container & status bar
│   │   │   ├── MobileAppContainer.tsx # Authentic smartphone frame
│   │   │   ├── AndroidStatusBar.tsx   # Native status bar (carrier, battery, clock)
│   │   │   ├── CustomerMobileHeader.tsx # Clean customer mobile header
│   │   │   └── ProviderMobileHeader.tsx # Clean provider mobile header
│   │   ├── customer/                  # Customer mobile application screens
│   │   │   ├── CustomerApp.tsx        # Customer router & navigation
│   │   │   ├── LiveServiceTracker.tsx # 9-stage dispatch tracker & review modal
│   │   │   └── BookingProgressScreen.tsx
│   │   ├── provider/                  # Service provider mobile screens
│   │   │   ├── ProviderApp.tsx        # Provider dashboard & dispatch workflow
│   │   │   └── ProviderVerificationPendingScreen.tsx
│   │   ├── admin/                     # Web admin dashboard
│   │   │   └── AdminDashboard.tsx     # Full desktop management console
│   │   ├── common/                    # Shared components & Welcome / Auth screens
│   │   │   ├── WelcomeScreen.tsx      # Customer & Provider registration and login
│   │   │   └── ActionButton.tsx
│   │   └── sync/
│   │       └── DualView.tsx           # Customer + Provider side-by-side tester
│   ├── context/
│   │   └── AuthContext.tsx            # Session persistence & demo switchers
│   ├── server/                        # Express backend implementation
│   │   ├── db.ts                      # Database engine & relational state
│   │   ├── routes.ts                  # REST API endpoints & role authorization
│   │   └── ai.ts                      # Gemini AI triage service
│   ├── services/
│   │   └── api.ts                     # Frontend API client
│   └── types/
│       └── index.ts                   # Complete TypeScript domain contracts
```

---

## 7. Prerequisites & Required Software

- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.
- **PostgreSQL** (Optional for local development, recommended for production): v14 or higher.

---

## 8. Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd helpdesk
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the following in `.env`:
   ```ini
   PORT=3000
   JWT_SECRET="your-secure-jwt-secret-string"
   DATABASE_URL="postgresql://username:password@localhost:5432/helpdesk_db"
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

---

## 9. PostgreSQL Database Setup & Migrations

If running with a local PostgreSQL server:

1. **Create the database**:
   ```sql
   CREATE DATABASE helpdesk_db;
   ```

2. **Run Sequelize Migrations**:
   ```bash
   npx sequelize-cli db:migrate
   ```

3. **Seed Initial Demo Data**:
   ```bash
   npx sequelize-cli db:seed:all
   ```

*Note*: If `DATABASE_URL` is not supplied or PostgreSQL is offline during development, HelpDesk automatically runs using its built-in persistent storage engine located in `data/helpdesk-db.json`.

---

## 10. Startup Commands

All three platform experiences run seamlessly from the unified development server:

```bash
# Start full-stack development server on port 3000
npm run dev

# Run static type-checking and lint validation
npm run lint

# Build production bundle
npm run build

# Start production server
npm start

# Run end-to-end integration and API tests
npm test
```

### Accessing the Interfaces:
- **Default Entry**: Visit `http://localhost:3000` to launch the mobile preview.
- **Customer App**: Starts directly with the Customer mobile interface.
- **Provider App**: Starts directly with the Provider mobile interface.
- **Admin Web Console**: Click **"Admin Login Portal"** on the welcome screen or switch via the external Dev Preview Switcher.

---

## 11. Mobile API URL Configuration

When running HelpDesk on mobile devices or emulators, configure `VITE_API_URL` to point to the server:

- **Android Emulator**: `VITE_API_URL="http://10.0.2.2:3000/api"`
- **iOS Simulator**: `VITE_API_URL="http://localhost:3000/api"`
- **Physical Device (Same Wi-Fi)**: `VITE_API_URL="http://192.168.1.X:3000/api"`
- **Production Server**: `VITE_API_URL="https://api.yourdomain.lk/api"`

---

## 12. Authentication & Session Persistence

1. **Passwords**: Securely hashed on the backend using `bcryptjs` with salt rounds = 10. Plaintext passwords are never saved or returned.
2. **Tokens**: Signed JSON Web Tokens (JWT) containing `{ id, email, role }` with 7-day expiration.
3. **Session Persistence**: Stored via secure client-side storage (`localStorage` in web preview / `Expo SecureStore` in production mobile apps). Sessions automatically survive page refreshes and app restarts.
4. **Role Enforcement**: Server-side middleware (`authenticateToken` and `requireRole`) guards all restricted routes. Non-admin users cannot access admin endpoints even if they manipulate client-side state.

---

## 13. Pre-Seeded Test Accounts

Every demo account uses password: `password123`

| Name | Role | Email | Phone | Scenario Notes |
|---|---|---|---|---|
| **Dinuka Senanayake** | `CUSTOMER` | `dinuka@gmail.com` | `+94 77 234 5678` | Active emergency plumbing request in Kollupitiya |
| **Nimalka Ranasinghe** | `CUSTOMER` | `nimalka@gmail.com` | `+94 71 890 1234` | Completed electrical job with review |
| **Kasun Perera** | `PROVIDER` | `kasun.plumber@helpdesk.lk` | `+94 77 555 1212` | Approved Master Plumber (⭐ 4.9); active job |
| **Nuwan Silva** | `PROVIDER` | `nuwan.electric@helpdesk.lk` | `+94 77 444 3322` | Approved Electrician (⭐ 4.85); ready online |
| **Dilshan Jayasuriya** | `PROVIDER` | `dilshan.carpenter@helpdesk.lk`| `+94 77 333 9988` | **Pending Verification** (test Admin approval) |
| **Dilrukshi Alwis** | `ADMIN` | `admin@helpdesk.lk` | `+94 11 234 5678` | Platform Operations Lead |

---

## 14. Creating the First Admin Account Securely

To prevent privilege escalation, public registration endpoints only create `CUSTOMER` or `PROVIDER` accounts. To create an initial administrator:

1. **Via Database Seeder**: Run `npx sequelize-cli db:seed:all`, which provisions `admin@helpdesk.lk`.
2. **Via Backend Command**:
   ```bash
   node -e "
     const { db } = require('./src/server/db');
     const bcrypt = require('bcryptjs');
     db.createUser({
       name: 'Platform Superadmin',
       email: 'superadmin@helpdesk.lk',
       passwordHash: bcrypt.hashSync('YourSecurePassword', 10),
       role: 'ADMIN',
       phone: '+94 11 234 0000',
       status: 'ACTIVE'
     });
     console.log('Superadmin created successfully');
   "
   ```

---

## 15. The 9-Stage Service Request Lifecycle

```
[1. Request Submitted] ──► [2. Finding Provider] ──► [3. Provider Accepted]
                                                           │
                                                           ▼
[6. Work Started] ◄── [5. Provider Arrived] ◄── [4. Provider On the Way]
       │
       ├─► (Optional: Propose Extra Material Cost ──► Customer Approves)
       │
       ▼
[7. Work Completed by Provider] ──► [8. Awaiting Customer Sign-off]
                                                │
                                                ▼
                                    [9. Completed & 5-Star Review]
```

- Status transitions are validated on the backend.
- Providers cannot mark a job completed without submitting an itemized labor + parts breakdown.
- Jobs only reach `COMPLETED` when the customer confirms satisfaction.

---

## 16. Testing & Quality Verification

Run the automated test suite with:

```bash
npm test
```

The test runner validates 35 end-to-end scenarios:
- Server health check.
- Service category retrieval.
- Customer registration via dedicated `/api/auth/register/customer`.
- Duplicate registration rejection (400 Bad Request).
- Customer login via email and mobile phone number.
- Address management and app settings updates.
- Google Gemini AI diagnosis classification.
- Service request creation with reference ID generation.
- Service provider registration via `/api/auth/register/provider`.
- Rejection of unverified providers from accepting bookings.
- Admin authentication and provider account approval.
- Verified provider job acceptance and status transitions (`ON_THE_WAY` → `ARRIVED` → `IN_PROGRESS`).
- Extra material cost proposal and customer approval.
- Final completion sign-off and 5-star review submission.
- Customer support ticket creation and admin resolution.
- Role-based authorization protection (403 Forbidden for non-admins).

---

## 17. Troubleshooting & Common Questions

1. **Unwanted website header appeared**:
   - The root component (`App.tsx`) now directly mounts `MobileAppContainer` without any application-level website header. Dev preview switching is handled by a discreet floating pill on the desktop background.
2. **Provider cannot accept jobs**:
   - Verify that the provider account has been approved by the Admin (`verificationStatus: "APPROVED"`). Test provider `dilshan.carpenter@helpdesk.lk` is intentionally left pending to test admin approval.
3. **Database connection failed**:
   - Verify that PostgreSQL is running and credentials in `.env` match your PostgreSQL configuration. HelpDesk automatically falls back to `data/helpdesk-db.json` if PostgreSQL is not active.

---

## 18. Build & Deployment

To deploy HelpDesk as a production service:

```bash
# 1. Build client bundle
npm run build

# 2. Run database migrations on production DB
npx sequelize-cli db:migrate

# 3. Start Node.js production server
npm start
```
