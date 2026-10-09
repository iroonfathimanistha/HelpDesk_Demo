# HELPDESK ARCHITECTURE & SYSTEM DESIGN SPECIFICATION

**Tagline**: *"Skilled Help, Right When You Need It."*  
**Target Market**: Sri Lanka (Western Province, Central Province, Southern Province)  
**Currency**: Sri Lankan Rupee (LKR / Rs.)

---

## 1. High-Level System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │             Google Gemini API (AI)           │
                  │   Problem Triage • Safety Warning • Planning │
                  └───────────────────────▲──────────────────────┘
                                          │
                   HTTPS / JSON           │ Server-side SDK
                                          │ (@google/genai)
  ┌───────────────────────┐               │               ┌───────────────────────┐
  │  Customer Mobile App  │◄──────────────┴──────────────►│  Provider Mobile App  │
  │  (React / Expo / TS)  │                               │  (React / Expo / TS)  │
  └───────────▲───────────┘                               └───────────▲───────────┘
              │                                                       │
              │                 REST API + Bearer JWT                 │
              │                                                       │
              └───────────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        Node.js / Express Backend      │
                      │  Auth • Booking Engine • Push Notifs  │
                      └───────────────────▲───────────────────┘
                                          │
                                          │ REST API / Admin Auth
                                          ▼
                      ┌───────────────────────────────────────┐
                      │       Admin Management Dashboard      │
                      │   Queue Approval • Disputes • Audits  │
                      └───────────────────▲───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    PostgreSQL Database (Sequelize)    │
                      │  Relational Models • Transactions     │
                      └───────────────────────────────────────┘
```

---

## 2. Booking State Machine & Transition Rules

HelpDesk enforces strict lifecycle state transitions. A provider cannot jump straight to `COMPLETED` without customer confirmation:

```
               [Customer Submits]
                       │
                       ▼
                   [PENDING] ──────────────────────────┐
                       │                               │
            (Atomic Provider Accept)                   │ (Customer Cancel)
                       │                               │
                       ▼                               ▼
                  [ACCEPTED]                     [CANCELLED]
                       │                               ▲
             (Provider Start Journey)                  │
                       │                               │
                       ▼                               │
                 [ON_THE_WAY] ─────────────────────────┤
                       │                               │
              (Provider Arrived)                       │
                       │                               │
                       ▼                               │
                 [IN_PROGRESS] ────────────────────────┘
                       │
        (Provider Submits Labor + Parts)
                       │
                       ▼
        [AWAITING_CUSTOMER_CONFIRMATION]
                       │
          (Customer Confirms & Releases)
                       │
                       ▼
                  [COMPLETED]
                       │
            (Customer Rating & Review)
```

---

## 3. Data Dictionary & Primary Models

1. **User**: Identity record (`id`, `name`, `email`, `passwordHash`, `role: CUSTOMER | PROVIDER | ADMIN`, `phone`, `status`).
2. **ProviderProfile**: Pro credentials (`userId`, `businessName`, `categoryIds`, `experienceYears`, `bio`, `serviceAreas`, `verificationStatus: PENDING_VERIFICATION | APPROVED | REJECTED`, `rating`, `completedJobsCount`).
3. **ServiceCategory**: 10 distinct trades (Plumbing, Electrical, AC & Refrigeration, Carpentry, Masonry, Painting, Appliance Repair, Cleaning, Gardening, Other).
4. **ServiceRequest**: Core dispatch booking record (`bookingReference`, `customerId`, `providerId`, `urgency: NORMAL | EMERGENCY`, `status`, `calloutFeeLkr`, `laborChargesLkr`, `additionalCostsLkr`, `totalAmountLkr`).
5. **BookingStatusHistory**: Implements complete tamper-evident audit trail with user role and transition notes.
6. **Notification**: Real-time persisted notification items delivered to in-app notification center.
7. **Review**: 1-5 star customer ratings and qualitative reviews; updates provider cumulative score.
8. **Complaint**: Formal customer/technician grievances reviewed by administrators.

---

## 4. Test Accounts & Role Access Matrix

| Account Name | Email | Password | Role | State & Capabilities |
|---|---|---|---|---|
| **Dinuka Senanayake** | `dinuka@gmail.com` | `password123` | CUSTOMER | Has active emergency plumbing request in Kollupitiya |
| **Nimalka Ranasinghe** | `nimalka@gmail.com` | `password123` | CUSTOMER | Has completed electrical booking in Colombo 07 |
| **Kasun Perera** | `kasun.plumber@helpdesk.lk` | `password123` | PROVIDER | Approved Master Plumber (⭐ 4.9); active in-progress job |
| **Nuwan Silva** | `nuwan.electric@helpdesk.lk` | `password123` | PROVIDER | Approved Electrician (⭐ 4.85); ready on radar |
| **Dilshan Jayasuriya** | `dilshan.carpenter@helpdesk.lk` | `password123` | PROVIDER | **Pending Verification** (Awaiting Admin ID inspection) |
| **Dilrukshi Alwis** | `admin@helpdesk.lk` | `password123` | ADMIN | Full governance oversight & queue approvals |
