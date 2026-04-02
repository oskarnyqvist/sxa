# SXA – Projektarkitektur & Infrastruktur

## Översikt

En enkel, kostnadseffektiv plattform för att snabbt kunna starta upp proof of concept-projekt, med möjlighet att enkelt flytta vidare om något tar fart.

---

## Hosting

- **Server:** Hetzner VPS (CAX11 eller CX22, ~4–6€/mån)
- **Objektlagring:** Hetzner Object Storage, S3-kompatibelt (~6€/TB/mån)
- **Reverse proxy:** Caddy – automatiska TLS-cert, enkel konfiguration
- **Isolation:** Docker Compose per projekt

---

## Mappstruktur (lokalt)

```
~/sxa/
  skills/          ← Markdown-filer med AI-kontext och globala instruktioner
  tools/           ← Python CLI-tools, t.ex. sxa-kommandot (byggt med Typer/Click)
  secrets/         ← Krypterat med age/git-crypt, incheckat i privat git-repo
  projects/
    one-for-all/
    another-thing/
```

Allt versionshanterat i privat git-repo.

---

## Per projekt

### Struktur

```
projects/one-for-all/
  docker-compose.yml
  backend/           ← Django eller FastAPI
  frontend/          ← Svelte (multi-stage Dockerfile → statiska filer)
  .env               ← pekar på secrets/
```

### Subdomäner

Varje projekt får en egen subdomän: `oneforall.sxa.se`

- Enkelt att flytta till egen domän – bara ändra DNS-pekare
- Eget TLS-cert via Caddy
- Tydlig isolation mellan projekt

### Caddy-konfiguration (exempel)

```
oneforall.sxa.se {
    handle /api/* {
        reverse_proxy backend:8000
    }
    handle {
        root * /srv/frontend
        file_server
    }
}
```

### Projektmallar

| Typ | Stack |
|-----|-------|
| Fullstack | Svelte frontend + Django/FastAPI backend |
| Data/tool | Python, ev. Marimo för webb-UI |
| Statisk | Svelte utan backend |

---

## Databas

- **En PostgreSQL-instans** på servern, delad av alla projekt
- Varje projekt får egen databas och egen användare
- Körs som Docker-container på internt nätverk, aldrig exponerad publikt
- Backup: nattlig `pg_dump` via cron → Hetzner Object Storage

---

## Dataflöde (lokal bearbetning → server)

Tung databearbetning körs lokalt (Python/pandas/etc), resultatet laddas upp:

```
Lokal maskin
  → bearbetar data
  → laddar upp till Hetzner Object Storage (boto3, S3-kompatibelt)

Server/projekt
  → läser från Object Storage
  → triggas via enkel API-endpoint (FastAPI/Django)
```

- **Filer/data:** Object Storage som mellanhand
- **Triggers:** enkel `POST /api/upload-result` för att sätta igång processing

---

## AI-workflow & tools

- `~/sxa/skills/` innehåller markdown-filer som kan pekas på som kontext till Claude
- `~/sxa/tools/` innehåller Python CLI-verktyg, t.ex. ett `sxa`-kommando:

```bash
sxa new project one-for-all   # scaffoldar upp nytt projekt från mall
sxa deploy one-for-all        # bygger och startar på servern
```

Byggs med **Typer** eller **Click**.

---

## Att göra härnäst

- [ ] Sätta upp Hetzner VPS
- [ ] Installera Caddy + Docker på servern
- [ ] Sätta upp PostgreSQL-container
- [ ] Skapa första projektmall (fullstack)
- [ ] Bygga `sxa` CLI-verktyget
- [ ] Konfigurera age/git-crypt för secrets
- [ ] Sätta upp Hetzner Object Storage + backup-cron
