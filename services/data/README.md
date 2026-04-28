# sxa-data

Delad backend för spelen i `games/`. Django + django-allauth (Google login) + DRF.

## Datamodell

- **Game** — registrerat spel. Hanteras via Django admin (`/admin/`), inte API:et.
  - `slug`, `name`, `description`, `url`, `created_at`
- **Level** — en konfiguration/level skapad av en användare.
  - `game` (FK), `user` (FK), `title`, `description`
  - `data` (JSON — spelets egna parametrar)
  - `schema_version` (int, default 1 — så spelet kan migrera gammalt data inline)
  - `created_at`, `updated_at`

## Endpoints

| Metod | Path | Auth | Vad |
|-------|------|------|-----|
| GET | `/api/health/` | — | Liveness |
| GET | `/api/whoami/` | — | `{authenticated, id, email, username}` |
| GET | `/api/games/` | — | Lista alla registrerade spel |
| GET | `/api/games/<game-slug>/levels/` | ✓ | Mina levels för spelet |
| POST | `/api/games/<game-slug>/levels/` | ✓ | Skapa level. Body: `{title, description?, data, schema_version?}` |
| GET | `/api/games/<game-slug>/levels/<id>/` | ✓ | Hämta en level (bara om jag äger den) |
| PUT | `/api/games/<game-slug>/levels/<id>/` | ✓ | Uppdatera (partial OK) |
| DELETE | `/api/games/<game-slug>/levels/<id>/` | ✓ | Radera |
| GET | `/accounts/google/login/` | — | Starta Google OAuth |
| GET | `/accounts/logout/` | — | Logga ut |

## Klient-mönster (från ett spel)

```js
// Logga in: redirecta hela fönstret hit
window.location = "https://data.sxa.se/accounts/google/login/?next=" + encodeURIComponent(location.href)

// Skapa en level
await fetch("https://data.sxa.se/api/games/starsandcomets/levels/", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
  body: JSON.stringify({ title: "Lugn morgon", data: worldState }),
})

// Hämta mina levels
const levels = await fetch("https://data.sxa.se/api/games/starsandcomets/levels/", {
  credentials: "include",
}).then(r => r.json())
```

CSRF-cookien sätts på `.sxa.se` så den följer med automatiskt — läs ut värdet och skicka som header för POST/PUT/DELETE.

## Lokalt (utan Docker)

```bash
cd services/data
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # sätt DJANGO_DEBUG=1, peka POSTGRES_HOST=localhost, eller byt ENGINE till sqlite
python manage.py makemigrations levels
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# Öppna http://localhost:8000/admin/ och registrera ett Game (slug: starsandcomets)
```

## Första deploy

### 1. Skapa databas + användare i den delade Postgres

På servern:
```bash
ssh root@$IP
cd /root/sxa/infra
docker compose exec postgres psql -U postgres <<'SQL'
CREATE USER sxa_data WITH PASSWORD '<välj-ett-starkt>';
CREATE DATABASE sxa_data OWNER sxa_data;
SQL
```

### 2. Sätt upp Google OAuth-credentials

Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (typ: Web application).
- Authorized redirect URI: `https://data.sxa.se/accounts/google/login/callback/`
- Spara client_id + client_secret.

### 3. Generera och kryptera .env

```bash
cd ~/sxa
cp services/data/.env.example secrets/data.env
$EDITOR secrets/data.env   # fyll i secret_key, postgres-pw, google-creds, ev. CORS
SOPS_AGE_KEY_FILE=secrets/age-key.txt sops -e secrets/data.env > secrets/data.sops.env
rm secrets/data.env
```

### 4. Skapa initial migration lokalt och checka in

```bash
cd services/data
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DJANGO_DEBUG=1 POSTGRES_HOST=localhost python manage.py makemigrations levels
git add levels/migrations/0001_initial.py
```

(Om du inte vill ha lokal Postgres: byt tillfälligt `ENGINE` till `sqlite3` i `settings.py` bara för att generera filen.)

### 5. Deploy

```bash
./tools/deploy-data
```

Skriptet: rsync, sops-decrypt + chmod 600 på `.env`, uppdaterad Caddyfile, `docker compose up -d --build`, reload Caddy. Migrationer körs automatiskt vid container-start.

### 6. Skapa superuser och registrera första spelet

```bash
ssh root@$IP "cd /root/sxa/services/data && docker compose exec data python manage.py createsuperuser"
# Logga in på https://data.sxa.se/admin/ → Games → Add → slug=starsandcomets
```

## Lägga till nästa spel

1. Logga in på `/admin/` och skapa ett nytt `Game`.
2. Lägg spelets origin i `CORS_ALLOWED_ORIGINS` i `secrets/data.sops.env` → re-encrypt → re-deploy.
3. Spelet kallar `/api/games/<slug>/levels/...` — ingen ändring i tjänsten.
