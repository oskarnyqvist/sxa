# Interaktion och tillstånd i Stars & Comets

Det här dokumentet beskriver hur man interagerar med en värld i `/w/:id`-vyn — vilka lägen (states) som finns, vilka inställningar som är tillgängliga i varje läge, och hur simulatorn reagerar (kör/pausad).

Allt nedan utgår från `src/routes/Play.svelte` + `src/play/boot.js` + `src/lab.js` + `src/simulator.js`.

---

## 1. Översikt — två huvudtillstånd

Spelvyn har två yttre tillstånd som styrs av `isEditing` i `Play.svelte`:

| Tillstånd | `isEditing` | `lab.enabled` | HUD-knappar (uppe höger) |
|---|---|---|---|
| **Visningsläge** (default) | `false` | `false` | `Spara`/`Uppdatera`, `✎ Redigera` |
| **Redigeringsläge** | `true` | `true` | `Lägesväljare`, `⚙ Inställningar`, `✓ Klar` |

Man växlar med `✎ Redigera` → går in i redigering, och `✓ Klar` → går tillbaka till visning. När man lämnar redigering återställs läget till `select`.

I **båda** tillstånden finns alltid:
- En **bakåt-knapp** (`←`) uppe vänster — tillbaka till `/`.
- En **hastighetsreglage** nedtill (`hud-speed`, `0–2x`, steg `0.05`).
- **Pan** (dra på tom yta) och **pinch / mushjul-zoom** på canvas.

Sim-loopen kör alltid renderingen. Om simulatorn `tick:ar` beror på det inre läget (se nedan).

---

## 2. Hastighetsreglaget — global tidsskala

`src/play/boot.js:46-50`. Värdet `timeScale` multipliceras med `dt` i loopen:

```js
const dt = Math.min((now - last) / 1000, 0.05) * timeScale;
```

- `timeScale = 0` → effektiv paus (sim-tick körs men `dt = 0`, inget rör sig).
- `timeScale = 1` → normal hastighet.
- `timeScale = 2` → dubbel hastighet.
- Reglaget är synligt och fungerar i **både visnings- och redigeringsläge**.

---

## 3. Visningsläge (`isEditing = false`)

**Simulatorn**: kör (`sim.tick(dt)`).

**Vad du kan göra**:
- Panorera (en finger / vänsterklick + drag på tom yta).
- Zooma (pinch eller scroll-hjul, `0.1x–4x`).
- Trycka `Spara` / `Uppdatera` (kräver inloggning; för draft → prompt om titel och redirect till nytt id).
- Trycka `✎ Redigera` för att gå in i redigeringsläget.

**Vad du *inte* kan göra**:
- Markera, flytta eller skapa kroppar. `lab.enabled = false` blockerar all hit-testing och placering — pointerdown går alltid till `startPan`.
- Öppna inställningspanelen. Panelen har CSS-regeln `#panel:not(.available) { display: none }`, och `.available` sätts bara när `isEditing` är `true`.

---

## 4. Redigeringsläge (`isEditing = true`)

När du går in i redigering: `lab.enabled = true` och `mode` startar i `select`. Inställningspanelen blir tillgänglig (men öppnas inte automatiskt — toggle med `⚙`).

Det finns **fyra** under-lägen i toolbaren (`src/lab.js:15`):

| Läge | Knapp | Sim-tick? | Cursor |
|---|---|---|---|
| `select` | `Markera` | ✅ kör | `default` |
| `addStar` | `+ Star` | ✅ kör | `crosshair` |
| `addComet` | `+ Comet` | ✅ kör | `crosshair` |
| `edit` | `Verktyg` | ⛔ **pausad** | `default` |

Pausen kommer från `boot.js:57`: `if (!lab.isEditing()) sim.tick(dt);` där `lab.isEditing()` enbart är sant i läge `edit`. De övriga tre redigeringslägena låter alltså världen fortsätta röra sig medan du jobbar.

### 4.1 `select` (Markera)

- **Tap på kropp** → markerar den; högerpanelen visar objekt-inställningar.
- **Drag på markerad kropp**:
  - Om kroppen är **pinned** (stjärnor) → flyttas under draget.
  - Om **inte pinned** (kometer) → flyttas *inte* (drag-villkoret kräver `pinned || mode === 'edit'`). Du kan markera en komet men inte flytta den i `select`-läget.
- **Tap på tom yta** → avmarkerar och börjar pan.
- **Pinch** → zoom.

### 4.2 `addStar` (+ Star)

- **Tap var som helst** → skapar en stjärna på den världs-koordinaten via `createStar`. Den nya kroppen markeras automatiskt och läget hoppar tillbaka till `select`.
- Stjärnor är `pinned: true`, `attraction: 1`, `radius: 14`, `repelRadius: 10`, ingen trail.

### 4.3 `addComet` (+ Comet)

- **Pointerdown** → skapar en komet med hastighet `[0, 0]` på den punkten.
- **Drag** → en röd förhandsvisnings-pil ritas från startpunkten till nuvarande pekarposition.
- **Pointerup** → kometens hastighet sätts till `(start - end) * 2`. Dvs man "skjuter" kometen genom att dra åt motsatt håll.
- Kometen markeras automatiskt; läget *byter inte* tillbaka till `select` (man kan placera flera i rad).
- Kometer är `pinned: false`, `attraction: 0`, `radius: 6`, har trail.

### 4.4 `edit` (Verktyg) — det enda pausade läget

- Sim **pausar** så länge man är kvar i läget.
- Alla kroppar får en streckad markeringsring och, om de inte är pinnade, en gul **velocity-pil** (skala `0.5`).
- **Drag på kropp** → flyttar den (oavsett pinned/inte).
- **Drag på pil-tipp** (träffradie 14 px) → ändrar hastighetsvektorn.
- **Tap på tom yta** → avmarkerar och börjar pan.
- När man lämnar läget (byter mode eller trycker `✓ Klar`) återupptas simuleringen.

---

## 5. Inställningar i panelen (`⚙`)

Panelen är bara öppningsbar i redigeringsläget. Den har två sektioner.

### 5.1 Värld-sektionen — globala simulator-parametrar

Renderas av `bootPlay` i `src/play/boot.js:13-29`:

| Inställning | Range / val | Beskrivning |
|---|---|---|
| **Acceleration** | `0 – 3000`, steg `50` | Multiplicerar attraktionskraften. `0` = ingen kraft. |
| **Max hastighet** | `0 – 3000`, steg `50` | Hastighetstak (clamp) per kropp. `0` = inget tak. |
| **Attraktionsläge** | `nearest` / `all` / `weighted` / `normalized` / `normalized2` | Hur en kropp summerar krafter från attraktorer. Se `simulator.js:40-89`. |

Värld-storleken (`width`/`height`) är **inte** redigerbar i UI; den sätts vid `defaultDraft()` (4000×4000) eller från det laddade datat.

Ändringar i den här sektionen tillämpas direkt på samma `settings`-objekt som simulatorn läser i varje tick — alltså omedelbar effekt.

### 5.2 Objekt-sektionen — egenskaper för markerad kropp

Renderas av `lab.js:294-391`. Visas tomt (`Inget markerat`) tills något markeras. Tillgängliga fält beror på kroppstyp:

**Alltid:**

| Inställning | Range / typ | Anteckning |
|---|---|---|
| **Namn** | text | |
| **Färg** | color picker | Synkas till `trail.color` om trail finns. |
| **Radie** | `2 – 60`, steg `1` | Visuell storlek + påverkar attraktorvikt (`sizeFactor` i `pull`). |
| **Attraherar** | checkbox | Bakas i `attraction` som 0/1. Påverkar både kraft och om kroppen räknas som attractor. |
| **Repel-radie** | `0 – 500`, steg `10` | Inom denna radie blir attraktionen *negativ* (kvadratiskt skalad). |
| **Stil-preset** | `Klassisk` / `Glow` / `Neon` / `Eldkula` | Sätter glow + tail-parametrar i klump. |
| **Glow** | `0 – 1`, steg `0.05` | |
| **Ta bort** | knapp | Tar bort kroppen och avmarkerar. |

**Endast om kroppen har trail (kometer):**

| Inställning | Range / typ |
|---|---|
| **Svansstil** | `line` / `particles` |
| **Trail-längd** | `0 – 5000`, steg `50` |
| **Svans avsmalning** | `0 – 1`, steg `0.05` |
| **Svans fade** | `0 – 1`, steg `0.05` |
| **Fart-reaktion** | `0 – 1`, steg `0.05` |

Alla fält uppdateras live på objektet (samma referens som simulator/renderer använder).

---

## 6. Spara — vad serialiseras?

`src/world/serialize.js`. Vid `Spara`/`Uppdatera` skickas:

- `schema_version` (för närvarande `1`)
- `world.width`, `world.height`
- `settings.acceleration`, `settings.maxSpeed`, `settings.attractionMode`
- En `bodies`-array med fälten i `BODY_FIELDS` + en serialiserad `trail` (utan punkthistorik).

Trail-punkter och pekartillstånd serialiseras inte — de byggs upp på nytt vid `deserialize`.

För `draft` (`/w/draft`): vid första sparet promptas titel, ett nytt level skapas via API, sessionStorage rensas och routern går till `/w/<nytt-id>`. För befintliga världar uppdateras posten in-place via `updateLevel`.

Att vara inloggad krävs — annars erbjuds redirect till login-URL.

---

## 7. Snabb sammanfattning av "är världen pausad?"

| Kontext | Sim-tick | Anledning |
|---|---|---|
| Visningsläge, valfri hastighet > 0 | ✅ rör på sig | `lab.isEditing() = false` |
| Visningsläge, hastighet = 0 | ⛔ stilla | `dt * 0` |
| Redigering: `select` / `addStar` / `addComet` | ✅ rör på sig | `mode !== 'edit'` |
| Redigering: `edit` (Verktyg) | ⛔ pausad | `lab.isEditing() = true` |
| Laddar / fel | ⛔ stilla | Ingen sim startad än |

Med andra ord: det enda explicita "pausläget" i UI:t är **Verktyg** under redigering. Hastighetsreglaget kan dessutom användas som mjuk paus (`0x`) i alla lägen.
