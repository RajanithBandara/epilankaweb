# 🦠 EpiWatch Lanka

### Infectious Disease Awareness & Prediction Platform
A comprehensive web platform for visualizing, analyzing, and predicting infectious disease spread across Sri Lanka using historical epidemiological data. Features separate dashboards for users (public), officers (health professionals), and administrators.

---

## 📖 Overview

EpiWatch Lanka is a modern, intelligent disease surveillance platform designed to help the public, health officers, travelers, and administrators monitor and manage disease trends in Sri Lanka.  

### Key Features:

**For Public Users:**
- District and province-level disease visualizations
- Interactive maps and heatmaps
- Historical trend analysis & charts
- Nearby location health insights
- Public awareness & health guidelines

**For Health Officers:**
- Update and manage disease records
- View analytics and officer-specific dashboards
- Manage notifications and alerts
- Generate reports on disease data

**For Administrators:**
- Manage users, officers, and accounts
- System-wide analytics and monitoring
- Historical data management
- Settings and configuration

---

## 🏗️ Tech Stack

### **Frontend & Backend**
- **Framework:** [Next.js 16.2.3](https://nextjs.org/) (App Router)
- **Library:** [React 19.2.1](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/), [Lucide React Icons](https://lucide.dev/)

### **Services & Databases**
- **Authentication & Backend:** [Appwrite](https://appwrite.io/)
- **Authentication (Google):** [Firebase](https://firebase.google.com/)
- **Database (NoSQL):** [MongoDB](https://www.mongodb.com/)
- **Caching/Real-time:** [Redis](https://redis.io/), [Socket.IO](https://socket.io/)
- **AI/ML Services:** [Groq](https://groq.com/), [Gemini API](https://ai.google.dev/)
- **Maps & Location:** [TomTom Maps SDK](https://developer.tomtom.com/), [Leaflet.js](https://leafletjs.org/)

### **UI Components & Libraries**
- **Component Library:** [Radix UI](https://www.radix-ui.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Animations:** [Lottie React](https://github.com/LottieFiles/lottie-react)
- **Image Processing:** [React Image Crop](https://react-image-crop.netlify.app/)
- **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF), [jsPDF AutoTable](https://github.com/simonbengtsson/jspdf-autotable)
- **Date Handling:** [date-fns](https://date-fns.org/)
- **HTTP Client:** [Axios](https://axios-http.com/)

---

## ⚙️ Requirements

- **Node.js:** v20 or higher
- **Package Manager:** npm
- **External Accounts & Services:**
  - Appwrite (self-hosted or cloud)
  - MongoDB Atlas
  - Redis instance
  - Firebase project for OAuth
  - TomTom Developer account
  - Groq API key
  - Google Maps API (TomTom alternative)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd epilankaweb
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.epilanka.app
SECRET_KEY=your_secret_key
INTERNAL_API_KEY=your_internal_api_key

# TomTom Maps
NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=epilanka
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1

# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=epilanka

# Redis
REDIS_PUBLIC_URL=your_redis_connection_string

# AI Service
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Firebase OAuth (If used for separate frontend integration)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
```

*Note: Ensure you use `.env` for local development. Do not commit sensitive keys to version control.*

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📜 Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts the Next.js development server with hot reload |
| `npm run build` | `next build` | Builds the application for production |
| `npm run start` | `next start` | Runs the production server |
| `npm run lint` | `eslint` | Runs ESLint to check code quality and style |
| `npm run test` | `npm run lint` | Currently mapped to linting (TODO: Add unit/integration tests) |
| `npm run prepare` | `husky` | Sets up Husky git hooks |

---

## 📂 Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (public routes)/
│   │   ├── page.tsx              # Home page
│   │   ├── login/                # User login
│   │   ├── signup/               # User registration
│   │   ├── map/                  # Interactive disease map
│   │   ├── safety/               # Safety information
│   │   └── reset-password/       # Password reset
│   │
│   ├── dashboard/                # User Dashboard
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── map/                  # User's local map view
│   │   ├── report/               # Report submissions
│   │   ├── settings/             # User settings
│   │   └── takecare/             # Health guidelines
│   │
│   ├── officerdashboard/         # Officer Panel
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── analytics/            # Disease analytics
│   │   ├── diseases/             # Manage disease records
│   │   ├── map/                  # Officer view map
│   │   ├── notifications/        # Alerts & notifications
│   │   ├── reports/              # View user reports
│   │   ├── settings/             # Officer settings
│   │   └── update-records/       # Update disease data
│   │
│   ├── admindashboard/           # Admin Panel
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── users/                # Manage users
│   │   ├── officers/             # Manage officers
│   │   ├── admins/               # Manage admins
│   │   ├── historydata/          # Historical data management
│   │   └── tables/               # Data tables
│   │
│   ├── api/                      # Backend API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin endpoints
│   │   ├── officer/              # Officer endpoints
│   │   ├── login/                # Login API
│   │   ├── signup/               # Signup API
│   │   ├── profile/              # User profile endpoints
│   │   ├── profilepic/           # Profile picture upload
│   │   ├── user-reports/         # User report submissions
│   │   ├── reports/              # View reports
│   │   ├── change-password/      # Password change
│   │   ├── settings/             # Settings endpoints
│   │   ├── extract-disease-info/ # Disease data extraction
│   │   ├── groq/                 # AI integration with Groq
│   │   ├── nearestlocation/      # Find nearest health facility
│   │   └── public/               # Public data endpoints
│   │
│   ├── admin/                    # Admin routes
│   │   └── login/                # Admin login page
│   │
│   ├── officer/                  # Officer routes
│   │   └── login/                # Officer login page
│   │
│   ├── auth/                     # Authentication
│   │   └── oauth/                # OAuth handlers
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   ├── NavbarHandler.tsx         # Navigation bar wrapper
│   ├── FooterHandler.tsx         # Footer wrapper
│   ├── not-found.tsx             # 404 page
│   └── favicon.ico
│
├── components/                   # Reusable React Components
│   ├── ui/                       # Core UI components (buttons, inputs, etc.)
│   ├── adminpanel-components/    # Admin-specific components
│   ├── officerpanel-components/  # Officer-specific components
│   ├── dashboard-components/     # Dashboard components
│   ├── homepage-components/      # Home page components
│   ├── NavBar.tsx               # Navigation component
│   ├── Footer.tsx               # Footer component
│   ├── MapComponent.tsx         # Reusable map component
│   ├── AuthPage.tsx             # Authentication layout
│   ├── AreaReportsList.tsx      # Report listing component
│   ├── ForgotPasswordModal.tsx  # Password reset modal
│   ├── LoadingScreen.tsx        # Loading state UI
│   └── PageTransition.tsx       # Page transition animations
│
├── contexts/                     # React Context Providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── LoadingContext.tsx       # Loading state management
│   ├── LocationContext.tsx      # Location data provider
│   └── NotificationContext.tsx  # Notification state
│
├── hooks/                        # Custom React Hooks
│   ├── useAsyncLoading.ts       # Loading state hook
│   └── useNotifications.ts      # Notification management hook
│
├── lib/                          # Utility Libraries & Configs
│   ├── api.ts                   # Axios API client
│   ├── adminApi.ts              # Admin API functions
│   ├── officerApi.ts            # Officer API functions
│   ├── appwrite.ts              # Appwrite config
│   ├── firebase.ts              # Firebase config
│   ├── mongodb.ts               # MongoDB connection
│   ├── redis.ts                 # Redis client
│   ├── analyticsCache.ts        # Analytics caching
│   ├── dashboardCache.ts        # Dashboard caching
│   ├── gsap.ts                  # GSAP animations config
│   └── utils.ts                 # Utility functions
│
├── types/                        # TypeScript Type Definitions
│   └── historydata.ts           # Historical data types
│
├── controllers/                  # API Controllers
│   └── diseaseDetailsController.ts # Disease data handler
│
├── constants/                    # Global Constants
│   ├── theme.ts                 # Theme configuration
│   └── flyingGlobeLottie.json  # Lottie animation
│
└── styles/                       # Global Styles
    └── theme.css               # Theme styling
```

---

## 🔐 User Roles & Access

### 1. **Public Users**
- Browse disease information
- View interactive maps
- Submit health reports
- Access health guidelines
- View nearest health facilities

### 2. **Health Officers**
- Update disease records
- View analytics and trends
- Manage notifications
- Generate reports
- Access officer-specific dashboards

### 3. **Administrators**
- Manage all users and officers
- System-wide analytics
- Historical data management
- Access to all platform features

---

## 🎨 Design Theme

The application follows a **Wine Red + Black + White** color scheme:
- **Primary Color:** Wine Red (`#A41111`)
- **Dark Accent:** Deep Red (`#8B0000`)
- **Secondary:** Black / Charcoal (`#0D0D0D`, `#1A1A1A`)
- **Background:** White & Light Grey (`#F5F5F5`, `#FFFFFF`)

*Note: Theme configuration can be found in `src/constants/theme.ts` and `src/styles/theme.css`.*

---

## 📈 Future Roadmap / TODOs

- [ ] Implement comprehensive unit and integration tests (Jest, Playwright).
- [ ] Add more detailed epidemiological predictive models.
- [ ] Enhance real-time notification system with Socket.IO.
- [ ] Expand health facility database for all provinces.
- [ ] Add multi-language support (Sinhala, Tamil).

---

## 📊 Key Features Implemented

- ✅ Multi-role authentication system (Public, Officer, Admin)
- ✅ Interactive disease mapping with TomTom and Leaflet
- ✅ Real-time disease data visualization
- ✅ User reporting system
- ✅ Officer and Admin dashboards
- ✅ Analytics and trend analysis with charts
- ✅ Social features (Reports, Notifications)
- ✅ Profile management and settings
- ✅ Responsive design for mobile and desktop
- ✅ Image upload and processing
- ✅ PDF report generation
- ✅ Caching layer with Redis
- ✅ Real-time updates with Socket.IO (prepared)
- ✅ AI integration for disease insights (Groq, Gemini)

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

The application is optimized for deployment on:
- Vercel (recommended for Next.js)
- Docker containers
- Traditional Node.js hosting

---

## 🧪 Testing & Quality

Currently, code quality is maintained through:
```bash
npm run lint    # ESLint validation
npm run build   # Build verification
npm run test    # Maps to npm run lint
```

**Note:** Comprehensive test suites (Jest, Playwright) are planned for future releases.

---

## 📄 License

TODO: Add license information (e.g., MIT, Apache 2.0).

---

## 📞 Support & Contributing

For bug reports, feature requests, or contributions, please open an issue or submit a pull request on the repository.

