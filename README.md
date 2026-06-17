# EcoPulse 🌱 — Personal Carbon Intelligence & Behavior Awareness Platform

EcoPulse is a premium personal carbon intelligence platform designed to help individuals understand, track, simulate, and actively reduce their daily carbon footprint.

Unlike standard trackers, EcoPulse focuses on **behavioral change and emotional awareness** through custom dynamic elements: the **Eco-Island Living World** visualization and real-time **Decision Sandbox Nudges**.

**Live Demo**: [eco-pulse-rouge.vercel.app](https://eco-pulse-rouge.vercel.app/)  
**Backend API**: [ecopulse-jmff.onrender.com](https://ecopulse-jmff.onrender.com/)

---

## 🏆 Problem Statement

**Vertical**: Personal Carbon Footprint Tracking, Awareness, and Reduction.

**The Challenge**: Standard dashboards only track retrospectively, failing to drive real-time decision-point changes. EcoPulse addresses this by shifting focus from retrospect to **real-time decision awareness** — intercepting high-carbon choices *before* they happen.

---

## 🛠 Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18 + TypeScript + Vite |
| **State Management** | Zustand with localStorage persistence |
| **Charts** | Recharts 3.8 (Pie, Line) |
| **Animations** | GSAP, Vanta.js (WebGL fog), Lenis (smooth scroll) |
| **Styling** | Tailwind CSS + Custom CSS Design System ("Tactile Journal" theme) |
| **Icons** | Lucide React |
| **Backend** | FastAPI (Python 3.12) + Pydantic v2 |
| **AI Integration** | Google Gemini API (structured JSON output, multi-model fallback) |
| **Testing** | Jest + React Testing Library (frontend), Pytest (backend) |
| **Deployment** | Vercel (frontend), Render via Docker (backend) |
| **Fonts** | Cormorant Garamond (serif), Plus Jakarta Sans (sans) |

---

## 💡 Core Innovations & Behavioral Mechanics

### 1. The Eco-Island (Emotional Visualization)
A living, floating island SVG ecosystem on the dashboard. In real-time, the island's health reflects the user's active emissions via GSAP-animated transitions:
- **Healthy (< 4.0t CO₂e)**: Sunny skies, flying birds, green trees, hopping bunnies, swaying flowers, breathing foxes.
- **Moderate (4.0t – 10.0t CO₂e)**: Foggy skies, birds flee, grass yellows, trees wither, animals fade.
- **Severe (> 10.0t CO₂e)**: Stormy dark skies, toxic smog, dead soil, bare branches, all dwellers vanish.

### 2. Decision Point Sandbox (Contextual Nudges)
Simulates real-world choice points (food delivery, commute routes) to inject carbon warnings *before* confirmation:
- **Food Delivery**: Beef Burger (8.2 kg CO₂e) vs. Vegan Bowl (0.6 kg CO₂e) — with equivalency comparisons.
- **Commute Route**: Petrol SUV solo (6.2 kg CO₂e) vs. Train transit (0.8 kg CO₂e).
- **Behavioral Loop**: "Switch to Eco" button corrects the choice, logs savings, triggers confetti, and grants +50 XP.

### 3. Pluggable GenAI Integration (Google Gemini API)
Evaluators can paste their own Google Gemini API Key locally. Features:
- **Dynamic Multi-Model Discovery & Prioritization Fallback**: The backend dynamically queries the API with the user's key to find which models are active and supported for `generateContent` (preventing 404s for restricted models). It then sorts and attempts them in priority order, prioritizing low-traffic, high-quota models first (`lite` models like `gemini-2.0-flash-lite`, `8b` models, and `preview` models) to bypass free-tier rate limits (429s) before falling back to heavier models (`flash`, `pro`).
- **Auto-Log Extraction**: Detects eco activities mentioned in chat and automatically logs them.
- **Scope-Locked Prompts**: AI refuses non-eco questions and outputs plain-text-only responses.
- **Offline Simulation**: When no API key is configured, a keyword-based fallback provides relevant eco tips.

### 4. Gamification System
- **5-Level Progression**: Eco Seed → Eco Seedling → Active Sprout → Forest Protector → Eco Guardian.
- **XP Rewards**: 50 XP for onboarding, 10 XP per log, 25 XP per habit, 30-50 XP for nudge decisions.
- **Daily Streaks**: Consecutive logging days tracked and displayed.
- **Leaderboard**: Competitive ranking with simulated community participants.

### 5. Storytelling Landing Page
Full-page scroll experience with:
- **Vanta.js WebGL Fog** background
- **GSAP ScrollTrigger** animations (word reveals, parallax images, counter animations)
- **Lenis Smooth Scroll** integration
- Animated comparative statistics: India (1.9t), Global Target (2.0t), US/Western (16.0t)

---

## 🔌 Carbon Math Coefficients

| Category | Factor | Value |
|:---|:---|:---|
| Transport – Petrol | kg CO₂/mile | 0.411 |
| Transport – EV | kg CO₂/mile | 0.12 |
| Transport – Transit | kg CO₂/mile | 0.08 |
| Diet – Beef | kg CO₂/serving | 7.2 |
| Diet – Poultry/Fish | kg CO₂/serving | 2.4 |
| Diet – Vegetarian | kg CO₂/serving | 1.1 |
| Diet – Vegan | kg CO₂/serving | 0.5 |
| Energy – Grid | kg CO₂e/kWh | 0.385 |
| Waste – Compost | kg CO₂e saved | -0.5 |
| Waste – Recycle | kg CO₂e saved | -0.3 |
| Waste – Landfill | kg CO₂e emitted | +1.5 |

---

## 📁 Project Structure

```
EcoPulse/
├── frontend/               # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Tab components (Home, Dashboard, Nudges, Tracker, ActionCenter, Assistant, EcoIsland, LandingPage, Onboarding)
│   │   ├── store.ts        # Zustand state management with persist middleware
│   │   ├── utils/           # carbonMath.ts — shared carbon calculation functions
│   │   └── index.css       # Tactile Journal design system (877 lines)
│   └── package.json
├── backend/                # FastAPI + Pydantic v2
│   ├── main.py             # API endpoints + Gemini structured output chatbot
│   ├── database.py         # Thread-safe JSON file database
│   ├── schemas.py          # Pydantic v2 request/response schemas
│   ├── test_backend.py     # Core endpoint tests (Pytest)
│   ├── test_backend_brutal.py  # Edge-case stress tests (Pytest)
│   ├── Dockerfile          # Production Docker image
│   └── requirements.txt
├── assets/                 # AI-generated educational illustrations
└── README.md
```

---

## 🧪 Testing

### Frontend (Jest + React Testing Library)
```bash
cd frontend && npm test
```
- **Zustand Store Tests**: Initial state, onboarding completion, log CRUD, habit toggling, XP/level progression, streak tracking.
- **Onboarding Component Tests**: Rendering, step navigation, disabled states, store integration.

### Backend (Pytest)
```bash
cd backend && pytest
```
- **Core Tests**: DB initialization, baseline calculation, log CRUD, chat endpoint validation.
- **Brutal/Edge-Case Tests**: Negative values, massive inputs (1e20), 500KB strings, NaN parameters, type mismatches, Gemini connection failure mocking.

---

## 🚀 Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # Starts FastAPI on http://localhost:8000
```

### Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key (backend, optional)
- `FRONTEND_URL` — Frontend origin for CORS (backend)
- `VITE_BACKEND_URL` — Backend URL (frontend)

---

## ♿ Accessibility
- WAI-ARIA roles (`role="tabpanel"`, `role="radiogroup"`, `aria-label`, `aria-expanded`)
- Keyboard navigation support
- `prefers-reduced-motion` media query — disables all GSAP animations
- Semantic HTML5 elements
- Focus-visible states for interactive elements
- Custom scrollbar styling

---

## 📜 License
© 2026 EcoPulse 🌱 — All rights reserved.
