# HelpDesk — On-Demand Skilled Services Platform (Sri Lanka)

> *"Skilled Help, Right When You Need It."*

HelpDesk is a full-stack, AI-powered on-demand skilled home-services platform built for Sri Lanka. Inspired by the convenience and rapid dispatch workflows of top on-demand platforms, HelpDesk connects homeowners and businesses with verified local plumbers, electricians, AC technicians, carpenters, masons, painters, and cleaners across Colombo and beyond.

---

## 🌟 The Three Connected Panels

HelpDesk delivers three production-grade, connected panels communicating with the same Node.js / Express backend and persistent database:

1. **📱 Customer Mobile App**:
   - Location-aware home dashboard (Colombo 01-15, Kollupitiya, Cinnamon Gardens, Dehiwala, Rajagiriya).
   - **Google Gemini AI Problem Triage**: Type any household issue (e.g., *"Water leaking underneath my kitchen sink"* or *"Burning smell from wall socket"*) to receive automatic category classification, 1-sentence issue summary, and crucial safety precautions.
   - Interactive 10-trade directory (Plumbing, Electrical, AC & Refrigeration, Carpentry, Masonry, Painting, Appliance Repair, Cleaning, Gardening, Other Home Services).
   - Emergency dispatch toggle with real-time transparent rate multiplier.
   - Verified technician discovery with List View & Interactive Colombo Radar Map View.
   - **6-Step Live Booking Tracker**: Real-time status tracker (`PENDING` → `ACCEPTED` → `ON_THE_WAY` → `IN_PROGRESS` → `AWAITING_CUSTOMER_CONFIRMATION` → `COMPLETED`).
   - Customer confirmation sign-off & 1-5 star review engine.

2. **🛠️ Service Provider Mobile App**:
   - Verification status enforcement: Unapproved providers (`PENDING_VERIFICATION`) are blocked from going online or accepting customer jobs.
   - Online/Offline availability toggle.
   - **Live Job Radar**: Incoming dispatch feed matching technician skills.
   - **Atomic Job Acceptance**: Race-condition protected backend lock preventing duplicate acceptances.
   - Full lifecycle actions: `Start Journey` → `Start Work` → `Submit Final Invoice & Completion Notes`.

3. **💻 Admin Management Dashboard**:
   - Executive analytics: Total customers, active providers, active jobs, gross service volume (LKR), and platform commission (10%).
   - **Technician Verification Queue**: Review submitted national IDs, certificates, and police clearance reports before approving or rejecting.
   - Master bookings auditor with step-by-step history inspector.
   - Customer & provider dispute/complaint mediation portal.
   - User suspension & reactivation controls.

4. **🔀 Dual-Device Live Sync View**:
   - Side-by-side Customer + Provider view allowing instant end-to-end evaluation of the full 19-step acceptance criteria on a single screen!

---

## 🔑 Demo Accounts (Pre-Seeded & Ready)

Every account uses the default password: `password123`

| Name | Role | Email | Notes |
|---|---|---|---|
| **Dinuka Senanayake** | `CUSTOMER` | `dinuka@gmail.com` | Colombo 03; active emergency plumbing request |
| **Nimalka Ranasinghe** | `CUSTOMER` | `nimalka@gmail.com` | Colombo 07; completed electrical booking |
| **Kasun Perera** | `PROVIDER` | `kasun.plumber@helpdesk.lk` | Master Plumber (Approved, ⭐ 4.9); active in-progress job |
| **Nuwan Silva** | `PROVIDER` | `nuwan.electric@helpdesk.lk` | Licensed Electrician (Approved, ⭐ 4.85); ready online |
| **Dilshan Jayasuriya** | `PROVIDER` | `dilshan.carpenter@helpdesk.lk` | Carpenter (**Pending Verification**; test Admin approval) |
| **Dilrukshi Alwis** | `ADMIN` | `admin@helpdesk.lk` | Platform Administrator |

Use the **"Quick Switch Test Account"** dropdown in the top header for instant one-click login into any profile.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express.js, TypeScript, REST API
- **AI Integration**: `@google/genai` TypeScript SDK (model: `gemini-3.8-flash`) for server-side problem diagnosis and safety advisories
- **Database & Persistence**: Persistent database engine with transactions & audit logs; Sequelize migration (`database/migrations/`) & seeder (`database/seeders/`)
- **Authentication**: JWT token authorization, bcrypt password hashing, role-based access control (RBAC)

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Full-Stack Dev Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Acceptance Testing Flow

Follow these steps to test the end-to-end flow:
1. Open the **Dual Live Sync** tab (or switch between Customer and Provider panels).
2. As Customer Dinuka, type a household problem: *"Water leaking under kitchen sink"*.
3. Click **AI Diagnose** to view the safety warning and recommended Plumbing category.
4. Submit the emergency request.
5. Watch the request appear instantly on the Provider's Job Radar.
6. As Provider Kasun or Nuwan, click **Accept Job Request**.
7. Observe the Customer app immediately update to `ACCEPTED`.
8. Provider clicks **Start Journey** → Customer sees `ON_THE_WAY`.
9. Provider clicks **Arrived & Start Work** → Customer sees `IN_PROGRESS`.
10. Provider clicks **Mark Work Finished**, enters labor & parts (e.g. Rs. 2,500), and submits.
11. Customer reviews completion notes and clicks **Confirm Service Completion & Release**.
12. Customer submits a 5-star review with comments.
13. Switch to **Admin Dashboard** to inspect the completed booking and revenue statistics!
