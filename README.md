# SXA

Enkel plattform för att snabbt starta proof of concept-projekt på egen infrastruktur.

## Stack

- **Server:** Hetzner VPS (Ubuntu 24.04)
- **Reverse proxy:** Caddy (automatiska TLS-cert)
- **Databas:** PostgreSQL 16
- **Objektlagring:** Hetzner Object Storage (S3-kompatibelt)
- **Secrets:** age + sops

## Struktur

```
sxa/
  infra/              ← Docker Compose, Caddyfile, välkomstsida
  secrets/            ← Krypterade med sops/age
  projects/           ← Ett projekt per subdomän (projekt.sxa.se)
  tools/              ← CLI-verktyg (sxa-kommandot)
```

## Komma igång

```bash
# Dekryptera secrets
export SOPS_AGE_KEY_FILE=~/sxa/secrets/age-key.txt
sops -d secrets/hetzner.sops.env

# Deploya infrastruktur
scp -r infra/ root@<SERVER_IP>:/root/sxa/infra/
ssh root@<SERVER_IP> "cd /root/sxa/infra && docker compose up -d"
```
