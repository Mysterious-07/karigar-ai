# 🎨 Karigar AI — AI-Powered Digital Business Manager for Indian Artisans

**Karigar AI** (कारीगर AI / कारिगर AI) is a simple, respectful, artisan-first mobile web application designed specifically for Indian artisans with limited digital literacy. It empowers traditional craftspeople to turn a simple product photo and voice note into a professional digital catalog, fair-market price guidance, compatible B2B buyer leads, a shareable digital storefront, and instant WhatsApp marketing messages.

---

## 🌟 Key Features & Capabilities

### 🌐 1. Language-First Onboarding & Multilingual UX
- **Supported Languages**: Native support for **English (en)**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
- **Persistent Header Switcher**: One-tap language switcher pill present across all screens.
- **LocalStorage Persistence**: Remembers selected language preference (`karigar_artisan_language`).

### 📱 2. Simple & Frictionless Authentication
- **Indian Mobile Authentication**: Fast, hassle-free login using a 10-digit Indian mobile number (`+91`).
- **OTP Verification Flow**: Enter OTP (`123456` in demo mode) to sign in within seconds.
- **Persistent Artisan Session**: Secure JWT token saved locally so artisans stay logged in across app restarts.

### 🎙 3. Voice-First Product Creation
- **Audio Recorder Widget**: Speak in native language (Hindi, Marathi, or English) to describe craft materials, techniques, and effort.
- **Raw Input Transparency**: Artisans can preview, edit, or re-record their transcript before submitting for AI catalog creation.

### ✨ 4. xAI Grok Powered AI Catalog Generation
- **Automated Catalog Creation**: Extracts title, craft type, materials, dimensions, estimated effort, and artisan backstory using xAI Grok API.
- **Listing Completeness Score**: Itemized checklist scoring catalog readiness (0–100%) so artisans know what information is complete.
- **AI Disclaimers**: Transparent badges indicating AI-generated suggestions and allowing manual edits.

### 💰 5. AI Smart Price Guidance
- **Cost Factor Breakdown**: Analyzes raw material expenses, artisan labor hours, and skill premiums to recommend a fair retail selling price.
- **Non-Binding Guidance**: Displays transparent price disclaimers and allows one-click acceptance or custom price setting.

### 🤝 6. Deterministic & AI Buyer Matching
- **Compatibility Scoring**: Calculates 0–100% match scores based on craft type, product category, budget range, and order volume suitability.
- **Potential Buyer Profile Badges**: Clearly marks prospective B2B buyers, retail boutiques, and corporate gift suppliers.
- **Interest Logging**: Artisans can tap "Contact Buyer" to log interest and manage outreach status.

### 🏪 7. Digital Storefront & Shareable QR Cards
- **Public Artisan Storefront**: Unique web store URL (`/store/[slug]`) listing all published artisan products with direct visitor enquiry forms.
- **Printable QR Code Card**: High-resolution downloadable PNG and printable QR card (`/dashboard/store/qr`) with practical placement tips (product packaging 📦, shop doors 🏪, exhibition stalls 🎪).

### ⚡ 8. Field-Ready Reliability & Offline Support
- **Client-Side Draft Storage (`draftStorage.ts`)**: Auto-saves product creation drafts in browser local storage. Interrupted sessions can be resumed or discarded anytime from the Dashboard.
- **Offline Connection Banner (`OfflineBanner.tsx`)**: Listens to network state and alerts artisans when offline, reassuring them that their work is safely stored on their phone.
- **Canvas Image Compression (`imageCompressor.ts`)**: Automatically resizes uploaded photos to max 1200px and compresses JPEG payload to <500KB before transmission over weak 2G/3G networks.

### 💬 9. WhatsApp Marketing & Enquiry Management
- **WhatsApp Share Modal (`MarketingShareModal.tsx`)**: Generates pre-formatted marketing posts in Hindi, Marathi, and English with one-click direct sharing to WhatsApp contacts and customer groups.
- **Enquiry Management Dashboard (`/dashboard/enquiries`)**: Centralized inbox for visitor inquiries with status filters (`New`, `Contacted`) and direct WhatsApp chat launch buttons.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) | Server-rendered & client React web application |
| **Language & Styling** | TypeScript & Tailwind CSS | Type safety, warm artisan palette, responsive layout |
| **Icons** | Lucide React | Clean, intuitive icon set |
| **Backend Framework** | Python 3.12 & FastAPI | High-performance async RESTful API engine |
| **Database & ORM** | SQLite / PostgreSQL & SQLAlchemy 2.0 | Persistent artisan, product, store, buyer & enquiry schema |
| **Database Migrations** | Alembic | Version-controlled schema migrations |
| **AI Integration** | xAI Grok API (`grok-beta`) | Multilingual catalog synthesis & buyer compatibility reasoning |
| **Client Media Tools** | HTML5 Canvas API & QRCode API | Photo compression & QR code generation |
| **Testing** | pytest & Next.js Build | 56 automated backend tests & zero-error frontend compilation |

---

## 📂 Project Architecture

```text
karigar-ai/
│
├── frontend/                         # Next.js App Router Application
│   ├── src/
│   │   ├── app/                      # App Routes & Pages
│   │   │   ├── page.tsx              # Welcome Landing Page (/)
│   │   │   ├── login/                # Simple Mobile + OTP Authentication (/login)
│   │   │   ├── onboarding/           # Artisan Profile Setup (/onboarding)
│   │   │   ├── dashboard/            # Artisan Dashboard (/dashboard)
│   │   │   │   ├── enquiries/        # Customer Message Inbox (/dashboard/enquiries)
│   │   │   │   └── store/            # Storefront Settings & QR Navigation (/dashboard/store)
│   │   │   │       └── qr/           # Printable Store QR Card (/dashboard/store/qr)
│   │   │   ├── products/
│   │   │   │   ├── add/              # 3-Step Guided Product Addition (/products/add)
│   │   │   │   └── [id]/
│   │   │           ├── catalog/      # AI Catalog Review & Completeness (/products/[id]/catalog)
│   │   │           ├── pricing/      # AI Price Guidance (/products/[id]/pricing)
│   │   │           └── matches/      # Buyer Compatibility List (/products/[id]/matches)
│   │   │   └── store/
│   │   │       └── [slug]/           # Public Digital Storefront & Enquiry Form (/store/[slug])
│   │   ├── components/               # UI Components
│   │   │   ├── Header.tsx            # Global Header & Language Switcher
│   │   │   ├── LanguageContext.tsx   # Language State & Hook
│   │   │   ├── OfflineBanner.tsx     # Network Status Listener & Alert Banner
│   │   │   ├── MarketingShareModal.tsx # WhatsApp Marketing Post Generator
│   │   │   ├── HelpModal.tsx         # Guided Artisan Help Dialog
│   │   │   ├── ProtectedRoute.tsx    # Auth Guard Wrapper
│   │   │   └── voice/                # Voice Recording Microphone Widget
│   │   └── lib/
│   │       ├── api.ts                # Axios API Client & Endpoints
│   │       ├── translations.ts       # Multilingual Dictionary (en, hi, mr)
│   │       ├── draftStorage.ts       # LocalStorage Product Draft Manager
│   │       └── imageCompressor.ts    # HTML5 Canvas Photo Compression Helper
│   ├── package.json
│   └── next.config.ts
│
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                   # App Initialization, CORS, Seeding
│   │   ├── core/                     # Configuration & Security JWT Tokens
│   │   ├── db/                       # SQLAlchemy Database Engine & Models
│   │   │   ├── models/               # Artisan, Product, Store, Buyer, Enquiry ORM Models
│   │   │   └── seed_demo_data.py     # Demo Buyers & Artisans Seeder
│   │   ├── api/routes/               # API Endpoints
│   │   │   ├── auth.py               # Mobile Login & OTP Handlers
│   │   │   ├── artisans.py           # Profile Operations
│   │   │   ├── products.py           # Catalog & Photo Uploads
│   │   │   ├── pricing.py            # AI Price Calculation
│   │   │   ├── matching.py           # Buyer Matching Engines
│   │   │   ├── stores.py             # Digital Storefront Management
│   │   │   ├── enquiries.py          # Customer Inquiries
│   │   │   └── public.py             # Public Storefront Visitor API
│   │   └── services/                 # Business Logic Services
│   │       ├── grok_service.py       # xAI Grok API Integration
│   │       ├── catalog_service.py    # Catalog Generation Logic
│   │       ├── pricing_service.py    # Pricing Formula & AI Prompting
│   │       ├── matching_service.py   # Compatibility Scoring Algorithm
│   │       └── qr_service.py         # QR Code Generation Service
│   ├── tests/                        # Pytest Test Suite (56 tests)
│   ├── karigar.db                    # SQLite Database File
│   ├── requirements.txt
│   └── alembic.ini
│
├── README.md                         # Full Application Documentation
└── .env.example                      # Environment Template
```

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/aditya-students/karigar-ai.git
cd karigar-ai
```

---

### Step 2: Backend Setup & Server Execution

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create backend `.env` configuration file:
   Create a `.env` file inside the `backend` directory (or copy from `.env.example`):
   ```env
   SECRET_KEY=karigar_secret_key_change_in_production
   DATABASE_URL=sqlite:///./karigar.db
   XAI_API_KEY=your_optional_xai_grok_api_key
   FRONTEND_URL=http://localhost:3000
   ```
   *(Note: If no `XAI_API_KEY` is provided, Karigar AI automatically falls back to deterministic smart defaults for catalog generation and pricing guidance!)*

5. Run Alembic Database Migrations:
   ```bash
   alembic upgrade head
   ```

6. Run Automated Backend Tests:
   ```bash
   python -m pytest
   ```
   *(Expect 56 passed tests covering API endpoints, authentication, catalog generation, pricing formulas, and buyer matching).*

7. Start FastAPI Backend Server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - API Docs (Swagger): `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

---

### Step 3: Frontend Setup & Web Server Execution

1. Open a new terminal tab/window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start Next.js Development Server:
   ```bash
   npm run dev
   ```
   - App URL: `http://localhost:3000`

---

## 📖 End-to-End Application Testing Guide

Follow this guided flow to experience the full artisan journey:

### 1. Select Language & Login
1. Open `http://localhost:3000` in your browser.
2. Click **मराठी**, **हिंदी**, or **English** from the top header pill switcher.
3. Click **आगे बढ़ें / Get Started** or navigate to `/login`.
4. Enter any 10-digit Indian phone number (e.g., `9876543210`).
5. Click **आगे बढ़ें (Send OTP)**.
6. Enter OTP code `123456` and click **सत्यापित करें (Verify)**.

### 2. Complete Artisan Profile (Onboarding)
1. Enter your name (e.g., *Ramesh Kumar*).
2. Select craft type (e.g., *Warli Art*, *Tanjore Painting*, *Wooden Toys*, or *Handloom Weaving*).
3. Enter your city/village and state (e.g., *Palghar, Maharashtra*).
4. Click **प्रोफ़ाइल सहेजें (Save Profile)**. You will be redirected to the Artisan Dashboard.

### 3. Add a New Product (Guided 3-Step Wizard)
1. On the Dashboard, click **📷 नया उत्पाद बेचें (Sell New Product)**.
2. **Step 1 (Photo)**: Upload an image file or choose a sample art photo. The app automatically compresses the image client-side before sending.
3. **Step 2 (Voice or Typing)**: Tap **🎙 बोलकर बताएं (Tap to Speak)** to record a voice description in Hindi, Marathi, or English, OR type details in the description box.
4. **Step 3 (Review Input)**: Verify your raw input text. Click **✨ डिजिटल कैटलॉग बनाएं (Generate Catalog)**.

### 4. Review AI Catalog & Completeness
1. The app invokes Grok AI to structure your description into a professional product title, category, materials, effort, and story.
2. Review the **Listing Completeness** checklist box.
3. Tap **💰 मूल्य मार्गदर्शन देखें (View Price Guidance)** to proceed.

### 5. Review Price Guidance & Accept
1. Examine the price breakdown showing estimated raw material cost, labor hours, and recommended selling price.
2. Click **स्वीकार करें और सहेजें (Accept & Save Price)**.

### 6. View Matched Buyers
1. Navigate to the buyer matches screen.
2. Review buyers labeled with **Potential Buyer Profile** along with match percentage scores and reasonings.
3. Click **संपर्क करें (Contact Buyer)** to log your interest.

### 7. View Digital Storefront & Generate QR Code
1. Return to the Dashboard and click **🏪 मेरी दुकान (My Store)**.
2. View your live online store with published products.
3. Click **QR कोड दिखाएं (Show QR)** to open the printable QR card (`/dashboard/store/qr`).
4. Use the **Download PNG** or **Print** buttons to save your store QR card.

### 8. Marketing & WhatsApp Customer Enquiries
1. Click **📱 WhatsApp पर शेयर करें (Share on WhatsApp)** on any product page to generate pre-formatted marketing posts.
2. Visit your public storefront link as a customer (`/store/[slug]`) and submit a visitor enquiry.
3. Return to the Dashboard and click **💬 ग्राहक संदेश (Customer Messages)** (`/dashboard/enquiries`) to view incoming inquiries and tap **💬 WhatsApp** to chat directly with the buyer.

---

## 📡 API Reference Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/send-otp` | `POST` | Generates OTP for mobile login |
| `/api/auth/verify-otp` | `POST` | Verifies OTP and returns JWT Bearer token |
| `/api/auth/me` | `GET` | Gets current authenticated artisan profile |
| `/api/artisans/me` | `PUT` | Updates artisan profile & onboarding data |
| `/api/products` | `POST` / `GET` | Creates or lists artisan products |
| `/api/products/{id}/image` | `POST` | Uploads product photo |
| `/api/products/{id}/generate-catalog` | `POST` | Triggers Grok AI catalog generation |
| `/api/products/{id}/suggest-price` | `POST` | Returns AI price guidance breakdown |
| `/api/products/{id}/match-buyers` | `POST` | Calculates compatible buyer match scores |
| `/api/stores/me` | `GET` / `PUT` | Retrieves or updates artisan digital store |
| `/api/enquiries/me` | `GET` | Lists incoming customer enquiries |
| `/api/public/store/{slug}` | `GET` | Public storefront data for visitors |
| `/api/public/enquiry` | `POST` | Visitor enquiry submission |

---

## 🧪 Verification & Testing Commands

To run full system verification before committing changes:

```powershell
# 1. Run Backend Pytest Suite
cd backend
python -m pytest

# 2. Run Frontend Next.js Production Build
cd ../frontend
npm run build
```

---

## 📄 License & Attribution

Crafted with ❤️ for Indian Artisans by the **Karigar AI** Team. Powered by **Next.js**, **FastAPI**, and **xAI Grok**.
