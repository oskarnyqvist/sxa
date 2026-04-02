# Infrastruktur & Deploy

## Server

- Hetzner VPS (Ubuntu 24.04) — IP finns i `secrets/hetzner.sops.env`
- SSH som root: `ssh root@<IP>`
- Docker + Docker Compose installerat

## Vad som körs på servern

Allt ligger i `/root/sxa/infra/` på servern:

- **Caddy** — reverse proxy, automatiska TLS-cert (HTTP-challenge)
- **PostgreSQL 16** — delad av alla projekt, intern nätverksaccess, aldrig exponerad publikt

Compose-filerna speglar `infra/` lokalt.

## Nätverk

- `web` — Caddy och projektens frontend/backend-containers
- `internal` — PostgreSQL, bara nåbar från andra containers

## Secrets

- Krypterade med **sops + age**
- Nyckel: `secrets/age-key.txt` (aldrig incheckad)
- Dekryptera: `SOPS_AGE_KEY_FILE=~/sxa/secrets/age-key.txt sops -d secrets/<fil>`
- Redigera: `sops secrets/<fil>` (kräver `SOPS_AGE_KEY_FILE` i env)
- Filer:
  - `secrets/hetzner.sops.env` — server-IP, S3-creds
  - `secrets/db.sops.env` — postgres-lösenord

## Deploy av infrastruktur

```bash
# Kopiera filer till servern
scp -r infra/ root@<IP>:/root/sxa/infra/

# Dekryptera och kopiera secrets som .env
SOPS_AGE_KEY_FILE=~/sxa/secrets/age-key.txt sops -d secrets/db.sops.env > /tmp/db.env
scp /tmp/db.env root@<IP>:/root/sxa/infra/.env
rm /tmp/db.env

# Starta/uppdatera
ssh root@<IP> "cd /root/sxa/infra && docker compose up -d"
```

## DNS

- Domän: `sxa.se` hos Loopia
- Wildcard A-record `*.sxa.se` → serverns IP
- Varje projekt får en subdomän, t.ex. `projektnamn.sxa.se`
- Caddy hanterar TLS per subdomän (HTTP-challenge, inte wildcard-cert ännu)

## Lägga till ett nytt projekt

1. Skapa Caddy-block i `infra/Caddyfile` för subdomänen
2. Lägg till projektets containers i egen `docker-compose.yml` under `projects/<namn>/`
3. Anslut till `web`-nätverket (för Caddy) och `internal` (för postgres)
4. Deploya enligt ovan

## Objektlagring

- Hetzner Object Storage (S3-kompatibelt)
- Bucket och creds finns i `secrets/hetzner.sops.env`
- Används för filuppladdning och databas-backup
