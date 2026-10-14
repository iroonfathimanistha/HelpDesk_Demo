# HelpDesk REST API Specification

This document details all REST API endpoints provided by the HelpDesk Node.js/Express backend, their authentication requirements, payload formats, and status codes.

---

## Base URL & Headers

- **Base URL**: `/api` (or `http://localhost:3000/api` during local development)
- **JSON Body**: `Content-Type: application/json`
- **Authentication**: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register` (Generic Registration)
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Nimal Perera",
    "email": "nimal@example.com",
    "phone": "+94 77 123 4567",
    "password": "password123",
    "role": "CUSTOMER" // "CUSTOMER" or "PROVIDER"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "usr-...", "name": "Nimal Perera", "email": "nimal@example.com", "role": "CUSTOMER", ... },
    "message": "Customer registration successful!"
  }
  ```

### `POST /api/auth/register/customer` (Dedicated Customer Registration)
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Nimal Perera",
    "email": "nimal@example.com",
    "phone": "+94 77 123 4567",
    "password": "password123"
  }
  ```
- **Response (201 Created)**: Returns `{ token, user }`.

### `POST /api/auth/register/provider` (Dedicated Service Provider Registration)
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Kamal Silva",
    "email": "kamal.plumber@helpdesk.lk",
    "phone": "+94 77 987 6543",
    "password": "password123",
    "serviceCategoryIds": ["cat-plumbing"],
    "experienceYears": 5,
    "bio": "Certified master plumber with CEB & domestic pipe repair experience",
    "serviceAreas": ["Colombo 01-15 (Metro)"]
  }
  ```
- **Response (201 Created)**: Returns `{ token, user, providerProfile, message }` where `providerProfile.verificationStatus` is `"PENDING_VERIFICATION"`.

### `POST /api/auth/login`
- **Access**: Public
- **Body**: Supports login via email or mobile phone number:
  ```json
  {
    "email": "dinuka@gmail.com", // OR "phone": "+94 77 234 5678" OR "identifier": "..."
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { ... },
    "providerProfile": { ... } // included if user is a provider
  }
  ```

### `GET /api/auth/me`
- **Access**: Authenticated (`CUSTOMER`, `PROVIDER`, `ADMIN`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `{ "user": { ... }, "providerProfile": { ... } }`

### `POST /api/auth/logout`
- **Access**: Authenticated
- **Response (200 OK)**: `{ "message": "Logged out successfully" }`

### `POST /api/auth/switch-mode`
- **Access**: Authenticated multi-role accounts
- **Body**: `{ "targetRole": "CUSTOMER" | "PROVIDER" }`
- **Response (200 OK)**: `{ "user": { ... }, "message": "Switched active mode to ..." }`

---

## 2. Customer User Profile & Addresses (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | Fetch current user profile |
| `PUT` | `/api/users/me` | Authenticated | Update user name and phone |
| `GET` | `/api/users/addresses` | Authenticated | List customer saved locations |
| `POST` | `/api/users/addresses` | Authenticated | Save new home/office address |
| `PUT` | `/api/users/addresses/:id/default` | Authenticated | Mark address as primary |
| `DELETE` | `/api/users/addresses/:id` | Authenticated | Remove saved address |
| `PUT` | `/api/users/notification-preferences` | Authenticated | Update in-app alert flags |
| `PUT` | `/api/users/app-settings` | Authenticated | Update language, currency, theme |

---

## 3. Service Categories & AI Triage (`/api/categories`, `/api/ai`)

### `GET /api/categories`
- **Access**: Public
- **Response (200 OK)**: Array of 10 trade categories with base callout fees (LKR), hourly rates, icons, and popular tasks.

### `POST /api/ai/classify`
- **Access**: Authenticated
- **Body**: `{ "problemDescription": "Water spraying uncontrollably from kitchen valve" }`
- **Response (200 OK)**:
  ```json
  {
    "suggestedCategoryId": "cat-plumbing",
    "suggestedCategoryName": "Plumbing",
    "urgency": "EMERGENCY",
    "summary": "High-pressure freshwater pipe rupture requiring urgent isolation valve shutoff.",
    "safetyAdvice": "Immediately locate and close the main house stopcock valve to prevent structural flooding."
  }
  ```

---

## 4. Service Requests & Lifecycle Management (`/api/service-requests`)

### `POST /api/service-requests`
- **Access**: Authenticated Customer
- **Body**:
  ```json
  {
    "categoryId": "cat-plumbing",
    "title": "Kitchen drain cracked",
    "description": "Drain pipe has split open and water leaks under sink",
    "urgency": "EMERGENCY", // or "NORMAL"
    "address": "45 Galle Road, Kollupitiya",
    "city": "Colombo 03",
    "district": "Colombo",
    "preferredDate": "2026-10-15",
    "preferredTime": "10:00 AM"
  }
  ```
- **Response (201 Created)**: Returns created `ServiceRequest` with unique `bookingReference` (e.g. `HD-2026-8941`) and initial status `PENDING`.

### `GET /api/service-requests`
- **Access**: Authenticated (Filters by current user's role: customers see their requests; providers see eligible or assigned requests).

### `GET /api/service-requests/:id`
- **Access**: Authenticated customer or assigned provider / admin.

### `PUT /api/service-requests/:id/accept`
- **Access**: Authenticated Approved Provider (`PROVIDER`)
- **Pre-condition**: Provider must have `verificationStatus: "APPROVED"`.
- **Status Change**: `PENDING` → `ACCEPTED`.

### `PUT /api/service-requests/:id/status`
- **Access**: Assigned Provider
- **Body**: `{ "status": "ON_THE_WAY" | "ARRIVED" | "IN_PROGRESS" }`

### `POST /api/service-requests/:id/propose-cost`
- **Access**: Assigned Provider
- **Body**: `{ "description": "Replacement PVC elbow joint and seal tape", "amountLkr": 1450 }`
- **Response**: Creates additional charge proposal pending customer approval.

### `PUT /api/service-requests/:id/respond-cost`
- **Access**: Booking Customer
- **Body**: `{ "proposalId": "acp-...", "approved": true }`

### `PUT /api/service-requests/:id/complete`
- **Access**: Assigned Provider
- **Body**: `{ "completionNotes": "All leaks repaired and pressure tested", "finalLaborCostLkr": 1500, "materialCostLkr": 850 }`
- **Status Change**: Transitions request to `AWAITING_CUSTOMER_CONFIRMATION`.

### `PUT /api/service-requests/:id/confirm-completion`
- **Access**: Booking Customer
- **Status Change**: `AWAITING_CUSTOMER_CONFIRMATION` → `COMPLETED`.

### `POST /api/service-requests/:id/review`
- **Access**: Booking Customer (after completion)
- **Body**: `{ "rating": 5, "comment": "Excellent work, arrived very fast!", "tags": ["Punctual", "Cleaned Up", "Fair Pricing"] }`

### `PUT /api/service-requests/:id/cancel`
- **Access**: Customer or Provider (before work begins)
- **Body**: `{ "reason": "Change of schedule" }`
- **Status Change**: `CANCELLED`.

---

## 5. In-App Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | List notifications for the user |
| `PUT` | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | Authenticated | Mark all notifications read |

---

## 6. Admin Management (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | `ADMIN` Only | Platform KPIs, bookings count, gross volume, commission |
| `GET` | `/api/admin/pending-providers` | `ADMIN` Only | List providers awaiting credential inspection |
| `PUT` | `/api/admin/verify-provider` | `ADMIN` Only | Approve or reject provider registration |
| `GET` | `/api/admin/users` | `ADMIN` Only | List all platform users |
| `PUT` | `/api/admin/users/:id/status` | `ADMIN` Only | Suspend or reactivate user |
| `GET` | `/api/admin/complaints` | `ADMIN` Only | Audit customer/provider disputes |
| `PUT` | `/api/admin/complaints/:id/resolve`| `ADMIN` Only | Resolve dispute with resolution notes |
