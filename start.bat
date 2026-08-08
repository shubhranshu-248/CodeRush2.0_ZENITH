@echo off
echo ============================================
echo   ForgeAI - Starting Backend + Frontend
echo ============================================
echo.

:: Start backend
echo [1/2] Starting backend server...
cd backend
if not exist "data" mkdir data
if not exist "logs" mkdir logs
start "ForgeAI Backend" cmd /c "pip install -e . && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

:: Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Start frontend
echo [2/2] Starting frontend...
cd frontend
start "ForgeAI Frontend" cmd /c "npm install && npm run dev"
cd ..

echo.
echo ============================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to exit (servers will keep running)
pause >nul
