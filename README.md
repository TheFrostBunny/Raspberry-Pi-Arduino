# Raspberry Pi Arduino Kontrollpanel

Dette prosjektet gir deg et komplett oppsett for Raspberry Pi med Arduino, Python-backend og moderne React-frontend. Alt installeres og startes automatisk med ett skript.

## Prosjektstruktur

```
start.sh
Arduino/
  arduino_code.ino
  arduino_ar_enhanced.ino
Python/
  core_logic.py
  web_server.py
  requirements.txt
Docs/
  AR_README.md
Web/
  (React/Vite frontend)
config.json
LICENSE
README.md
```

## Oppsett og bruk

1. **Krav:**
   - Raspberry Pi (anbefalt, men kan kjøres på Linux/Mac/WSL)
   - Arduino (valgfritt, for maskinvareintegrasjon)
   - Python 3.8+
   - Git

2. **Automatisk installasjon og oppstart:**

   Fra prosjektroten, kjør:

   ```bash
   bash start.sh
   ```

   Skriptet gjør alt:
   - Installerer nødvendige systempakker (på Pi)
   - Installerer Node.js/npm hvis mangler
   - Setter opp Python virtualenv og alle Python-avhengigheter
   - Konfigurerer kamera i /boot/config.txt (med backup)
   - Oppretter og bygger React-frontend (med axios)
   - Sjekker tilkoblet Arduino og kamera
   - Starter backend (Python/web_server.py) og frontend (npm run preview)

3. **Arduino:**
   - Åpne Arduino/arduino_code.ino i Arduino IDE og last opp til Arduinoen.

4. **Webgrensesnitt:**
   - Åpne nettleser på: [http://localhost:5173](http://localhost:5173) (eller din Pi-IP:5173)
   - API: [http://localhost:5000](http://localhost:5000)

5. **Stoppe backend:**
   ```bash
   kill $(cat backend.pid)
   ```

## Feilsøking

- Sjekk loggene: `backend.log` (backend), `frontend_preview.log` (frontend)
- Sjekk at du har riktig Python-versjon og at pip/venv er installert
- Kamera: Sjekk at /dev/video* finnes og at config.txt er riktig
- Arduino: Sjekk at /dev/ttyACM* eller /dev/ttyUSB* finnes

## Videre utvikling

- Python-backend: `Python/web_server.py` (API, bildebehandling, maskinvare)
- Frontend: `Web/` (React/Vite, TypeScript, Tailwind)
- Arduino: `Arduino/`

## Lisens

MIT
