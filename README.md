# SXA

Plattform för att snabbt starta proof of concept-projekt på egen infrastruktur. Ett projekt = en subdomän under `*.sxa.se`.

## Stack

- **Server:** Hetzner VPS (Ubuntu 24.04)
- **Reverse proxy:** Caddy (automatiska TLS-cert)
- **Databas:** PostgreSQL 16
- **Objektlagring:** Hetzner Object Storage (S3-kompatibelt)
- **Secrets:** age + sops

## Struktur

```
sxa/
  infra/              ← docker-compose.yml, Caddyfile, statisk www/
  secrets/            ← age + sops-krypterade
  games/              ← spel, en mapp per subdomän
    game0/            ← landningssida
    gamelab/          ← experimentyta
    starsandcomets/   ← se games/starsandcomets/README.md
  services/           ← backend-tjänster
    data/             ← Django, save-data för spelen → data.sxa.se
  tools/              ← deploy- och adminkommandon
    deploy-game0
    deploy-gamelab
    deploy-starsandcomets
    deploy-data
    sxa-data
    dump-data
    seed-local
    loopia
```

## Komma igång

```sh
export SOPS_AGE_KEY_FILE=$PWD/secrets/age-key.txt
sops -d secrets/hetzner.sops.env       # verifiera att secrets dekrypteras

# Första uppsättningen av infra (engångs)
scp -r infra/ root@<SERVER_IP>:/root/sxa/infra/
ssh root@<SERVER_IP> "cd /root/sxa/infra && docker compose up -d"
```

## Deploya ett projekt

Varje projekt har ett deploy-script i `tools/`. De bygger lokalt, rsyncar till servern och reloadar Caddy om nödvändigt.

```sh
tools/deploy-starsandcomets       # bygger games/starsandcomets, rsyncar, reloadar Caddy
tools/deploy-game0
tools/deploy-data                 # backend (Django)
```

Varje script behöver `SOPS_AGE_KEY_FILE` (default: `secrets/age-key.txt`) för att läsa `HETZNER_IP`.

## Per-projekt-dokumentation

- [`games/starsandcomets/README.md`](games/starsandcomets/README.md) — gravitationssimulator
- [`services/data/README.md`](services/data/README.md) — Django-tjänsten

## Spinna upp ett nytt projekt

1. Skapa katalog under `games/<namn>/` (eller `services/<namn>/` för backend).
2. Kopiera ett befintligt deploy-script i `tools/` och anpassa `GAME_DIR`/`LOCAL_WWW`/subdomän.
3. Lägg till routes i `infra/Caddyfile` för subdomänen.
4. Första deployen: `tools/deploy-<namn>`.
