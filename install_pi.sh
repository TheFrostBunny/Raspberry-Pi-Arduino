#!/bin/bash

# 🔧 Raspberry Pi Arduino Kontrollpanel - Automatisk Installasjonsskript
# Kjør med: bash install_pi.sh

echo "🚀 Starter automatisk installasjon for Raspberry Pi Arduino Kontrollpanel..."
echo "========================================================================"

# Farger for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funksjon for å vise fremgang
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️ WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

# Sjekk at vi er på Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    print_warning "Dette skriptet er laget for Raspberry Pi, men vi fortsetter likevel..."
fi

# 1. Oppdater systemet
print_status "Oppdaterer pakkelister..."
if sudo apt update -y; then
    print_success "Pakkelister oppdatert"
else
    print_error "Kunne ikke oppdatere pakkelister"
    exit 1
fi

print_status "Oppgraderer installerte pakker..."
if sudo apt upgrade -y; then
    print_success "System oppgradert"
else
    print_warning "Noen pakker kunne ikke oppgraderes, men vi fortsetter"
fi

# 2. Installer system-avhengigheter
print_status "Installerer system-pakker..."
SYSTEM_PACKAGES=(
    "python3-pip"
    "python3-dev"
    "python3-picamera2"
    "v4l-utils"
    "libcamera-apps"
    "git"
)

for package in "${SYSTEM_PACKAGES[@]}"; do
    print_status "Installerer $package..."
    if sudo apt install -y "$package"; then
        print_success "$package installert"
    else
        print_warning "Kunne ikke installere $package"
    fi
done

# 3. Oppgrader pip
print_status "Oppgraderer pip..."
if python3 -m pip install --upgrade pip; then
    print_success "pip oppgradert"
else
    print_warning "Kunne ikke oppgradere pip"
fi

# 4. Installer Python-biblioteker
print_status "Installerer Python-biblioteker..."
PYTHON_PACKAGES=(
    "Flask>=2.0.0"
    "pyserial>=3.5"
    "opencv-python>=4.5.0"
    "numpy>=1.21.0"

for package in "${PYTHON_PACKAGES[@]}"; do
    print_status "Installerer $package..."
    if pip3 install "$package"; then
        print_success "$package installert"
    else
        print_error "Kunne ikke installere $package"
        print_status "Prøver alternative installasjonsmetode..."
        if python3 -m pip install "$package"; then
            print_success "$package installert (alternativ metode)"
        else
            print_error "Alternativ installasjonsmetode feilet for $package"
        fi
    fi
done

# 5. Installer requirements.txt hvis den finnes
if [ -f "requirements.txt" ]; then
    print_status "Fant requirements.txt, installerer fra den..."
    if pip3 install -r requirements.txt; then
        print_success "Alle requirements fra requirements.txt installert"
    else
        print_warning "Noen requirements kunne ikke installeres"
    fi
fi

# 6. Konfigurer kamera
print_status "Konfigurerer kamera-innstillinger..."

# Sjekk om config.txt eksisterer og legg til kamera-innstillinger
CONFIG_FILE="/boot/config.txt"
if [ ! -f "$CONFIG_FILE" ]; then
    CONFIG_FILE="/boot/firmware/config.txt"
fi

if [ -f "$CONFIG_FILE" ]; then
    print_status "Legger til kamera-konfigurasjoner i $CONFIG_FILE..."
    
    # Backup av config.txt
    sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Legg til kamera-innstillinger hvis de ikke allerede finnes
    if ! grep -q "start_x=1" "$CONFIG_FILE"; then
        echo "start_x=1" | sudo tee -a "$CONFIG_FILE" > /dev/null
    fi
    if ! grep -q "gpu_mem=" "$CONFIG_FILE"; then
        echo "gpu_mem=128" | sudo tee -a "$CONFIG_FILE" > /dev/null
    fi
    if ! grep -q "camera_auto_detect" "$CONFIG_FILE"; then
        echo "camera_auto_detect=1" | sudo tee -a "$CONFIG_FILE" > /dev/null
    fi
    
    print_success "Kamera-konfigurasjoner lagt til"
else
    print_warning "Kunne ikke finne config.txt for kamera-konfigurasjon"
fi

# 7. Sjekk USB-enheter
print_status "Sjekker tilkoblede USB-enheter..."
if lsusb | grep -i "camera\|webcam\|video" > /dev/null; then
    print_success "USB-kamera oppdaget"
else
    print_warning "Ingen USB-kamera funnet. Koble til webcam og restart skriptet ved behov."
fi

# 8. Sjekk video-enheter
print_status "Sjekker video-enheter..."
if ls /dev/video* > /dev/null 2>&1; then
    print_success "Video-enheter funnet: $(ls /dev/video*)"
else
    print_warning "Ingen video-enheter funnet. Kamera må kanskje aktiveres eller kobles til."
fi

# 9. Test Python-import
print_status "Tester Python-biblioteker..."
python3 -c "
import sys
errors = []

try:
    import flask
    print('✅ Flask: OK')
except ImportError:
    errors.append('Flask')
    
try:
    import serial
    print('✅ PySerial: OK')
except ImportError:
    errors.append('PySerial')
    
try:
    import cv2
    print('✅ OpenCV: OK')
except ImportError:
    errors.append('OpenCV')

try:
    from picamera2 import Picamera2
    print('✅ Picamera2: OK')
except ImportError:
    print('⚠️ Picamera2: Import error (normal if using USB webcam only)')

if errors:
    print(f'❌ Feil med: {', '.join(errors)}')
    sys.exit(1)
else:
    print('🎉 Alle hovedbiblioteker fungerer!')
"

# 10. Lag oppstartsskript (valgfritt)
print_status "Lager praktisk oppstartsskript..."
cat > start_project.sh << 'EOF'
#!/bin/bash
echo "🚀 Starter Raspberry Pi Arduino Kontrollpanel..."
echo "Sjekker Arduino-tilkobling..."
ls /dev/tty* | grep -E "(ACM|USB)" && echo "✅ Arduino-porter funnet" || echo "⚠️ Ingen Arduino funnet"

echo "Starter Python-server..."
python3 raspberry_pi_code.py
EOF

chmod +x start_project.sh
print_success "Oppstartsskript 'start_project.sh' opprettet"

# 11. Sammendrag
echo ""
echo "========================================================================"
echo -e "${GREEN}🎉 INSTALLASJON FULLFØRT! 🎉${NC}"
echo "========================================================================"
echo ""
echo "📋 Hva som er installert:"
echo "   • System-pakker: python3-pip, python3-picamera2, v4l-utils, etc."
echo "   • Python: Flask, PySerial, OpenCV"
echo "   • Kamera-konfigurasjon lagt til"
echo ""
echo "🚀 Neste steg:"
echo "   1. Koble Arduino til USB-port"
echo "   2. Koble USB-webcam til (hvis ønskelig)"
echo "   3. Last opp 'arduino_code.ino' til Arduino"
echo "   4. Kjør: python3 raspberry_pi_code.py"
echo "   5. Eller kjør: bash start_project.sh"
echo ""
echo "🔧 Hvis kamera ikke fungerer:"
echo "   • Restart Raspberry Pi: sudo reboot"
echo "   • Sjekk tilkoblinger"
echo "   • Kjør: libcamera-hello --timeout 2000"
echo ""
echo "📱 Web-grensesnitt vil være tilgjengelig på:"
echo "   http://[din-pi-ip-adresse]:5000"
echo ""
print_success "Klar for bruk! 🎉"