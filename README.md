# 🦠 EpiWatch Lanka

### Infectious Disease Awareness & Prediction Platform
A mobile-friendly web platform for visualizing, analyzing, and predicting infectious disease spread across Sri Lanka using historical epidemiological data.

---

## 📖 Overview

EpiWatch Lanka is a modern, intelligent disease surveillance platform designed to help the public, travelers, and health authorities monitor real-time disease trends in Sri Lanka.  
The system provides:

- District and province–level disease visualizations
- Interactive heatmaps
- Historical trend analysis
- AI-based prediction of future outbreaks (via Gemini/Groq)
- Public awareness & health guidelines
- Alerts for high-risk regions

---

## 🏗️ Tech Stack

### **Frontend & Backend**
- **Framework:** [Next.js 16+](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/)

### **Services & Databases**
- **Authentication & Backend Services:** [Appwrite](https://appwrite.io/)
- **Database (NoSQL):** [MongoDB](https://www.mongodb.com/) (User accounts, preferences, notifications)
- **Caching/Real-time:** [Redis](https://redis.io/), [Socket.io](https://socket.io/)
- **AI/ML:** [Gemini API](https://ai.google.dev/), [Groq](https://groq.com/)
- **Maps:** [TomTom Maps SDK](https://developer.tomtom.com/), [Leaflet.js](https://leafletjs.org/)

---

## ⚙️ Requirements

- **Node.js:** v20 or higher
- **Package Manager:** npm
- **External Accounts:** Appwrite, MongoDB Atlas, Redis, TomTom Developer, Gemini/Groq (API Keys required)

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
Create a `.env` file in the root directory and add the following variables:
```env
# API URLs
NEXT_PUBLIC_API_URL=https://api.epilanka.app

# TomTom Maps
NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

# Databases
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=epilanka
REDIS_PUBLIC_URL=your_redis_url

# AI Service Keys
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Internal Security
NEXT_PUBLIC_SECRET_KEY=your_secret_key
INTERNAL_API_KEY=your_internal_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Starts the production server. |
| `npm run lint` | Runs ESLint to check for code quality. |
| `npm run test` | Runs linting and build process. |

---

## 📂 Project Structure

```text
src/
├── app/             # Next.js App Router (Pages & API Routes)
│   ├── api/         # Backend API endpoints
│   ├── admin/       # Admin-specific pages
│   ├── dashboard/   # User dashboard
│   └── ...          # Other application routes
├── components/      # Reusable React components
├── contexts/        # React Context providers (Auth, etc.)
├── hooks/           # Custom React hooks
├── lib/             # Shared utility functions and library configs
├── styles/          # Global styles and Tailwind configurations
├── types/           # TypeScript definitions
└── constants/       # Global constants and application data
```

---

## 🧪 Tests

Currently, testing is integrated into the build process:
```bash
npm run test
```
*TODO: Add unit and integration tests (e.g., Jest, Playwright).*

---

## 🎨 UI/UX Design Theme

The application follows a **Wine Red + Black + White** color scheme:
- **Primary:** Wine Red (`#A41111`)
- **Dark:** Deep Red (`#8B0000`)
- **Secondary:** Black / Charcoal (`#0D0D0D`, `#1A1A1A`)
- **Background:** White & Light Grey

---

## 📄 License

TODO: Add license information (e.g., MIT, Apache 2.0).

