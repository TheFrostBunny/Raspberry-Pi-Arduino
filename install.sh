#!/bin/bash
# Installerer og setter opp React-app for frontend


# Sjekk og installer Node.js og npm på Raspberry Pi hvis nødvendig
if ! command -v node > /dev/null 2>&1 || ! command -v npm > /dev/null 2>&1; then
    echo "🔄 Node.js og/eller npm ikke funnet. Prøver å installere..."
    # Sjekk om vi er på Raspberry Pi
    if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "❌ Node.js og npm må installeres manuelt på dette systemet."
        exit 1
    fi
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
