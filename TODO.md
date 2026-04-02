# Claude TODO

Saker som Claude ska förbereda eller bygga.

## Infrastruktur

- [x] Skapa `docker-compose.yml` för basinfrastruktur (Caddy + PostgreSQL)
- [x] Skapa Caddyfile för `sxa.se`
- [x] Skapa välkomstsida för sxa.se
- [ ] Skapa backup-skript: nattlig `pg_dump` → Hetzner Object Storage
- [ ] Loopia DNS-plugin för Caddy (wildcard-cert)

## CLI-verktyget `sxa`

- [ ] Sätta upp grundstruktur för `tools/sxa/` (Typer-baserat)
- [ ] Implementera `sxa new project <namn>` – scaffoldar från mall
- [ ] Implementera `sxa deploy <projekt>` – bygger och startar på servern

## Projektmallar

- [ ] Skapa mall: fullstack (Svelte + FastAPI)
- [ ] Skapa mall: fullstack (Svelte + Django)
- [ ] Skapa mall: data/tool (Python + Marimo)
- [ ] Skapa mall: statisk (Svelte utan backend)
