# HallBook — College Reservations

A centralized, role-based MERN stack web application for managing college hall reservations, detecting scheduling conflicts in real-time, handling multi-role approval workflows, and maintaining an official schedule.

---

## System Features

1. **Role-Based Access Control (RBAC)**:
   - **`CLUB_COORDINATOR`** (`Phoenix`, `DEsoc`, `Debuggers`, `CSI`): Check availability, submit booking requests, track status (`Pending`, `Approved`, `Rejected`, `Cancelled`), edit or cancel requests.
   - **`HOD`**: Primary approval authority. Inspect pending requests, verify conflict status, approve or reject with mandatory justification reason.
   - **`ADMIN`**: User account management, departmental club administration, hall configuration (capacity: 250), policy cancellations, and immutable audit trail.

2. **Core Conflict Detection Engine**:
   - Implements interval intersection rule:
     $$\text{Overlap} \iff (\text{Existing Start} < \text{Requested End}) \land (\text{Existing End} > \text{Requested Start})$$
   - Handles exact boundary conditions without false positives (`10:00 - 12:00` and `12:00 - 14:00` $\implies$ No conflict).
   - Real-time client-side feedback before submission.

3. **Official Calendar & Daily Timeline**:
   - Single source of truth displaying only confirmed (`APPROVED`) bookings.
   - Detailed day schedule timeline (08:00 to 19:00) with color-coded club allocations.

4. **Immutable Audit Trail**:
   - Tracks all creations, updates, approvals, rejections, cancellations, and administrative adjustments.

---

## Quick Start Guide

### 1. Backend Server (`server/`)
```bash
cd server
npm install
node seed.js    # Seeds initial hall, clubs, demo users, and bookings
npm run dev     # Or node server.js (starts on http://localhost:5000)
```

### 2. Frontend Application (`client/`)
```bash
cd client
npm install
npm run dev     # Starts Vite on http://localhost:5173
```

---

## Pre-Configured Demo Credentials

The portal features a unified **Events Login** for all departmental clubs, alongside HOD Approver and Administrator logins:

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Events Login** | `events@college.edu` | `Events@123` | Single unified portal for all college clubs. Access to full Event Booking Form & Records. |
| **HOD Approver** | `hod@college.edu` | `Hod@123` | Head of Department approval queue, conflict inspector & rejection reasons. |
| **Administrator** | `admin@college.edu` | `Admin@123` | User/Club/Hall facility configuration & immutable audit trail. |

---

## REST API Summary

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current session profile
- `GET /api/bookings` - Role-filtered booking requests
- `POST /api/bookings` - Submit booking request (with conflict check)
- `PUT /api/bookings/:id` - Update pending booking
- `DELETE /api/bookings/:id` - Cancel booking request
- `POST /api/bookings/:id/approve` - HOD approves booking
- `POST /api/bookings/:id/reject` - HOD rejects booking (with required reason)
- `GET /api/bookings/conflicts` - Live conflict detection preview
- `GET /api/bookings/calendar` - Official verified calendar
- `GET/POST/PUT/DELETE /api/users` - Admin user management
- `GET/POST /api/clubs` - Club management
- `GET/PUT /api/hall` - Hall facility configuration
- `GET /api/audit-logs` - System audit log viewer
