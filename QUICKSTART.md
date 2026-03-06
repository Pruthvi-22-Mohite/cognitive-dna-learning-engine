# Quick Start Guide - Cognitive DNA Mapping Engine

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### AI Engine
```bash
cd ai-engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 2: Setup Environment Variables

#### Backend (.env)
Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/cognitive-dna
JWT_SECRET=your-super-secret-jwt-key-12345
PORT=5000
NODE_ENV=development
AI_ENGINE_URL=http://localhost:8000
```

#### Frontend (.env)
Create `frontend/.env` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Step 3: Start MongoDB

**Windows:**
```bash
mongod --dbpath "C:\data\db"
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 4: Run All Services

Open **3 separate terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

**Terminal 2 - AI Engine:**
```bash
cd ai-engine
# Make sure virtual environment is activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
AI Engine runs on http://localhost:8000

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

### Step 5: Access the Application

1. Open browser: **http://localhost:3000**
2. Click **"Sign Up"** to create an account
3. Fill in parent details and child information
4. After registration, you'll be redirected to student dashboard
5. Choose an activity (Memory, Pattern, Logic, Reading, or Speed)
6. Complete at least 3 activities
7. Click **"View Your Brain Map"** to see the Cognitive DNA Profile!

## 🎮 Testing the System

### Sample Test Flow

1. **Register Account**
   - Name: Test Student
   - Age: 10
   - Class: 5
   - Parent Email: test@example.com
   - Password: password123

2. **Complete Activities**
   - Memory Challenge (answer 3 questions)
   - Pattern Detective (answer 3 questions)
   - Logic Puzzles (answer 3 questions)

3. **View Results**
   - Navigate to "View Your Brain Map"
   - See radar chart with cognitive scores
   - Review personalized recommendations

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Ensure port 5000 is not in use

### AI Engine errors
- Make sure Python virtual environment is activated
- Check if all packages are installed: `pip install -r requirements.txt`
- Verify port 8000 is available

### Frontend issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check if backend is running on port 5000

### Database connection failed
- Start MongoDB service
- Check MongoDB connection string
- Create database directory if needed

## 📊 What Each Service Does

**Frontend (Port 3000)**: Next.js React app with UI
- Landing page, login, register
- Student dashboard with activity cards
- Quiz interface with timer
- Results page with radar charts

**Backend (Port 5000)**: Node.js Express API
- User authentication (register/login)
- Quiz result storage
- Cognitive profile management
- Forwards data to AI engine

**AI Engine (Port 8000)**: Python FastAPI
- Analyzes quiz performance
- Detects learning patterns
- Generates cognitive profiles
- Creates personalized recommendations

**MongoDB (Port 27017)**: Database
- Stores user accounts
- Saves quiz results
- Maintains cognitive profiles

## 🎯 Next Steps

After testing the basic flow:

1. **Add more questions** to each category
2. **Customize recommendations** in `ai-engine/cognitive_model.py`
3. **Enhance UI** with your own styling
4. **Add multimedia** (images, audio) to questions
5. **Implement adaptive difficulty** based on scores
6. **Set up production deployment** with Docker

## 📝 Tips for Students

- Take breaks between activities
- Don't rush - accuracy matters more than speed
- Try your best on every question
- Complete all 5 activity types for full profile
- Come back monthly to track improvement!

---

**Need Help?** Check the main README.md for detailed documentation.
