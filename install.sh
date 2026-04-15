#!/bin/bash
# Installerer og setter opp React-app for frontend

# Sjekk om Node.js og npm er installert
if ! command -v node > /dev/null 2>&1; then
    echo "❌ Node.js er ikke installert! Installer Node.js først."
    exit 1
fi
if ! command -v npm > /dev/null 2>&1; then
    echo "❌ npm er ikke installert! Installer npm først."
    exit 1
fi

# Opprett React-app hvis den ikke finnes
if [ ! -d "frontend" ]; then
    echo "🟢 Oppretter React-app i ./frontend ..."
    npx create-react-app frontend
else
    echo "✅ React-app finnes allerede i ./frontend"
fi

# Installer axios for API-kall
cd frontend
npm install axios
cd ..

echo "🚀 React-app er klar! Kjør 'cd frontend && npm start' for å starte utviklingsserveren."
