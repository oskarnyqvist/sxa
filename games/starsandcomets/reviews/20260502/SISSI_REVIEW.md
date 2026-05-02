---
date: 2026-05-02
checkpoint: a5cea7d9a856fb569602ebfa2e8408e17614d2d1
short: a5cea7d
---

# Review 2026-05-02

Genomgång av Stars & Comets så som det fungerar idag, och plan för vad som ska göras härnäst.

**Checkpoint-commit:** `a5cea7d` — *Refactor Stars & Comets play view to modeless interaction*. För att gå tillbaka till exakt det tillstånd som denna review beskriver:

```sh
git checkout a5cea7d
```

Screenshots i samma mapp togs på den commiten.

---

## 1. Hur det funkar nu

Appen är en SPA med fyra rutter (`src/App.svelte`):

| Path | Komponent | Skärm |
|---|---|---|
| `/` | `Browse.svelte` | `home.png` |
| `/new` | `New.svelte` | `skapa.png` |
| `/me` | `Me.svelte` | `me.png` |
| `/w/:id` | `Play.svelte` | `game_000.png`, `selected.png` |

Bottennavigationen (`Utforska / Skapa / Mina`) syns alltid utom i `/w/:id`, som körs i `immersive`-läge utan navbar.

Backend är `data.sxa.se` (Django, separat repo) som lagrar levels per användare. Inloggning via Google OAuth.

### 1.1 `/` — Utforska (`home.png`)

`Browse.svelte` försöker först `whoami()` och sedan `listLevels()`. Tre möjliga sluttillstånd:

- **anon** → "Logga in med Google" CTA
- **error** → "Kunde inte nå data.sxa.se." (det som syns i screenshot)
- **ok** → lista med upp till 5 senaste världar + "Skapa en ny värld"-CTA

**Observation:** rubriken är "Utforska världar" men i praktiken visas bara *mina* världar. Det finns ingen feed av andras världar än. När API:t är nere (som i screenshot) blir hela skärmen meningslös — det enda som funkar är "Skapa en ny värld" som leder till draft-läget.

### 1.2 `/new` — Skapa (`skapa.png`)

`New.svelte` listar mallar. Idag finns två:

- **Klassisk binär** (aktiv) → `defaultDraft()` i `src/play/presets.js`: två stjärnor på `[2000,1800]` och `[2000,2200]`, två kometer i bana runt dem. Världsstorlek `4000×4000`, `acceleration: 800`, `maxSpeed: 600`, `attractionMode: 'nearest'`.
- **Tom värld** (disabled, "Kommer snart")

Klick på en mall lägger draften i `sessionStorage` och navigerar till `/w/draft`.

### 1.3 `/me` — Mina världar (`me.png`)

`Me.svelte` listar alla användarens levels med titel + beskrivning. Tomma beskrivningar visas som `—`. Varje rad har ett `×` för borttagning (med `confirm()`-dialog).

**Observation:** "Min värld" i screenshot har ingen beskrivning → strecket ser lite skräpigt ut. Inga thumbnails / förhandsvisning av världen.

### 1.4 `/w/:id` — Play (`game_000.png`, `selected.png`)

Det här är hjärtat i appen. `Play.svelte` mountar canvasen, anropar `bootPlay()` (som sätter upp world / sim / renderer / lab) och visar HUD-element ovanpå.

**HUD som alltid syns:**

- `←` tillbaka till `/`
- `🔒 / 🔓` lås-toggle (visningsläge)
- `Spara / Uppdatera` (kräver inloggning)
- Hastighetsreglage `0x – 2x`, steg `0.05`

**Olåst läge** (default — det som visas i båda screenshotsen, eftersom låset visar `🔒` = "klicka för att låsa"):

- **Toolbox** (`src/play/Toolbox.svelte`) — vertikal pill till vänster med ✦-stjärna och ☄-komet. Tryck och dra ut på canvasen för att placera. En ghost följer pekaren under draget. Släpp utanför canvas avbryter.
- **Markering & inline-handles** (`src/lab.js`) — tap på kropp → markerad (streckad ring runt). Upp till tre handles ritas: `↔` radie (alltid), `⇲` repel (om attractor), `→` velocity (om kometen rör sig). Handles är minst 36 px från centrum på *skärmen*; hit-radius 22 px. I `selected.png` syns det här tydligt på "Comet 2".
- **BottomSheet** (`src/play/BottomSheet.svelte`) — tre snap-punkter `closed / peek / full` (höjd `0 / 80 / 65dvh`). Drag handtaget för fri snap; tap cyklar `closed → full → peek → closed`. När en kropp markeras snäpper sheet automatiskt till `peek`.
  - Objekt-sektion (visas när något markerat): namn, färg, radie, attraktion på/av, repel-radie, svansstil/-längd, stilpreset (`Klassisk / Glow / Neon / Eldkula`), glow, taper, fade, fart-reaktion, ta bort.
  - Värld-sektion (alltid synlig i `full`): acceleration, max hastighet, attraktionsläge.

**Pan & zoom** (alltid, även låst): drag på tom yta = pan; pinch eller mushjul = zoom (`0.1x – 4x`).

**Pausregler** — `lab.isPaused()` returnerar `true` bara när en handle eller kropp dras. Sliders i sheet pausar inte. Lås-läget pausar inte. Hastighet `0x` ger effektiv paus via `dt = 0`. Detaljer i `INTERAKTION.md` §5.

**Spara** (`src/world/serialize.js`) — `schema_version`, `world.{width,height}`, `settings.{acceleration,maxSpeed,attractionMode}` och `bodies[]` med trail-konfig (utan punkthistorik). Draft → `prompt()` för titel → `createLevel` → ersätt route till `/w/<id>`. Befintlig värld → `updateLevel` in-place.

---

## 2. Vad som *inte* finns / inte funkar

Saker som är värda att notera när vi planerar nästa steg:

1. **Ingen "Utforska andras världar"** — `/` visar bara mina. Det finns inget public/share-koncept i datamodellen ännu (vad jag kan se från frontend-sidan).
2. **"Tom värld"-mallen är disabled.** Det finns bara *en* startpunkt.
3. **Inga thumbnails** i `/me` eller `/`. Användaren ser bara titel + datum/beskrivning, vilket gör det svårt att hitta rätt värld.
4. **Description-fältet visas men kan inte redigeras** från UI:t. `Play.svelte` läser `levelMeta.description` men sheet:en har ingen input för det. Save skickar med titel + description, men description blir alltid den som lästes vid load.
5. **Tomma description visas som `—`** i `/me` — kosmetiskt skräp.
6. **Felhantering på `/`** är binär (ok / error). Vid API-fel finns ingen "lokal draft"-fallback eller cachelagrad lista.
7. **Inget undo/redo.** Tryck på "Ta bort" → borta. Att råka dra ihop radien till 2 är permanent.
8. **Ingen kamera-reset / fit-to-view-knapp.** Om man zoomar bort sig långt kan det vara svårt att hitta tillbaka.
9. **Speed-slidern saknar markering för `1x`** — det är inget snap, så det är lätt att missa default.
10. **Toolbox är väldigt smal** — bara två val. När vi lägger till fler typer (svarta hål, dust trails, …) behöver layouten tänkas om.
11. **Sheet på desktop:** drag funkar med pekare, men UX är designat för mobil. Ingen keyboard-shortcut för att stänga.
12. **Svenska + engelska blandas:** "Comet 2" som default-namn (engelska), men UI är svenskt. Bodies skapas i `bodies.js` med engelska defaultnamn.
13. **Backend-kontrakt för `description`:** osäkert om servern returnerar `null` eller `""` för tomma — `Me.svelte` använder `level.description || '—'`, vilket fungerar för båda men maskerar problem.
14. **Build-artefakter `infra/www/game0/`, `infra/www/starsandcomets/`** är otrackade — de bör nog läggas i `.gitignore` om de är resultat av deploy-script.

---

## 3. Plan — vad vi gör härnäst

Sorterat ungefär efter vad som ger mest värde per insats. Vi kan plocka i den ordning som känns rolig.

### A. Snabba kosmetiska fixar (en pass)

- [ ] `/me`: visa inget i stället för `—` när description saknas (eller dölj raden).
- [ ] Speed-slider: visuell markering vid `1x`, ev. dubbel-klick = återställ till `1x`.
- [ ] Default-namn på bodies → svenska (`Stjärna N`, `Komet N`).
- [ ] Lägg `infra/www/` i `.gitignore` (eller verifiera att det är deploy-output som inte ska in).

### B. Description-redigering

- [ ] Lägg in titel- + description-fält längst upp i sheet:ens "Värld"-sektion (eller högst upp i `full`-snap).
- [ ] Skicka med uppdaterad titel/description i `updateLevel`.
- [ ] Vid första save på draft: inputfält i sheet:en i stället för `prompt()`.

### C. Tomma världen + fler mallar

- [ ] Aktivera "Tom värld" i `presets.js` — bara `world` + `settings`, inga bodies.
- [ ] Lägga till en eller två nya mallar att ha på `/new` (t.ex. "Trippel" eller "Ringsystem"), så det är värt att ha en mallväljare.

### D. Kamera-QoL

- [ ] `Fit to view` / `Recenter`-knapp på HUD (uppe höger, bredvid Spara, eller diskret nedtill).
- [ ] Eventuellt dubbel-tap på tom yta = recenter.

### E. Thumbnails i listor

- [ ] Snapshot av canvasen vid Spara — t.ex. en `data:image/jpeg;base64,…` (~10 KB) lagrad i `data`.
- [ ] `Me.svelte` och `Browse.svelte` använder thumbnail som bakgrund/mini-preview.
- [ ] Backend behöver kanske en separat kolumn (men vi kan börja med att stoppa in i `data.preview`).

### F. Public worlds — "Utforska" på riktigt

- [ ] Datamodell på backend: `public: bool` på `Level`.
- [ ] API: `listLevels({ public: true })` eller separat endpoint.
- [ ] `/`: visa både "Mina senaste" och "Utforska andras".
- [ ] Sheet får en "Dela publikt"-toggle.

### G. Robusthet

- [ ] Browse vid API-fel: visa ändå "Skapa en ny värld" + ev. lokala drafts från `sessionStorage`.
- [ ] Undo (minst ett steg) på Ta bort + radie-handle-drag.
- [ ] Auto-save av draft till `localStorage` (inte bara `sessionStorage`) så man kan stänga fliken.

### H. Polish (senare)

- [ ] Keyboard shortcuts för desktop (`L` lås, `Space` paus = sätt 0x, `R` recenter, `Delete` ta bort markerad).
- [ ] Toolbox-layout som tål fler typer (kollapsbar, eller drag-meny).
- [ ] Migrera default-namn på bodies till svenska.

---

## 4. Öppna frågor

- **Public worlds:** är ambitionen att andra ska kunna *fork:a* en värld eller bara titta? (påverkar API-design)
- **Thumbnails:** snapshot av live-canvas, eller renderad i en offscreen canvas vid spar? (offscreen ger jämnare resultat)
- **Sheet-layout på mobil vs desktop:** ska desktop ha en sidopanel i stället för ett bottensheet?
- **Settings.attractionMode:** är de fem alternativen alla värda att exponera, eller borde några gömmas bakom en "avancerat"-toggle?
