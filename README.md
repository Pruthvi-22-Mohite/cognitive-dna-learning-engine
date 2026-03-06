# 🧠 Cognitive DNA Mapping Engine

A complete production-ready web application that analyzes how children think, learn, solve problems, and respond to tasks. The system creates a **Cognitive DNA Profile** identifying learning styles and abilities through interactive quizzes, puzzles, games, and activities.

## 🎯 Project Overview

**Target Users**: Students of 4th to 6th standard (ages 8-12)

**Purpose**: 
- Evaluate cognitive abilities through interactive activities
- Detect learning traits (logical thinking, visual learning, pattern recognition, memory, reading comprehension)
- Generate personalized Cognitive DNA Maps
- Recommend tailored learning methods

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Charts**: Recharts (Radar/Spider charts)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

### AI Engine
- **Framework**: FastAPI (Python)
- **ML Libraries**: Scikit-learn, NumPy, Pandas
- **Analysis**: Statistical pattern recognition

### DevOps
- **Containerization**: Docker & Docker Compose
- **Deployment Ready**: Yes

## 📁 Project Structure

```
cognitive-dna-engine/
├── backend/                    # Node.js + Express API
│   ├── controllers/           # Business logic
│   │   ├── authController.ts
│   │   ├── quizController.ts
│   │   └── resultController.ts
│   ├── models/                # Database schemas
│   │   ├── User.ts
│   │   ├── QuizResult.ts
│   │   └── CognitiveProfile.ts
│   ├── routes/                # API endpoints
│   │   ├── authRoutes.ts
│   │   ├── quizRoutes.ts
│   │   └── resultRoutes.ts
│   ├── middleware/            # Auth middleware
│   │   └── authMiddleware.ts
│   ├── services/              # External service integration
│   │   └── aiService.ts
│   ├── server.ts              # Main Express app
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Next.js React Application
│   ├── components/            # Reusable UI components
│   │   ├── Quiz/
│   │   ├── Puzzle/
│   │   ├── CognitiveChart/
│   │   └── ProgressDashboard/
│   ├── pages/                 # Application pages
│   │   ├── index.tsx          # Landing page
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── student-dashboard.tsx
│   │   ├── quiz.tsx           # Activity interface
│   │   └── results.tsx        # Cognitive profile display
│   ├── services/              # API client
│   │   └── api.ts
│   ├── utils/                 # Helper functions
│   │   └── formatters.ts
│   ├── styles/                # Global styles
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── Dockerfile
│
├── ai-engine/                  # Python FastAPI Microservice
│   ├── main.py                # FastAPI application
│   ├── cognitive_model.py     # ML model for trait detection
│   ├── analysis.py            # Statistical analysis engine
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml          # Multi-container orchestration
```

## ✨ Features

### 1. Student Cognitive Tests
- **Memory Challenge**: Pattern recall and sequence memory
- **Pattern Detective**: Complete missing patterns
- **Logic Puzzles**: Brain teasers and deductive reasoning
- **Reading Quest**: Comprehension exercises
- **Speed Challenge**: Timed cognitive tasks

### 2. Cognitive DNA Profile Generation
After completing tests, generates comprehensive profile:
```json
{
  "logicalThinking": 82,
  "visualLearning": 65,
  "memory": 74,
  "readingSkill": 60,
  "problemSolving": 78,
  "learningStyle": "Visual+Logical",
  "recommendations": [
    "Use visual diagrams for complex concepts",
    "Practice puzzle-based learning",
    "Memory training with patterns"
  ]
}
```

### 3. AI Analysis Engine
- Pattern detection in answer sequences
- Time-based performance metrics
- Error type analysis
- Consistency measurement
- Learning style classification

### 4. Personalized Recommendations
Based on cognitive profile:
- Visual learning content suggestions
- Puzzle-based exercises
- Reading improvement activities
- Memory training techniques

### 5. Parent Dashboard
- Child's complete cognitive profile
- Progress tracking over time
- Achievement badges
- Recommended exercises

## 🗄️ Database Design

### User Collection
```typescript
{
  _id: ObjectId,
  name: string,
  age: number,      // 8-14
  class: number,    // 4-6
  parentEmail: string,
  password: string, // hashed
  createdAt: Date
}
```

### QuizResult Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  quizType: string,      // memory|pattern|logic|reading|speed
  score: number,         // 0-100
  timeTaken: number,     // seconds
  accuracy: number,      // 0-100
  answers: Array,
  date: Date
}
```

### CognitiveProfile Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  logicalThinking: number,
  visualLearning: number,
  memory: number,
  readingSkill: number,
  problemSolving: number,
  learningStyle: string,
  recommendations: string[],
  lastUpdated: Date
}
```

## 🎨 UI/UX Features

- **Kid-Friendly Design**: Colorful, engaging interface
- **Large Buttons**: Easy navigation for children
- **Gamification**: Badges, stars, progress bars
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Works on tablets, desktops, phones
- **Accessibility**: High contrast, readable fonts

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker & Docker Compose (optional)
- MongoDB (local or cloud)

### Option 1: Docker (Recommended)

```bash
cd cognitive-dna-engine

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up --build

# Access applications:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# AI Engine: http://localhost:8000
# MongoDB: localhost:27017
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
npm install

# Create .env file from .env.example
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret

# Run development server
npm run dev
```

#### AI Engine Setup
```bash
cd ai-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Run development server
npm run dev
```

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/cognitive-dna
JWT_SECRET=your-super-secret-key-change-in-production
PORT=5000
NODE_ENV=development
AI_ENGINE_URL=http://localhost:8000
```

### Frontend (.env)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:userId` - Get user profile

### Quiz Activities
- `GET /api/quiz/activities` - Get available activities
- `POST /api/quiz/submit` - Submit quiz result
- `GET /api/quiz/results/:userId` - Get user results

### Cognitive Profiles
- `GET /api/results/profile/:userId` - Get cognitive profile
- `POST /api/results/profile/update` - Update/create profile
- `GET /api/results/progress/:userId` - Get progress history

### AI Engine
- `POST /analyze` - Analyze quiz results
- `POST /recommendations` - Generate recommendations
- `POST /insights` - Get detailed insights

## 🎮 User Flow

1. **Parent Registration** → Creates account with child details
2. **Login** → Access student dashboard
3. **Select Activity** → Choose from 5 cognitive games
4. **Complete Tests** → Play 3-5 activities
5. **AI Analysis** → System processes performance data
6. **Profile Generation** → Cognitive DNA map created
7. **Dashboard Review** → View strengths, weaknesses, recommendations

## 🏆 Advanced Features

### Adaptive Difficulty
- Automatically adjusts question difficulty based on performance
- Keeps students challenged but not frustrated

### Learning Style Detection
Classifies students as:
- **Visual Learners**: Learn by seeing
- **Logical Learners**: Love patterns and reasoning
- **Verbal Learners**: Prefer reading and discussion
- **Kinesthetic Learners**: Learn by doing

### Growth Tracking
- Month-over-month progress visualization
- Improvement trend analysis
- Consistency metrics

## 🧪 Testing

### Sample Test Data
The system includes sample questions for each activity type. In production, expand with:
- 50+ questions per category
- Multiple difficulty levels
- Multimedia content (images, audio)

## 🚀 Deployment

### Production Considerations
- Use environment-specific .env files
- Enable HTTPS/TLS
- Set up proper CORS
- Use production MongoDB cluster (MongoDB Atlas)
- Implement rate limiting
- Add logging (Winston, Morgan)
- Set up monitoring (New Relic, Datadog)

### Scalability
- Horizontal scaling with load balancers
- Redis caching for frequently accessed data
- CDN for static assets
- Database indexing and optimization

## 📊 Success Criteria

✅ Parent can register and create child account
✅ Student can complete 5 different activity types
✅ System generates cognitive DNA profile with radar chart
✅ Personalized recommendations displayed
✅ Progress tracking functional
✅ Docker compose spins up all services
✅ Clean, modular, production-ready code

## 🎓 Educational Value

This system helps:
- **Identify learning strengths** early
- **Support struggling students** with targeted interventions
- **Personalize education** based on cognitive profiles
- **Track development** over time
- **Build confidence** through gamified assessment

## 📝 License

MIT License - See LICENSE file

## 👥 Credits

Built with ❤️ for young learners everywhere

---

**Version**: 1.0.0  
**Last Updated**: March 2026
