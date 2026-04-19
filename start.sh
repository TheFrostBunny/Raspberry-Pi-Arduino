#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { printf "%b[INFO]%b %s\n" "$BLUE" "$NC" "$1"; }
success() { printf "%b[OK]%b %s\n" "$GREEN" "$NC" "$1"; }
warn()    { printf "%b[ADVARSEL]%b %s\n" "$YELLOW" "$NC" "$1"; }
error()   { printf "%b[FEIL]%b %s\n" "$RED" "$NC" "$1"; exit 1; }

run() {
  "$@" || error "Kommando feilet: $*"
}

is_pi() {
  grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null || return 1
}

echo "=============================================="
info "Starter komplett oppsett for Raspberry Pi Kamera"
echo "=============================================="

if [ "$EUID" -ne 0 ]; then
  command -v sudo >/dev/null 2>&1 || error "Dette skriptet krever sudo eller root-tilgang."
fi

if is_pi; then
  info "Raspberry Pi oppdaget — oppdaterer pakker og installerer nødvendige systempakker..."
  sudo apt update -y
  sudo apt upgrade -y
  PKGS=(python3-pip python3-venv python3-dev python3-picamera2 v4l-utils libcamera-apps git curl)
  sudo apt install -y "${PKGS[@]}"
  success "Systempakker installert"
else
  warn "Ikke Raspberry Pi — hopper over Pi-spesifikke systempakker"
fi

# 2. Node.js og npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  info "Node.js/npm ikke funnet — forsøker installasjon (Node 18)..."
  if is_pi; then
    command -v curl >/dev/null 2>&1 || sudo apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "Node.js installert"
  else
    warn "Node.js/npm må installeres manuelt på dette systemet."
  fi
else
  success "Node.js og npm er installert"
fi

# 3. Virtuelt miljø for Python
if [ ! -d ".venv" ]; then
  info "Oppretter Python virtualenv (.venv)..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip setuptools wheel

# 4. Python-avhengigheter
if [ -f "Python/requirements.txt" ]; then
  info "Installerer Python-avhengigheter fra Python/requirements.txt"
  pip install -r Python/requirements.txt
fi
# Installer spesifikke pakker hvis ikke i requirements
PY_PKGS=(flask pyserial opencv-python numpy pillow)
for p in "${PY_PKGS[@]}"; do
  python3 -c "import ${p%%-*}" >/dev/null 2>&1 || pip install "$p"
done
success "Python-avhengigheter installert"

# 5. Kamera-konfigurasjon
CONFIG_FILE="/boot/config.txt"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="/boot/firmware/config.txt"

if [ -f "$CONFIG_FILE" ]; then
  info "Sikkerhetskopierer $CONFIG_FILE"
  sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  sudo bash -c "grep -q '^start_x=1$' '$CONFIG_FILE' || echo 'start_x=1' >> '$CONFIG_FILE'"
  sudo bash -c "grep -q '^gpu_mem=' '$CONFIG_FILE' || echo 'gpu_mem=128' >> '$CONFIG_FILE'"
  sudo bash -c "grep -q '^camera_auto_detect=' '$CONFIG_FILE' || echo 'camera_auto_detect=1' >> '$CONFIG_FILE'"
  success "Kamera-konfigurasjon oppdatert i $CONFIG_FILE"
else
  warn "Fant ikke $CONFIG_FILE — hopper over kamera-konfig"
fi

# 6. Frontend
if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
  info "Oppretter React frontend med create-react-app..."
  command -v npx >/dev/null 2>&1 || run sudo npm install -g npx
  npx --yes create-react-app frontend
  cd frontend
  npm install axios --save
  cd ..
fi

# Build/install frontend deps
if [ -d "frontend" ]; then
  info "Installerer frontend-avhengigheter og bygger..."
  cd frontend
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build || warn "npm run build feilet eller ikke definert; prøver å fortsette"
  cd ..
  success "Frontend ferdig"
fi

# 7. Enhets-sjekk
if ls /dev/tty* 2>/dev/null | grep -E "(ACM|USB)" >/dev/null 2>&1; then
  success "Arduino-porter funnet"
else
  warn "Ingen Arduino-porter funnet"
fi

if ls /dev/video* 2>/dev/null >/dev/null 2>&1; then
  success "Video-enheter funnet"
else
  warn "Ingen video-enheter funnet"
fi

# 8. Start backend
BACKEND_PY="Python/web_server.py"
if [ -f "$BACKEND_PY" ]; then
  info "Starter Python-backend ($BACKEND_PY) med nohup (skriv PID til backend.pid)..."
  nohup python3 "$BACKEND_PY" > backend.log 2>&1 &
  echo $! > backend.pid
  success "Backend startet (PID $(cat backend.pid), log: backend.log)"
else
  warn "Fant ikke $BACKEND_PY — hopper over å starte backend"
fi

# 9. Start frontend preview
if [ -d "frontend" ]; then
  info "Starter frontend preview (npm run preview) i bakgrunnen..."
  (cd frontend && npm run preview > ../frontend_preview.log 2>&1 &) || warn "Kunne ikke starte frontend preview"
  success "Forsøkt å starte frontend preview (log: frontend_preview.log)"
fi

echo "=============================================="
success "Oppsett fullført"
echo "=============================================="