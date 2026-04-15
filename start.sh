# Start React frontend
if [ -d "frontend" ]; then
    echo "🚀 Installerer npm-avhengigheter for React frontend..."
    cd frontend
    npm install
    echo "🚀 Starter React frontend... (Ctrl+C for å stoppe)"
    npm start
    cd ..
else
    echo "❌ React frontend ikke funnet. Kjør start.sh på nytt for å opprette den."
fi
# Sjekk og sett opp React-app hvis ønsket
if [ ! -d "frontend" ]; then
    echo "🟢 Oppretter React-app i ./frontend ..."
    if command -v npx > /dev/null 2>&1 && command -v npm > /dev/null 2>&1; then
        npx create-react-app frontend
        cd frontend
        npm install axios
        cd ..
        echo "🚀 React-app er klar! Kjør 'cd frontend && npm start' for å starte utviklingsserveren."
    else
        echo "❌ Node.js og/eller npm mangler. Installer Node.js og npm for å bruke React frontend."
    fi
else
    echo "✅ React-app finnes allerede i ./frontend"
fi

echo "🔧 Raspberry Pi Arduino"
echo "====================================="

# Funksjon for å sette opp og aktivere .venv
setup_venv() {
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Oppretter .venv...${NC}"
        python3 -m venv .venv
    else
        echo -e "${GREEN}.venv finnes allerede${NC}"
    fi
    # Aktiver venv
    # shellcheck disable=SC1091
    source .venv/bin/activate
    echo -e "${GREEN}Virtuelt miljø aktivert${NC}"
    # Oppgrader pip
    pip install --upgrade pip
}

# Farger
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""


if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${GREEN}Raspberry Pi oppdaget! Kjører installasjonsskript...${NC}"
    setup_venv
    if [ -f "Script/install_pi.sh" ]; then
        bash Script/install_pi.sh
    else
        echo -e "${RED}❌ Fant ikke Script/install_pi.sh!${NC}"
        deactivate
        exit 1
    fi
else
    echo -e "${YELLOW}Ikke Raspberry Pi, kjører vanlig oppsett...${NC}"
    if ! command -v python3 > /dev/null 2>&1; then
        echo -e "${RED}❌ python3 ikke funnet!${NC}"
        echo "Installer Python 3 før du fortsetter."
        exit 1
    fi
    setup_venv
    echo "🔍 Sjekker Arduino-tilkobling..."
    if ls /dev/tty* 2>/dev/null | grep -E "(ACM|USB)" > /dev/null; then
        ARDUINO_PORT=$(ls /dev/tty* | grep -E "(ACM|USB)" | head -1)
        echo -e "${GREEN}✅ Arduino funnet på: $ARDUINO_PORT${NC}"
    else
        echo -e "${YELLOW}⚠️ Ingen Arduino funnet. Sjekk USB-tilkobling.${NC}"
    fi
    echo "📹 Sjekker webcam..."
    if ls /dev/video* 2>/dev/null > /dev/null; then
        VIDEO_DEVICES=$(ls /dev/video* | tr '\n' ' ')
        echo -e "${GREEN}✅ Video-enheter funnet: $VIDEO_DEVICES${NC}"
    else
        echo -e "${YELLOW}⚠️ Ingen video-enheter funnet.${NC}"
    fi
    if [ ! -f "Python/core_logic.py" ]; then
        echo -e "${RED}❌ Python/core_logic.py ikke funnet!${NC}"
        echo "Sørg for at du har riktig mappestruktur: Python/core_logic.py må finnes."
        deactivate
        exit 1
    fi
    echo ""
    echo "🚀 Starter Python-server..."
    echo "Trykk Ctrl+C for å stoppe serveren"
    echo ""
fi



# Installer nødvendige pakker fra requirements.txt (uten opencv-python/cv2)
if [ -f "Python/requirements.txt" ]; then
    # Lag en midlertidig requirements uten opencv-python
    grep -ivE '^opencv-python' Python/requirements.txt > .venv/requirements_no_cv2.txt
    echo -e "${YELLOW}Installerer Python-avhengigheter fra requirements.txt (uten opencv-python)...${NC}"
    pip install -r .venv/requirements_no_cv2.txt
    rm .venv/requirements_no_cv2.txt
else
    echo -e "${RED}Fant ikke Python/requirements.txt!${NC}"
fi

CASCADE_PATH="$(python -c 'import cv2; print(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")')"
if [ ! -f "$CASCADE_PATH" ]; then
    echo -e "${YELLOW}⚠️ Haar-cascade for ansiktsgjenkjenning mangler!${NC}"
    echo "Last ned fra: https://github.com/opencv/opencv/tree/master/data/haarcascades"
else
    echo -e "${GREEN}✅ Haar-cascade for ansiktsgjenkjenning funnet${NC}"
fi

echo "🔎 Sjekker om port 5000 er ledig..."
if lsof -i:5000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 5000 er allerede i bruk!${NC}"
    echo "Stopp prosessen som bruker porten, eller endre port i python-koden."
    deactivate
    exit 1
else
    echo -e "${GREEN}✅ Port 5000 er ledig${NC}"
fi


# Web UI-server (Python) startes ikke automatisk lenger. Bruk kun React frontend.