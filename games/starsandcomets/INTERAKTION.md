# Interaktion och tillstånd i Stars & Comets

Det här dokumentet beskriver hur man interagerar med en värld i `/w/:id`-vyn — vilka tillstånd som finns, vilka inställningar som är tillgängliga var, och när simulatorn pausar.

Källfiler: `src/routes/Play.svelte`, `src/play/boot.js`, `src/play/Toolbox.svelte`, `src/play/BottomSheet.svelte`, `src/lab.js`, `src/simulator.js`.

---

## 1. Filosofi

Spelet är **modlöst**. Det finns inget separat "redigeringsläge" att gå in och ut ur — du är alltid fri att markera, dra, skapa och justera. Simulatorn fortsätter rulla i bakgrunden hela tiden; den pausar bara när något skulle "fly" från ditt finger.

Den enda tillstånds-toggle som finns är **🔒 Lås** — som gömmer redigeringsverktygen för en ren visning (t.ex. när du ger telefonen till någon).

---

## 2. HUD-element som alltid syns

| Element | Position | Funktion |
|---|---|---|
| `←` Tillbaka | uppe vänster | tillbaka till `/` |
| `🔒` / `🔓` Lås | uppe vänster (efter ←) | växla mellan låst (visningsläge) och olåst (redigerbart) |
| `Spara` / `Uppdatera` | uppe höger | spara världen (kräver inloggning) |
| Hastighetsreglage | nedtill, centrerat | tidsskala `0x – 2x`, steg `0.05` |

Hastighetsreglaget multiplicerar `dt` i sim-loopen. `0x` = mjuk paus, `1x` = normal, `2x` = dubbelt så fort. Funkar oavsett om något dras eller om låset är på.

---

## 3. Två tillstånd: olåst (default) och låst

| Tillstånd | `locked` | Toolbox synlig? | BottomSheet tillgänglig? | Markering / handles möjliga? |
|---|---|---|---|---|
| **Olåst** (default) | `false` | ✅ | ✅ | ✅ |
| **Låst** | `true` | ⛔ | ⛔ | ⛔ (bara pan/zoom) |

I låst läge fungerar bara pan (drag) och zoom (pinch / mushjul). Bra för att visa en värld utan att råka pilla på något.

---

## 4. Olåst läge — tre interaktionssätt

### 4.1 Toolbox (vänster sida) — skapa kroppar

En tunn vertikal ikonrad med två symboler:

- **✦ Stjärna** — `pinned`, `attraction: 1`, `radius: 14`, `repelRadius: 10`, ingen trail.
- **☄ Komet** — `pinned: false`, `attraction: 0`, `radius: 6`, har trail.

**Att placera ut**:

1. Tryck och håll på ikonen.
2. Drag ut över canvas — en spöke-symbol följer fingret.
3. Släpp över canvas → kroppen skapas på den punkten och blir markerad.
4. Släpp utanför canvas (eller på ikonraden) → avbryt, ingenting händer.

Inga lägen att växla mellan. Du kan placera en stjärna, sedan en till, sedan en komet, helt utan att klicka på något annat.

### 4.2 Markering + inline handles — finjustera kroppar

**Tap på en kropp** → markerar den. Ringen runt den blir streckad-vit. BottomSheet snäpper automatiskt till `peek` (handtaget syns).

**Tap på tom yta** → avmarkerar. Sheet stänger inte automatiskt.

När en kropp är markerad ritas upp till tre **handles** på skärmen — runda prickar med ikon:

| Handle | Position | Kant-villkor | Drag-effekt |
|---|---|---|---|
| **Radius** `↔` (vit) | öster om kroppen | alltid synlig | `radius = avstånd från centrum` (clamp 2–60) |
| **Repel** `⇲` (rosa) | söder om kroppen | bara om `attraction != 0` | `repelRadius = avstånd från centrum` (clamp 0–500) |
| **Velocity** `→` (blå) | vid pilens spets | bara om `!pinned` | `vel = (handle - pos) / 0.5` |

Handles ligger alltid minst **36 px** från objektets centrum på *skärmen*, oavsett zoom — så att de aldrig krockar med små kometer. Hit-radien är **22 px**, generös för tumme.

**Drag på själva kroppen** → flyttar den. För kometer nollställs hastigheten under draget (annars rycker det iväg när du släpper).

### 4.3 BottomSheet — namnge, stila, världs-inställningar

Halvtransparent panel nedtill med tre snap-punkter:

| Snap | Höjd | Vad du ser |
|---|---|---|
| `closed` | 0 | inget — sheet är osynlig |
| `peek` | ~80 px | bara handtaget + objektets namn (eller "Värld" om inget markerat) |
| `full` | 65 % av viewport | all sektioner synliga |

**Hur du växlar snap**:
- **Drag handtaget** uppåt/nedåt — snäpper till närmaste punkt vid release.
- **Tap på handtaget** — cyklar `closed → full → peek → closed`.
- Markering av en kropp → automatisk `peek` (om sheet var stängd).
- Lås-knappen → `closed`.

**Innehåll**:

#### Objekt-sektion (visas när något är markerat)

| Inställning | Range / typ | Anteckning |
|---|---|---|
| Namn | text | |
| Färg | color picker | Synkas till `trail.color` om trail finns |
| Radie | `2 – 60` | Visuellt + attraktorvikt. *(Också tillgänglig som handle)* |
| Attraherar | checkbox | 0 eller 1 |
| Repel-radie | `0 – 500` | *(Också tillgänglig som handle, om attractor)* |
| Svansstil | `line` / `particles` | bara om trail |
| Trail-längd | `0 – 5000` | bara om trail |
| Stil-preset | `Klassisk` / `Glow` / `Neon` / `Eldkula` | sätter glow + tail-fält i klump |
| Glow | `0 – 1` | |
| Svans avsmalning | `0 – 1` | bara om trail |
| Svans fade | `0 – 1` | bara om trail |
| Fart-reaktion | `0 – 1` | bara om trail |
| **Ta bort** | knapp | tar bort kroppen |

#### Värld-sektion (alltid synlig i `full`)

| Inställning | Range / val |
|---|---|
| Acceleration | `0 – 3000`, steg `50` |
| Max hastighet | `0 – 3000`, steg `50` |
| Attraktionsläge | `nearest` / `all` / `weighted` / `normalized` / `normalized2` |

Alla värden tillämpas direkt på samma `settings`-objekt som simulatorn läser varje tick — omedelbar effekt, ingen "tillämpa"-knapp.

### 4.4 Pan & zoom (alltid)

- **Drag på tom canvas** → pan.
- **Pinch** (två fingrar) → zoom, `0.1x – 4x`.
- **Mushjul** → zoom (desktop).

Pan/zoom körs både i låst och olåst läge.

---

## 5. När pausar simulatorn?

Simulatorn anropar `lab.isPaused()` varje frame innan `tick()`. Den returnerar `true` när:

- En **handle** dras (`handle-radius`, `handle-repel`, `velocity`).
- En **kropp** dras med move-gesten.

Dvs. så fort du *släpper* fingret återupptas simuleringen automatiskt — du behöver inte trycka "play".

| Situation | Sim-tick? |
|---|---|
| Inget händer (olåst) | ✅ kör |
| Tap (utan drag) | ✅ kör |
| Drag på handle / kropp | ⛔ pausad |
| Drag på tom yta (pan) | ✅ kör |
| Pinch (zoom) | ✅ kör |
| Hastighet `0x` | ⛔ effektiv paus (`dt = 0`) |
| Sheet öppen, sliders dras | ✅ kör (sliders pausar inte sim) |
| Låst läge | ✅ kör |
| Toolbox-drag pågår | ✅ kör |

Det är ett medvetet val att slidedrag i sheet:en *inte* pausar — du ska kunna se effekten av t.ex. acceleration på en kropp som rör sig.

---

## 6. Spara — vad serialiseras?

`src/world/serialize.js`. Vid Spara/Uppdatera skickas:

- `schema_version` (för närvarande `1`)
- `world.width`, `world.height`
- `settings.acceleration`, `settings.maxSpeed`, `settings.attractionMode`
- En `bodies`-array med alla persistenta fält + serialiserad `trail` (utan punkthistorik).

Trail-punkter och pekartillstånd serialiseras inte — de byggs upp på nytt vid `deserialize`.

För `draft` (`/w/draft`): vid första sparet promptas titel, ett nytt level skapas via API, sessionStorage rensas och routern går till `/w/<nytt-id>`. För befintliga världar uppdateras posten in-place via `updateLevel`. Inloggning krävs.

---

## 7. Snabb-referens — var ändrar man vad?

| Vill ändra… | Var? |
|---|---|
| Storlek på en kropp | `↔`-handle eller Radie-slidern i sheet |
| Repel-radien | `⇲`-handle eller Repel-slidern i sheet |
| Hastighet på komet | `→`-handle eller drag på pilens spets |
| Position | dra själva kroppen |
| Namn / färg | sheet, objekt-sektion |
| Stil (glow / svans) | sheet, objekt-sektion (eller preset-dropdown) |
| Attraktion på/av | sheet, "Attraherar"-checkboxen |
| Acceleration / max hastighet / attraktionsläge | sheet, värld-sektionen (`full` snap) |
| Tidsskala (snabb-/slow-motion) | hastighetsreglaget nedtill |
| Lägga till stjärna/komet | drag från ikon i Toolbox |
| Ta bort kropp | sheet → "Ta bort"-knappen |
| Gömma all UI | 🔒-knappen |
