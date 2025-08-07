#!/bin/bash

echo "🚀 Instalando OpticApp - Sistema de Gestión Óptica"
echo "=================================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión 18+ es requerida. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instalar dependencias del monorepo
echo "📦 Instalando dependencias del monorepo..."
npm install

# Instalar dependencias del backend
echo "🔧 Instalando dependencias del backend..."
cd backend
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "⚙️  Creando archivo de configuración .env..."
    cp env.example .env
    echo "✅ Archivo .env creado. Por favor revisa y ajusta las configuraciones."
fi

cd ..

# Instalar dependencias del frontend
echo "🎨 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 ¡OpticApp está listo para usar!"
echo ""
echo "📋 Para iniciar el desarrollo:"
echo "   npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "📚 Documentación: https://github.com/dinover/opticapp"
echo "" 