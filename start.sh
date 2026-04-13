echo "🔧 Raspberry Pi Arduino"
echo "====================================="

# Farger
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""

if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${GREEN}Raspberry Pi oppdaget! Kjører installasjonsskript...${NC}"
    if [ -f "Script/install_pi.sh" ]; then
        bash Script/install_pi.sh
    else
        echo -e "${RED}❌ Fant ikke Script/install_pi.sh!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Ikke Raspberry Pi, kjører vanlig oppsett...${NC}"
    if ! command -v python3 > /dev/null 2>&1; then
        echo -e "${RED}❌ python3 ikke funnet!${NC}"
        echo "Installer Python 3 før du fortsetter."
        exit 1
    fi
    if ! command -v pip3 > /dev/null 2>&1; then
        echo -e "${RED}❌ pip3 ikke funnet!${NC}"
        echo "Installer pip for Python 3 før du fortsetter."
        exit 1
    fi

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
        exit 1
    fi

    echo ""
    echo "🚀 Starter Python-server..."
    echo "Trykk Ctrl+C for å stoppe serveren"
    echo ""

    echo "🔄 Sjekker nødvendige Python-pakker..."
    PYTHON_PKGS="opencv-python flask numpy"
    for pkg in $PYTHON_PKGS; do
        python3 -c "import $pkg" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Installerer $pkg...${NC}"
            pip3 install $pkg
        else
            echo -e "${GREEN}$pkg er allerede installert${NC}"
        fi
    done

    CASCADE_PATH="$(python3 -c 'import cv2; print(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")')"
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
        exit 1
    else
        echo -e "${GREEN}✅ Port 5000 er ledig${NC}"
    fi
fi

echo "🚀 Starter Web UI-server..."
echo "Trykk Ctrl+C for å stoppe serveren"
echo ""
export PYTHONPATH="${PYTHONPATH}:$(pwd)/Python"
python3 Python/Web/web_ui.py