# GHS Residency Log Book System

A full-stack web application for the **Ghana Health Service (GHS)** that digitises the weekly activity log book for medical residents. Residents submit weekly reports documenting their clinical activities and competencies, and administrators review and provide feedback through a dedicated portal.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend](#backend)
- [Frontend](#frontend)
- [User Roles](#user-roles)
- [API Reference](#api-reference)

---

## Overview

The system has two distinct portals:

- **Resident Portal** — Residents create weekly reports, log daily activities and competencies acquired, save drafts, and submit for review. They can track the status of all their submissions and view feedback left by administrators.
- **Admin Portal** — Administrators get a live dashboard with analytics, manage residents, review submitted reports, leave feedback, and filter/search across all submissions.

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 3 | Utility-first styling |
| React Router DOM | 7 | Client-side routing |
| React Hook Form | 7 | Form state & validation |
| Axios | 1 | HTTP client |
| Lucide React | 1 | Icon library |
| React Icons | 5 | Additional icons (HI set) |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | 22 | Runtime |
| Express | 4 | HTTP server & routing |
| Mongoose | 8 | MongoDB ODM |
| bcryptjs | 2 | Password hashing |
| jsonwebtoken | 9 | JWT authentication |
| dotenv | 16 | Environment variable loading |
| nodemon | 3 | Dev auto-restart |

### Database
- **MongoDB Atlas** — Cloud-hosted MongoDB cluster

---

## Project Structure

```
log book/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js     # Resident CRUD + dashboard stats
│   │   ├── authController.js      # Register, login, profile
│   │   └── reportController.js    # Report CRUD + review logic
│   ├── middleware/
│   │   └── auth.js                # JWT protect, adminOnly, residentOnly
│   ├── models/
│   │   ├── User.js                # User schema (resident / admin)
│   │   └── WeeklyReport.js        # Weekly report schema
│   ├── routes/
│   │   ├── admin.js               # /api/admin routes
│   │   ├── auth.js                # /api/auth routes
│   │   └── reports.js             # /api/reports routes
│   ├── seed.js                    # Creates the default admin account
│   ├── server.js                  # Express app entry point
│   └── .env                       # Environment variables (not committed)
│
└── frontend/
    ├── public/
    │   └── favicon.svg            # Favicon
    ├── src/
    │   ├── components/
    │   │   ├── EmptyState.jsx     # Reusable empty list placeholder
    │   │   ├── LoadingSpinner.jsx # Full-page and inline spinner
    │   │   ├── Select.jsx         # Custom dropdown component
    │   │   ├── Sidebar.jsx        # Navigation sidebar (role-aware)
    │   │   ├── StatCard.jsx       # Metric card used across pages
    │   │   ├── StatusBadge.jsx    # Coloured status pill
    │   │   └── UnitBadge.jsx      # Clinical unit pill
    │   ├── context/
    │   │   └── AuthContext.jsx    # Auth state, login/logout/register
    │   ├── layouts/
    │   │   ├── AppLayout.jsx      # Main shell with sidebar + outlet
    │   │   ├── AuthLayout.jsx     # Split-panel auth shell with transitions
    │   │   └── ProtectedRoute.jsx # Role-based route guard
    │   ├── pages/
    │   │   ├── Login.jsx          # Sign-in form with typewriter heading
    │   │   ├── Register.jsx       # Sign-up form with department picker
    │   │   ├── Settings.jsx       # Profile + password change (shared)
    │   │   ├── admin/
    │   │   │   ├── Dashboard.jsx  # Analytics dashboard
    │   │   │   ├── Reports.jsx    # All reports with filters + table
    │   │   │   ├── Residents.jsx  # Resident management
    │   │   │   └── ReviewReport.jsx # Report detail + feedback form
    │   │   └── resident/
    │   │       ├── CreateReport.jsx # New weekly report form
    │   │       ├── ReportHistory.jsx # My reports list with filters
    │   │       └── ViewReport.jsx   # Report detail + feedback view
    │   ├── services/
    │   │   └── api.js             # Axios instance + all API calls
    │   ├── utils/
    │   │   └── helpers.js         # UNITS, DEPARTMENTS, date helpers
    │   ├── App.jsx                # Route definitions
    │   ├── index.css              # Global styles + animations
    │   └── main.jsx               # React entry point
    └── index.html                 # HTML shell
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### 1. Clone the repository
```bash
git clone <repository-url>
cd "log book"
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables) below), then start the server:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

### 3. Seed the admin account
Run this once to create the default administrator:
```bash
node seed.js
```
This creates:
- **Email:** `admin@ghs.gov.gh`
- **Password:** `Admin@1234`

### 4. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5174** and the backend on **http://localhost:5000**.

---

## Environment Variables

Create `backend/.env` with the following:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/logbook?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5174
```

---

## Backend

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new resident account |
| POST | `/login` | Public | Log in, returns JWT token |
| GET | `/me` | Protected | Get currently logged-in user |
| PUT | `/profile` | Protected | Update name, department, password |

**How auth works:**
1. On login/register, the server signs a JWT with the user's ID and role.
2. The token is stored in `localStorage` on the client.
3. Every subsequent request includes `Authorization: Bearer <token>` via an Axios interceptor.
4. The `protect` middleware verifies the token on every protected route.
5. `adminOnly` and `residentOnly` middleware further enforce role access.
6. If a token expires or is invalid, the client is automatically redirected to `/login`.

### Reports (`/api/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Resident | Create a new draft report |
| PUT | `/:id` | Resident | Update a draft report |
| PUT | `/:id/submit` | Resident | Submit a draft for review |
| DELETE | `/:id` | Resident | Delete a draft report |
| GET | `/my` | Resident | Get own reports (filterable) |
| GET | `/my/:id` | Resident | Get a single own report |
| GET | `/my/dashboard` | Resident | Get resident dashboard stats |
| GET | `/` | Admin | Get all reports (filterable) |
| GET | `/:id` | Admin | Get any single report |
| PUT | `/:id/review` | Admin | Submit admin feedback + mark reviewed |

**Report lifecycle:**
```
Draft → Submitted → Reviewed
```
- Drafts are private to the resident — admins never see them.
- Once submitted, the report appears in the admin portal.
- After review, the resident sees a "New feedback" notification.

**Filtering (admin `GET /`):**
- `status` — `submitted` or `reviewed`
- `unit` — clinical unit name
- `department` — resident's department
- `search` — matches resident name, email, or department
- `weekFrom` / `weekTo` — date range filter on `weekStartDate`

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Stats: residents, reports, pending, reviewed, dept breakdown, weekly trend |
| GET | `/residents` | List residents (searchable, filterable by department) |
| POST | `/residents` | Create a resident account |
| PUT | `/residents/:id` | Update a resident |
| DELETE | `/residents/:id` | Delete a resident and all their reports |

**Dashboard stats returned:**
- `totalResidents` — count of all resident users
- `totalReports` — submitted + reviewed (drafts excluded)
- `submitted` / `pendingReview` — awaiting admin review
- `reviewed` — completed reviews
- `deptBreakdown` — top 6 departments by submission count (aggregation)
- `weeklyTrend` — submission counts for the last 6 weeks

### Data Models

**User**
```
name          String   required
email         String   required, unique, lowercase
password      String   required, hashed (bcrypt, 12 rounds)
role          String   'resident' | 'admin'  (default: 'resident')
department    String   optional
createdAt     Date
updatedAt     Date
```

**WeeklyReport**
```
resident          ObjectId → User
unit              String
weekStartDate     Date      (always a Monday)
days              Map {
  monday / tuesday / wednesday / thursday / friday: {
    activities           String
    competenciesAcquired String
  }
}
additionalNotes   String
status            'draft' | 'submitted' | 'reviewed'
submittedAt       Date
adminFeedback     String
feedbackRead      Boolean   (false until resident opens the report)
reviewedAt        Date
reviewedBy        ObjectId → User
```

---

## Frontend

### Routing

Routes are split into three groups in `App.jsx`:

| Path | Component | Guard |
|---|---|---|
| `/login` | Login | Public |
| `/signup` | Register | Public |
| `/resident/reports/new` | CreateReport | Resident only |
| `/resident/reports` | ReportHistory | Resident only |
| `/resident/reports/:id` | ViewReport | Resident only |
| `/resident/settings` | Settings | Resident only |
| `/admin/dashboard` | AdminDashboard | Admin only |
| `/admin/residents` | Residents | Admin only |
| `/admin/reports` | Reports | Admin only |
| `/admin/reports/:id` | ReviewReport | Admin only |
| `/admin/settings` | Settings | Admin only |

`ProtectedRoute` checks the user's role. If a user tries to access a route for the wrong role, they are redirected to their own dashboard.

### Auth Flow

- `AuthContext` stores `user` and `token` in state and `localStorage`.
- On app load, the stored token is verified via `GET /api/auth/me`.
- `login()`, `logout()`, and `register()` are exposed via `useAuth()` hook.

### Auth Pages

Both `/login` and `/signup` share a single `AuthLayout` instance (via `key="auth"` in the router). This keeps the left panel mounted while animating only the right-side form content when switching between pages — exit animation plays for 230ms, then the form swaps, then an enter animation plays for 340ms.

The login heading cycles between **"Welcome."** and **"Hello!"** using a typewriter effect (types → pauses → deletes → repeats).

### Resident Pages

**New Report (`/resident/reports/new`)**
- Two-column layout on desktop: left sidebar (unit picker, week picker, progress bar) and right panel (day tabs Mon–Fri with activities, competencies, additional notes, and action buttons).
- Unit is a custom styled dropdown. Week Starting is a custom calendar picker that auto-snaps to the Monday of whichever day is clicked.
- Progress bar tracks how many days have activities filled in.
- **Save Draft** stores without submitting. **Submit Report** saves and immediately submits.
- Duplicate detection: creating a report for the same unit + week returns a 409 error.

**My Reports (`/resident/reports`)**
- Filterable by status (All / Draft / Submitted / Reviewed) and week (All time / This week / Custom date range).
- Each row shows a coloured left border by status, unit badge, and a "New feedback" indicator for unread reviews.

**View Report (`/resident/reports/:id`)**
- Read-only view of the submitted report.
- Shows admin feedback and review date if reviewed.
- Draft reports can be edited or deleted from this page.

### Admin Pages

**Dashboard (`/admin/dashboard`)**
- Personalised greeting with current date.
- 4 stat cards with animated count-up numbers.
- Weekly bar chart — last 6 weeks of submission activity, bars animate upward on load.
- SVG donut ring — reviewed vs pending review ratio, draws itself in on mount.
- Department breakdown — horizontal animated bars per department.
- Pending reviews list — quick access to reports awaiting feedback.

**All Reports (`/admin/reports`)**
- Searchable by resident name, email, or department.
- Filterable by status (All / Pending Review / Reviewed), department dropdown, unit dropdown, and week (All time / This week / Custom).
- Table columns: Resident, Department, Unit, Week, Submitted date, Status.
- Drafts are fully hidden from this view (enforced on both frontend and backend).

**Residents (`/admin/residents`)**
- Lists all registered residents with department and join date.
- Search by name/email/department. Filter by department.
- Admin can create, edit, or delete resident accounts.
- Deleting a resident also deletes all their reports.

**Review Report (`/admin/reports/:id`)**
- Full report detail view showing all five days, additional notes, resident info.
- Admin feedback textarea with submit button to mark as reviewed.

### Settings

Shared between both roles (`/admin/settings` and `/resident/settings`).
- Update display name.
- Change password (requires current password).
- Department field shown for residents only (not relevant for admins).

---

## User Roles

| Capability | Resident | Admin |
|---|---|---|
| Register / login | ✓ | ✓ (seeded) |
| Create weekly reports | ✓ | — |
| Save drafts | ✓ | — |
| Submit reports | ✓ | — |
| View own reports | ✓ | — |
| View all residents' reports | — | ✓ |
| Review reports & leave feedback | — | ✓ |
| Manage resident accounts | — | ✓ |
| View dashboard analytics | — | ✓ |
| Update own profile & password | ✓ | ✓ |

---

## API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

Health check:
```
GET /api/health  →  { status: 'ok' }
```
