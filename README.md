# PGmate – Smart PG Management System

> A complete, production-quality, responsive PG (Paying Guest) and Hostel Management Platform designed for real-world operations in India.

![PGmate Banner](https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80)

---

## 🚀 Authentication & Tenant Admission Flow

PGmate enforces a secure, real-world Indian PG operations workflow:

### 1. PG Owner Registration
- PG Owners / Wardens register directly via the **Register Your PG** portal (`/register`).
- Sets up PG business name, owner details, and UPI collection ID.
- Access to the full 12-section property management dashboard.

### 2. Tenant Admission & Auto-Generated Credentials (PDF)
- **No public self-registration for tenants**: Tenants cannot register arbitrarily without being verified and allocated to an actual room/bed.
- When the PG Owner adds a resident in **Tenant Management**:
  1. The system atomically allocates the vacant bed.
  2. A unique **Username (`name@pgname`)** is generated (e.g., `ananya@saibalajires`).
  3. A secure temporary password is automatically generated.
  4. An official **Admission & Login Credentials Slip (PDF)** is generated and downloaded immediately.
  5. The Owner can reprint or download this PDF slip anytime from the Tenant Directory.
- **Resident Login**: The tenant signs in at `/login` under the **Resident Tenant** tab using their issued Username (`name@pgname`) and password.

---

## 🛠️ Technology Stack

### Frontend
- **React.js 18** with **Vite 6**
- **Tailwind CSS 3** (Custom property management aesthetic, responsive mobile & desktop)
- **React Router 6** (Role-based protected route hierarchy)
- **Axios** (Centralized API client with JWT interceptors)
- **Lucide React** (Modern iconography)
- **Recharts** (Interactive financial trends, occupancy, daily meal attendance, and complaint distribution charts)
- **html5-qrcode** (High-speed live camera QR scanner)
- **canvas-confetti** (Celebratory payment confirmation feedback)

### Backend
- **Node.js 22** & **Express.js**
- **MongoDB Atlas** / Built-in embedded zero-config **MongoMemoryServer** for seamless local execution
- **Mongoose ODM** with atomic operations & transactions
- **JWT (JSON Web Tokens)** & **bcryptjs** password hashing
- **Helmet**, **CORS**, and **express-rate-limit** security protections
- **Multer** for multipart file uploads (complaints & profile pictures)

### Payment Orchestration & Indian Payment Gateway
- **Hyperswitch Adapter Layer** (`backend/src/services/paymentAdapter/`)
  - Preferred open-source payment orchestration platform
  - Pluggable provider adapter interface (`HyperswitchAdapter`, `MockSandboxAdapter`)
  - Domestic Indian payment methods: **UPI** (Google Pay, PhonePe, Paytm, BHIM), **Debit/Credit Cards**, and **Net Banking**
  - Cryptographic HMAC signed webhook handler (`/api/payments/webhook`)
  - Server-side verification and database balance calculation
  - Idempotency key protection and immutable transaction audit trails

---

## 🌟 Key Architecture & Modules

### 1. Dual Role-Based Dashboards
Both dashboards communicate through a common backend and MongoDB database. Information updated by the owner automatically syncs with the resident's dashboard.

```
                           PGmate Platform
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   Owner Dashboard                                  Tenant Dashboard
- Overview & KPIs                               - Personalized Home
- Building & Floor Management                   - My Room & Roommates
- Interactive Room & Bed Grid                   - Daily One-Time Meal QRs
- Tenant Directory & Allocations                - Weekly Food Menu
- Weekly Food Menu Configurator                 - Online Rent Pay (UPI/Cards)
- Meal QR Camera Scanner                        - Digital HRA Tax Receipts
- Food Attendance Reports (CSV)                 - Raise Maintenance Issue
- Rent Dashboard & Collections                  - My Complaints Tracker
- Maintenance Desk (Technician dispatch)        - Personal Notifications
- Broadcast Announcements & Alerts              - Profile & Emergency Contact
- Analytics & Reports (Export CSV)
- PG Settings & UPI Configuration
```

### 2. Core Feature: Secure One-Time Meal QR Attendance System
- **Opaque Cryptographic Tokens**: Separate tokens generated for **Breakfast**, **Lunch**, and **Dinner** for each active resident.
- **Atomic Single-Scan Guarantee**: Uses atomic MongoDB `findOneAndUpdate({ token, isUsed: false }, ...)` to guarantee that only one scanner can consume a pass, eliminating double-counting.
- **Strict Validation Rules**:
  1. Date-specific & meal-session specific.
  2. Automatic expiration when meal time windows conclude.
  3. Rejection of used, expired, invalid, or cross-PG tokens.
  4. Real-time audio feedback (success/error tones via Web Audio API).
- **Manual Fallback**: Resident name / room search with manager audit logs for discharged phone batteries.

### 3. Core Feature: Visual Room & Bed Layout
- Interactive visual floor plans with real-time room capacity.
- **Color-Coded Status Grid**:
  - 🟢 **Green**: Vacant / Available
  - 🔴 **Red**: Occupied (Click to view resident profile, phone, joining date)
  - 🟡 **Yellow**: Under Maintenance (Reason displayed)
  - ⚪ **Grey**: Inactive
- Atomic bed allocation preventing over-allocation.
- Complete allocation history preserved upon checkout.

### 4. Rent Collections & Billing
- Automatic monthly invoice generation for active bed allocations.
- Balance tracking, due date reminders, and offline cash payment recordings.
- Printable, tax-compliant **Rent Receipts** with GST/PAN merchant details for HRA claims.

---

## 📦 Project Structure

```
d:/PG/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection (Atlas / Memory Mongo), Env variables
│   │   ├── controllers/        # REST controllers (Auth, Building, Room, Tenant, QR, Rent, etc.)
│   │   ├── middleware/         # Auth, Role, Upload, Rate Limiting, Error Handler
│   │   ├── models/             # 18 Mongoose models (User, Bed, Allocation, Invoice, Payment, etc.)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # QR service, Rent service, Audit service, Notifications
│   │   │   └── paymentAdapter/ # Hyperswitch & Sandbox Indian Payment Providers
│   │   ├── scripts/            # Database seed script with rich Indian PG records
│   │   ├── utils/              # JWT, IST date utilities, formatters
│   │   ├── app.js              # Express app configuration & middleware
│   │   └── server.js           # Server entry point
│   ├── uploads/                # Local uploaded files storage
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Modals, Badges, StatCards, Loaders, EmptyStates
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── layouts/            # OwnerLayout (12 sections), TenantLayout (10 sections)
│   │   ├── pages/
│   │   │   ├── auth/           # Login (with 1-click Demo), Register
│   │   │   ├── owner/          # 12 Owner dashboard views
│   │   │   └── tenant/         # 10 Tenant resident views
│   │   ├── services/           # Axios instance with auth interceptor
│   │   ├── utils/              # INR currency formatters, IST date helpers
│   │   ├── routes/             # AppRoutes with role-based Route Guards
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ or v22+
- **npm** v9+

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/Anmolkamath47/PG.git
cd PG

# Install dependencies
npm run install:all

# Seed database with rich realistic PG data
npm run seed

# Start backend (http://localhost:5000)
npm run start:backend

# In another terminal, start frontend (http://localhost:5173)
npm run dev:frontend
```

Open `http://localhost:5173/` and test using the **1-Click Demo Login** buttons!

---

## 🚀 Cloud Deployment Guide

### A. Deploy Backend to Render (Node.js Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service** (or use Blueprints with `render.yaml`).
2. Connect your repository: `https://github.com/Anmolkamath47/PG.git`.
3. Set configuration:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Set Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - `JWT_SECRET`: Any secure random 32+ character string
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://pgmate.vercel.app`)
   - `PAYMENT_PROVIDER`: `sandbox` (or `hyperswitch`)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: (Optional) for image storage

### B. Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
2. Select `Anmolkamath47/PG`.
3. Set configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://your-render-backend-name.onrender.com/api`
5. Click **Deploy**. Vercel will build and launch your application with full SPA routing (`vercel.json` already configured).

---

## 🔒 Security Best Practices Implemented
- Strict JWT authentication on every sensitive endpoint.
- Tenant IDOR protection: Tenants can only view and pay their own invoices and view their own meal QRs.
- Cross-PG data boundary: Owners can only access buildings and tenants they own.
- No sensitive card details or UPI PINs are ever stored in the database.
- Idempotency keys prevent duplicate payment deductions.
- Atomic database consumption prevents duplicate meal QR scans.
- UTC timestamps stored in database, formatted to Indian Standard Time (IST) in UI.
