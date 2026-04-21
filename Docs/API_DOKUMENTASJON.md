# API-dokumentasjon

Denne dokumentasjonen forklarer hvordan API-et i prosjektet fungerer, med fokus på Python-delen (`core_logic.py` og `web_server.py`).

## Oversikt
API-et gir funksjonalitet for å kommunisere mellom webgrensesnittet og maskinvaren (f.eks. Raspberry Pi og Arduino). Web-serveren eksponerer ulike endepunkter som frontend kan bruke for å hente status, sende kommandoer og motta data.

## Endepunkter

### Eksempel på typiske endepunkter
- `/status` — Henter statusinformasjon fra maskinvaren
- `/led` — Slår LED på/av eller endrer lysstyrke
- `/kamera` — Starter/stopper videostrøm eller tar bilde
- `/sensor` — Henter sensordata

**NB:** Faktiske endepunkter og parametre kan variere. Se kildekoden i `web_server.py` for detaljer.

## Hvordan bruke API-et

1. **Start serveren**
   - Kjør `web_server.py` for å starte API-serveren.
   - Eksempel:
     ```bash
     python Python/web_server.py
     ```

2. **Send forespørsler**
   - Bruk HTTP-klient (f.eks. curl, Postman eller fra frontend) for å sende forespørsler til serveren.
   - Eksempel med curl:
     ```bash
     curl http://localhost:8000/status
     ```

3. **Respons**
   - Responsen er vanligvis i JSON-format med relevante data eller statusmeldinger.

## Typisk flyt
1. Frontend sender HTTP-forespørsel til API-et.
2. `web_server.py` mottar forespørselen og kaller funksjoner i `core_logic.py`.
3. Resultatet returneres som JSON til frontend.

## Eksempel på JSON-respons
```json
{
  "status": "ok",
  "led": true,
  "temperature": 22.5
}
```

## Utvidelse
- For å legge til nye funksjoner, definer nye ruter i `web_server.py` og implementer logikk i `core_logic.py`.

## Feilhåndtering
- API-et returnerer feilmeldinger i JSON ved feil, f.eks.:
```json
{
  "status": "error",
  "message": "Ugyldig forespørsel"
}
```

## Kontakt
For spørsmål, se README.md eller kontakt prosjektansvarlig.
