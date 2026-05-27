# 🦠 EpiWatch Lanka

### *Intelligent Disease Surveillance & Predictive Epidemiological Platform for Sri Lanka*

A state-of-the-art web application for visualizing, auditing, and forecasting infectious disease spread across Sri Lanka using historical epidemiological datasets, geographic mapping, and advanced artificial intelligence models. EpiWatch Lanka delivers tailored dashboards for citizens, medical officers, and system administrators to foster rapid public health coordination.

---

<div align="center">

![EpiWatch Lanka Banner](./public/epiwatch_banner.png)

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.1-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-Backend-FD366E?style=for-the-badge&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Gemini & Groq](https://img.shields.io/badge/AI_Powered-Gemini_%2F_Groq-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

</div>

---

## 📖 Overview

**EpiWatch Lanka** is an advanced digital health infrastructure designed to support Sri Lankan healthcare authorities and the general public. Built on Next.js 16 (App Router) and React 19, the platform leverages real-time caching, geographical analytics, and AI reasoning models to demystify complex epidemiological data and enable rapid, localized, and intelligent health actions.

---

## 🏗️ System Architecture

The following diagram illustrates the flow of data, API triggers, and client interactions across the EpiWatch Lanka ecosystem:

```mermaid
graph TD
    %% Base Styling Definitions
    classDef client fill:#1E3A8A,stroke:#3b82f6,stroke-width:2px,color:#ffffff;
    classDef api fill:#0f172a,stroke:#334155,stroke-width:2px,color:#f1f5f9;
    classDef db fill:#0EA5A4,stroke:#14b8a6,stroke-width:2px,color:#ffffff;
    classDef service fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ffffff;
    classDef roles fill:#f59e0b,stroke:#f59e0b,stroke-width:2px,color:#0f172a;

    %% Subgraphs
    subgraph Users ["🌐 Client Portals"]
        Public["Public Dashboard"]
        Officer["Officer Dashboard"]
        Admin["Admin Panel"]
    end
    class Public,Officer,Admin roles;

    subgraph AppServer ["⚡ Next.js App Router Core (Frontend/Backend)"]
        Pages["Client Pages & Shared Components (React 19 + Tailwind 4)"]
        APIRoutes["Next.js API Handlers (/api/*)"]
    end
    class Pages client;
    class APIRoutes api;

    subgraph DataStorage ["💾 Database & Cache Layer"]
        AppwriteDB["Appwrite Storage & Realtime Auth"]
        MongoDB["MongoDB (Historical Epidemiology Data)"]
        RedisCache["Redis (High-speed Analytics Caching)"]
    end
    class AppwriteDB,MongoDB,RedisCache db;

    subgraph ExtIntegrations ["🤖 AI & Third-Party Services"]
        TomTom["TomTom & Leaflet Mapping SDKs"]
        FirebaseOAuth["Firebase OAuth (Google Sign-In)"]
        GroqGemini["Groq & Gemini AI (Epidemiological Insights)"]
        SocketIO["Socket.IO (Real-time Alert Broadcasts)"]
    end
    class TomTom,FirebaseOAuth,GroqGemini,SocketIO service;

    %% Flow Tracing
    Public & Officer & Admin --> Pages
    Pages -->|HTTP / Axios| APIRoutes
    
    APIRoutes -->|Authentication / Storage| AppwriteDB
    APIRoutes -->|Epidemiological Data| MongoDB
    APIRoutes -->|Cache Read/Write| RedisCache
    
    APIRoutes -->|Mapping & GIS| TomTom
    APIRoutes -->|SSO Google Auth| FirebaseOAuth
    APIRoutes -->|Inference APIs| GroqGemini
    APIRoutes -->|Realtime Channels| SocketIO
```

---

## 🔑 Key Platform Capabilities

The ecosystem is designed with modular functionality, optimized specifically for three core user roles:

### 1. Public Portal 🌐
* **Interactive Spatial Maps:** Real-time rendering of disease-spread hotspots, province and district density maps, and interactive Leaflet/TomTom GIS mapping.
* **Proximity Health Audits:** Geolocation lookup indicating nearby medical resources, local risk grades, and active local outbreaks.
* **Epidemiological History:** Detailed data filters with rich charts (via Recharts) displaying historical disease trends.
* **Intelligent Guidelines:** Health precautions dynamically compiled by AI based on local coordinates and current seasons.

### 2. Officer Dashboard 🩺
* **Frictionless Data Entry:** Secure interfaces to easily report, catalog, and index new infectious disease cases.
* **Incident Analytics:** Specialized control panels presenting statistics on localized rates, transmission vectors, and healing statuses.
* **Automated PDF Exporting:** Instant generation of professional, data-dense epidemiological reports using `jsPDF` and `jsPDF-AutoTable` layouts.
* **Alert Broadcast Management:** Fast drafts and triggers for emergency health alerts, dispatchable to affected public circles.

### 3. Administrator Console 🛡️
* **Identity Governance:** Unified systems to register, audit, activate, or suspend standard users, health officers, and additional admins.
* **System Operations Monitor:** Central control logs providing insights on endpoint latencies, database loads, and API consumption.
* **Historical Data Backfill:** Heavy-duty pipeline tools allowing administrative bulk imports of massive legacy CSV/JSON datasets.
* **Feature Flags:** Instant toggle switches for caching parameters, rate limit thresholds, and platform-wide notifications.

---

## ⚙️ Technical Architecture Deep Dive

EpiWatch Lanka uses a highly specialized technical stack chosen to ensure performance, visual premium rendering, and reliable scalability:

* **Next.js 16 (App Router):** Enables static generation for critical public safety pages, Server-Side Rendering (SSR) for real-time dashboards, and integrated route handlers to manage secure backend APIs.
* **React 19 (Concurrent Mode):** Employs state-of-the-art concurrent execution, optimizing page response, virtual DOM updates, and reducing user input latency.
* **Tailwind CSS 4:** Features a Lightning CSS engine delivering ultra-fast compile times, native cascading variable structures, and premium responsive layouts.
* **Framer Motion & GSAP (GreenSock):** Powers immersive micro-interactions, smooth spring-based page transitions, and complex timeline-driven animations that respond to scroll triggers.
* **Lenis Smooth Scroll:** Delivers sleek, buttery-smooth scrolling behavior across various desktop and mobile viewports.
* **Three.js / WebGL:** Facilitates high-performance interactive 3D visual environments (e.g., globe and network visualizations) that make the application stand out.
* **Appwrite (Client & Node SDK):** Offloads user session tracking, secure storage files, and real-time pub-sub notifications.
* **MongoDB & Redis Caching:** Combines horizontal document data structures (MongoDB) for deep historical query speeds with in-memory key-value caching (Redis via `ioredis`) to ensure sub-millisecond response rates.
* **TomTom Maps & Leaflet:** Merges TomTom's Enterprise-level geocoding engines with Leaflet’s client-side performance to map complex geographical polygons.
* **Groq & Gemini AI Orchestration:** Employs Groq (for fast Llama-3 parsing of reports) and Gemini-1.5 APIs (for deep epidemiological reasoning) to generate personalized, localized health advice.

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
Create a `.env` file in the root directory and configure the variables as detailed below:

| Environment Variable | Required | Description | Example / Recommended Value |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | The base URL of the EpiWatch API server | `https://api.epilanka.app` or `http://localhost:3000` |
| `SECRET_KEY` | **Yes** | Secret seed used for encrypting local session tokens | *Generate a random cryptographically secure string* |
| `INTERNAL_API_KEY` | **Yes** | API authentication token shared between microservices | *High-entropy token string* |
| `NEXT_PUBLIC_TOMTOM_API_KEY` | **Yes** | API token from TomTom Developer Portal for Maps rendering | *Get from developer.tomtom.com* |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | **Yes** | Target project ID inside Appwrite Console | `your_appwrite_project_id` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_NAME`| No | Human-readable name of the Appwrite project | `epilanka` |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | **Yes** | Appwrite REST endpoint URL | `https://cloud.appwrite.io/v1` or local endpoint |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | **Yes** | Primary Mongo database name | `epilanka` |
| `REDIS_PUBLIC_URL` | **Yes** | Connection URL for Redis caching (Upstash, RedisLabs, or local) | `redis://default:password@host:port` |
| `GROQ_API_KEY` | **Yes** | Token for Groq AI inference API (used for high-speed insights) | `gsk_...` |
| `GEMINI_API_KEY` | **Yes** | Token for Google Gemini API (used for reasoning & guidelines) | *Get from Google AI Studio* |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Yes** | Firebase web configuration API Key for Google OAuth sign-in | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Yes** | Firebase project ID | `epilanka-firebase` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase Auth domain for callback redirects | `epilanka.firebaseapp.com` |

> [!WARNING]
> Keep your `.env` file secure. Never commit your secrets or environment configuration to GitHub or any public version control system.

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser to access the local development environment.

---

## 📜 Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts the Next.js development server with hot module replacement |
| `npm run build` | `next build` | Compiles the production application bundle with optimized caching |
| `npm run start` | `next start` | Runs the production-optimized Next.js build locally |
| `npm run lint` | `eslint` | Invokes ESLint to audit static code quality, types, and standards |
| `npm run test` | `jest` | Executes unit and integration test suites using Jest |
| `npm run prepare` | `husky` | Installs and configures Git Husky pre-commit hooks |

---

## 📂 Project Structure

```
src/
├── app/                           # Next.js App Router Pages, Layouts, and API endpoints
│   ├── (public routes)/           # Unauthenticated public portals (Home, Interactive Maps, Safety guides)
│   ├── dashboard/                 # Standard authenticated public user workspace & profile tools
│   ├── officerdashboard/          # Specialized epidemiological portal for health officers to record data
│   ├── admindashboard/            # Super-admin governance console for user management & system status
│   └── api/                       # Modular backend routes (Auth, Reports, Location tracking, AI controllers)
├── components/                    # Highly optimized, reusable UI & domain-specific components
│   ├── ui/                        # Low-level primitive design tokens (Buttons, Inputs, Modals, Tabs via Radix)
│   ├── adminpanel-components/     # Specialized Admin chart cards, tables, and moderation controls
│   ├── officerpanel-components/   # Interfaces for Case uploads, Notification drafting, and Audit tables
│   ├── dashboard-components/      # Public-user metrics, reports feeds, and local alerts panels
│   └── homepage-components/       # High-performance hero screens, dynamic scroll-cards, and footers
├── contexts/                      # React Context Providers managing global application state
│   ├── AuthContext.tsx            # Session state, login credentials orchestration via Appwrite & Firebase
│   └── LocationContext.tsx        # Geolocation lookup and coordinate tracking providers
├── hooks/                         # Optimized custom React hooks for stateful utility management
├── lib/                           # Central configuration & connection clients
│   ├── appwrite.ts                # Client instances for Appwrite storage and authentication
│   ├── mongodb.ts                 # Reusable MongoDB client wrapper with database pooling
│   ├── redis.ts                   # Caching connection logic utilizing ioredis
│   └── gsap.ts                    # Global GSAP ScrollTrigger configuration presets
├── types/                         # Centralized TypeScript custom interface & type definitions
├── controllers/                   # Backend Business Logic controllers for processing data
└── styles/                        # CSS styles (Theme declarations, animations, Global CSS resets)
```

---

## 🎨 Design System & Theme Tokens

EpiWatch Lanka features a premium, clean slate-based visual theme configured using Tailwind CSS variables (defined in `src/styles/theme.css` and `src/constants/theme.ts`):

* **Primary Color (Sapphire Blue):** `#1E3A8A` (CSS: `--color-primary`) — Symbolizes authority, reliability, and scientific medical precision. Applied to core navigational elements, active anchors, and primary CTA buttons.
* **Secondary Color (Emerald Teal):** `#0EA5A4` (CSS: `--color-secondary`) — Represents hope, safety, and health. Used to mark success signals, highlights, secondary widgets, and guidelines.
* **System Status Tones:**
  * **Danger/Alert:** `#DC2626` — High severity alerts.
  * **Warning:** `#F97316` — Moderate severity advisories.
  * **Success:** `#16A34A` — Resolved cases and verified data status.
* **Adaptive Surface System:**
  * **Light Mode:** Canvas Background: `#F8FAFC`, Dashboard Surface: `#FFFFFF`, Borders: `#E2E8F0`
  * **Dark Mode:** Canvas Background: `#0F172A`, Dashboard Surface: `#1E293B`, Borders: `#334155`
* **Border Radii Guidelines:** `sm: 6px` (utility items), `md: 8px` (buttons/inputs), `lg: 12px` (standard dashboard cards), `xl: 16px` (main dynamic containers).

---

## 🧪 Testing & Code Quality

Maintain codebase stability, type security, and code quality using the following triggers:

```bash
# Perform static code analysis and linting audits
npm run lint

# Execute Jest unit and integration tests
npm run test

# Run a full production compilation build test
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute this platform as needed to foster open-source epidemiological solutions.

---

## 📞 Support & Contributing

For bug reports, feature suggestions, or direct contributions:
1. Open a bug report/feature request in the **Issues** section.
2. Fork the repository, create a descriptive feature branch (`feature/amazing-capability`), commit your changes, and open a **Pull Request**.
