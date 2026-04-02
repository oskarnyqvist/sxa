# Loopia CLI — DNS-hantering

## Vad är det?

Python CLI-verktyg för att hantera DNS-poster via Loopias API. Används av sxa CLI:t för att automatisera subdomäner och TLS-cert.

## Loopias API

Loopia har ett XMLRPC-API: https://www.loopia.se/api/

Stödjer:
- Lägga till/ta bort/lista DNS-poster (A, CNAME, TXT, MX etc)
- Hantera subdomäner
- Hantera zoner

Kräver API-användare — skapas i Loopia kundzon.

## Tänkt användning

```bash
# Direkt
loopia list sxa.se                     # lista alla poster
loopia add sxa.se projektnamn A 1.2.3.4  # lägg till subdomän
loopia remove sxa.se projektnamn       # ta bort subdomän

# Via sxa CLI
sxa new project mitt-projekt           # skapar subdomän automatiskt via loopia-toolet
sxa deploy mitt-projekt                # verifierar att DNS finns
```

## Plats i repot

```
tools/
  loopia/         ← Python-paket
    __init__.py
    cli.py        ← Typer CLI
    api.py        ← XMLRPC-wrapper mot Loopias API
```

## Att göra

- [ ] Skapa API-användare i Loopia kundzon
- [ ] Spara credentials i secrets/loopia.sops.env
- [ ] Bygga XMLRPC-wrapper
- [ ] Bygga CLI med Typer
- [ ] Integrera i sxa CLI
- [ ] Använda för Caddy DNS-challenge (wildcard-cert)
