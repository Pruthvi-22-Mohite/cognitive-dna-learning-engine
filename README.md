# Cognitive DNA Mapping Engine

A full-stack, AI-powered diagnostic platform designed to analyze how children (ages 8-12) think and learn. By guiding users through gamified cognitive assessments, the engine evaluates real-time telemetry to generate a highly personalized Prescriptive Diagnostic Report, complete with multidimensional scoring, learning style detection, and dynamic remedial action plans powered by Google Gemini.

## Architecture & Tech Stack

This project follows a strictly typed, 3-tier microservices architecture, fully containerized for seamless development and deployment.

### 1. Frontend (User Interface)
- Framework: Next.js (React), TypeScript, TailwindCSS
- Data Visualization: Recharts (Radar charts, Donut Gauges)
- State & Fetching: Zustand, Axios

### 2. Backend (API & Telemetry Routing)
- Server: Node.js, Express.js, TypeScript
- Database: MongoDB (via Mongoose)
- Security: JWT, bcrypt

### 3. AI Engine (Machine Learning & GenAI)
- Framework: Python, FastAPI
- Data Science: Scikit-learn, NumPy (Cognitive Trait Scoring)
- Generative AI: Google Gemini API (Dynamic Remedial Plans)
- Role: Ingests raw telemetry, calculates cognitive trait scores, detects dominant learning styles, and prompts Gemini to generate highly randomized, personalized YouTube learning queries based on the child's cognitive footprint.

### 4. Infrastructure
- Containerization: Docker, Docker Compose

## Key Features

- 5-Dimension Cognitive Assessment: Tests Memory, Pattern Recognition, Logic, Reading Comprehension, and Processing Speed.
- Real-Time Adaptive Difficulty: Dynamically scales question difficulty based on millisecond-accurate response times and accuracy.
- Contextual Question Reframing: Automatically reframes failed questions using relatable themes to bypass learning anxiety.
- AI-Powered Action Plan: Utilizes the Gemini API to generate a highly specific, non-repetitive Remedial Action Plan, matching distinct YouTube educational videos to the child's specific weaknesses and learning style.
- Print-Ready Export: The dashboard utilizes tailored CSS `@media print` rules to instantly export as a clean, professional A4 PDF.

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- A Google Gemini API Key

### Installation (Docker Method)

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cognitive-dna-engine.git
cd cognitive-dna-engine
```

2. Environment setup:

Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Build and launch:

```bash
docker-compose up --build
```

Access the application:

- Frontend (Next.js): `http://localhost:3000`
- Backend API (Node.js): `http://localhost:5000`
- AI Engine (FastAPI): `http://localhost:8000/docs`
