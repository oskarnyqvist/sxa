# Human TODO

Saker som kräver manuella steg, externa konton eller åtkomst.

## Hetzner

- [x] Skapa konto på hetzner.com/cloud
- [x] Skapa projekt "sxa" i Hetzner Console
- [x] Lägg till SSH-nyckel under Security → SSH Keys
- [x] Skapa server (CAX11 eller CX22, Ubuntu 24.04)
- [x] Notera serverns IP-adress
- [x] Skapa Object Storage bucket
- [x] Skapa S3-credentials och spara i secrets/

## DNS

- [x] Peka `*.sxa.se` (wildcard A-record) på serverns IP

## Server (efter SSH-åtkomst)

- [x] Installera Docker
- [x] Verifiera att Caddy + PostgreSQL startar

## Secrets

- [x] Installera age lokalt
- [x] Initiera kryptering för secrets/-mappen (age + sops)

## Kvar att göra

- [ ] Sätta upp Loopia DNS API-integration för wildcard TLS-cert
- [ ] Backup av age-key.txt till lösenordshanterare
