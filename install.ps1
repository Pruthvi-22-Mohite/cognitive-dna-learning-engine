# Cognitive DNA Mapping Engine - Installation Script
# Run this script to set up the entire project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognitive DNA Mapping Engine Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend") -or -not (Test-Path "ai-engine")) {
    Write-Host "Error: Please run this script from the cognitive-dna-engine directory" -ForegroundColor Red
    exit 1
}

# Step 1: Backend Setup
Write-Host "`n[1/4] Setting up Backend..." -ForegroundColor Green
Set-Location backend
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend installation failed!" -ForegroundColor Red
    exit 1
}

# Create .env file for backend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env file from template" -ForegroundColor Green
}
Set-Location ..

# Step 2: AI Engine Setup
Write-Host "`n[2/4] Setting up AI Engine..." -ForegroundColor Green
Set-Location ai-engine

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment. Make sure Python is installed." -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment and install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "AI Engine installation failed!" -ForegroundColor Red
    exit 1
}
deactivate
Set-Location ..

# Step 3: Frontend Setup
Write-Host "`n[3/4] Setting up Frontend..." -ForegroundColor Green
Set-Location frontend
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend installation failed!" -ForegroundColor Red
    exit 1
}

# Create .env file for frontend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env file from template" -ForegroundColor Green
}
Set-Location ..

# Step 4: Summary
Write-Host "`n[4/4] Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All dependencies have been installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB is running (mongod)" -ForegroundColor White
Write-Host "2. Start the services:" -ForegroundColor White
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 (AI Engine):" -ForegroundColor Cyan
Write-Host "   cd ai-engine" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 3 (Frontend):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser!" -ForegroundColor Green
Write-Host ""
Write-Host "For more details, see QUICKSTART.md" -ForegroundColor Cyan
Write-Host ""
