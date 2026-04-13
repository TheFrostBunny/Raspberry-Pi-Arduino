# Prosjekt: Raspberry Pi med Arduino


Dette prosjektet består av kode for både Arduino og Python, inkludert et webgrensesnitt og installasjonsskript for Raspberry Pi.

## Prosjektstruktur

```
start.sh
Arduino/
    arduino_code.ino
Python/
    core_logic.py
    requirements.txt
    Web/
        web_ui.py
Script/
    install_pi.sh
```

### Beskrivelse av mapper og filer

- **start.sh**: Oppstartsskript for prosjektet.
- **Arduino/**: Inneholder Arduino-kode (`arduino_code.ino`).
- **Python/**: Python-kode for prosjektets logikk.
    - `core_logic.py`: Kjernelogikk i Python.
    - `requirements.txt`: Avhengigheter for Python-koden.
    - **Web/**: Webgrensesnitt skrevet i Python (`web_ui.py`).
- **Script/**: Installasjonsskript for Raspberry Pi (`install_pi.sh`).

## Kom i gang

1. **Installer avhengigheter**
   
   Gå til `Python/`-mappen og installer nødvendige Python-pakker:
   ```bash
   pip install -r requirements.txt
   ```

2. **Kjør webgrensesnittet**
   
   Fra `Python/Web/`-mappen:
   ```bash
   python web_ui.py
   ```

3. **Kjør Arduino-koden**
   
   Åpne `Arduino/arduino_code.ino` i Arduino IDE og last opp til din Arduino-enhet.

4. **Installer på Raspberry Pi**
   
   Kjør installasjonsskriptet:
   ```bash
   bash Script/install_pi.sh
   ```
