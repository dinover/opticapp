@echo off
echo 🚀 Iniciando AppDelStream...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: npm no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js y npm encontrados
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

if not exist "frontend/node_modules" (
    echo 📦 Instalando dependencias del frontend...
    cd frontend
    npm install
    cd ..
)

if not exist "backend/node_modules" (
    echo 📦 Instalando dependencias del backend...
    cd backend
    npm install
    cd ..
)

echo ✅ Dependencias instaladas
echo.

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creando archivo de configuración...
    copy "backend\env.example" "backend\.env"
    echo ✅ Archivo .env creado
    echo.
)

echo 🎯 Iniciando la aplicación...
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
echo.
echo ⏳ Espera unos segundos mientras se inician los servidores...
echo.

REM Start the application
npm run dev

pause 