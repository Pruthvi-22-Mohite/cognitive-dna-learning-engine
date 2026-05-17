# 🧠 Cognitive DNA Mapping Engine

A diagnostic platform that analyses how children (ages 8–12) think and learn through interactive games, then generates a **Prescriptive Diagnostic Report** with personalised improvement plans.

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js, TypeScript, TailwindCSS, Framer Motion, Recharts, html2canvas, jsPDF |
| **Backend** | Node.js, Express, TypeScript, MongoDB, JWT |
| **AI Engine** | Python, FastAPI, Google Gemini API (Generative AI), Scikit-learn, NumPy |
| **DevOps** | Docker & Docker Compose |

## 📁 Project Structure

```
├── backend/                  # Node.js Express API
│   ├── controllers/          # Auth, quiz, cognitive analysis, question generator
│   ├── models/               # User, QuizResult, CognitiveProfile schemas
│   ├── routes/               # API route definitions
│   ├── services/             # AI Engine client
│   └── server.ts
├── frontend/                 # Next.js React App
│   ├── hooks/                # useAdaptiveQuiz (difficulty + reframing)
│   ├── pages/                # Landing, login, register, dashboard, quiz, results
│   ├── services/             # Axios API client
│   └── styles/               # Global CSS + print styles
├── ai-engine/                # Python FastAPI
│   ├── main.py               # /analyze endpoint
│   ├── cognitive_model.py    # Trait scoring + learning style detection
│   └── analysis.py           # Statistical + prescriptive report generation
└── docker-compose.yml
```

## ✨ Key Features

### Cognitive Assessment
- **5 Activity Types**: Memory, Pattern Recognition, Logic, Reading Comprehension, Speed
- **Adaptive Difficulty**: Auto-adjusts easy → medium → hard based on real-time performance
- **Question Reframing**: Struggling students get the same question wrapped in fun contexts (Batman, Pikachu, etc.) — difficulty stays the same

### Diagnostic Report (Results Page)
- **Overall Grade**: Advanced Explorer → Needs Guided Support (5 tiers)
- **Performance Gauge**: Half-donut composite score chart
- **Radar Chart**: Spider chart across 5 cognitive dimensions
- **Diagnostic Summary**: True Generative AI (Gemini) written "Doctor's Note" style assessment overview.
- **Remedial Action Plan**: Per-weakness cards with YouTube video + daily improvement tip.
- **Parent/Teacher Guidelines**: Actionable numbered instructions.
- **Print/PDF Export**: Flawless, dynamic multi-page A4 PDF generation using `html2canvas` and `jsPDF`. Scales perfectly to fit extensive AI-generated content.

### AI Analysis Pipeline
```
Quiz Results → Trait Scoring → Learning Style Detection
                              → Weakness Detection (< 50)
                              → Video Mapping + Daily Tips
                              → Grade Assignment
                              → Gemini API Prompting → Unique Natural Language Diagnostics
```

## 🛠️ Quick Setup

### Prerequisites
- Node.js 18+, Python 3.11+, MongoDB

### Run All 3 Services

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev          # → localhost:5000

# Terminal 2 — AI Engine
cd ai-engine && python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000             # → localhost:8000

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev          # → localhost:3000
```

### Environment Variables

**`backend/.env`**
```env
MONGODB_URI=mongodb://localhost:27017/cognitive-dna
JWT_SECRET=your-secret-key
PORT=5000
AI_ENGINE_URL=http://localhost:8000
```

**`ai-engine/.env`** (Required for Generative AI Features)
```env
GEMINI_API_KEY=your-google-gemini-api-key
```

**`frontend/.env`**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Or Use Docker
```bash
docker-compose up --build
```

## 📡 API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/cognitive/submit-results` | Submit quiz → AI analysis → profile |
| `GET`  | `/api/cognitive/profile/:userId` | Get full diagnostic profile |
| `GET`  | `/api/quiz/activities` | List available games |
| `GET`  | `/api/quiz/questions/:type?struggling=true` | Get questions (with reframing) |
| `POST` | `/analyze` *(AI Engine)* | Full cognitive analysis |

## 🎮 User Flow

1. **Register** → Parent creates account with child info
2. **Play Games** → Complete 3–5 cognitive activities
3. **AI Analyses** → Scores traits, detects learning style, identifies weaknesses
4. **View Report** → Diagnostic Certificate with grade, charts, prescriptions
5. **Download** → Print as professional A4 PDF

---

**Version**: 2.0.0 · **Last Updated**: May 2026
