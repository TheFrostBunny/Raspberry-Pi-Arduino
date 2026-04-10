#!/bin/bash

# 🚀 Raspberry Pi Arduino Kontrollpanel - Oppstartsskript
# Kjør med: bash start_project.sh

echo "🔧 Raspberry Pi Arduino Kontrollpanel"
echo "====================================="

# Farger
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Sjekk Arduino-tilkobling
echo "🔍 Sjekker Arduino-tilkobling..."
if ls /dev/tty* 2>/dev/null | grep -E "(ACM|USB)" > /dev/null; then
    ARDUINO_PORT=$(ls /dev/tty* | grep -E "(ACM|USB)" | head -1)
    echo -e "${GREEN}✅ Arduino funnet på: $ARDUINO_PORT${NC}"
else
    echo -e "${YELLOW}⚠️ Ingen Arduino funnet. Sjekk USB-tilkobling.${NC}"
fi

# Sjekk webcam
echo "📹 Sjekker webcam..."
if ls /dev/video* 2>/dev/null > /dev/null; then
    VIDEO_DEVICES=$(ls /dev/video* | tr '\n' ' ')
    echo -e "${GREEN}✅ Video-enheter funnet: $VIDEO_DEVICES${NC}"
else
    echo -e "${YELLOW}⚠️ Ingen video-enheter funnet.${NC}"
fi

# Sjekk at Python-filen finnes
if [ ! -f "raspberry_pi_code.py" ]; then
    echo -e "${RED}❌ raspberry_pi_code.py ikke funnet i denne mappen!${NC}"
    echo "Sørg for at du kjører skriptet fra riktig mappe."
    exit 1
fi

echo ""
echo "🚀 Starter Python-server..."
echo "Trykk Ctrl+C for å stoppe serveren"
echo ""

# Installer nødvendige Python-pakker (OpenCV, Flask, numpy)
echo "🔄 Sjekker og installerer nødvendige Python-pakker..."
pip3 install --upgrade pip > /dev/null 2>&1
pip3 install opencv-python flask numpy > /dev/null 2>&1

# Sjekk at Haar-cascade-filen finnes (OpenCV laster den vanligvis automatisk, men vi kan gi beskjed)
CASCADE_PATH="$(python3 -c 'import cv2; print(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")')"
if [ ! -f "$CASCADE_PATH" ]; then
    echo -e "${YELLOW}⚠️ Haar-cascade for ansiktsgjenkjenning mangler!${NC}"
    echo "Last ned fra: https://github.com/opencv/opencv/tree/master/data/haarcascades"
else
    echo -e "${GREEN}✅ Haar-cascade for ansiktsgjenkjenning funnet${NC}"
fi

# Start Python-serveren
python3 raspberry_pi_code.py