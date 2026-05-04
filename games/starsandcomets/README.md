# Stars & Comets

En avslappningssimulator för gravitationsvärldar. Inte en fysiksimulerare — en estetisk maskin för att skapa vackra, lugna banor.

## Köra lokalt

```sh
npm install
npm run dev
```

Backend (Django, separat repo) körs på `data.sxa.se`. Krävs för login/spara, men spelet fungerar i draft-läge utan.

## Bygg & deploy

```sh
npm run build                          # bygger till dist/
../../tools/deploy-starsandcomets       # bygger + rsyncar till starsandcomets.sxa.se
```

Deploy-scriptet kräver `SOPS_AGE_KEY_FILE` (default: `<repo>/secrets/age-key.txt`) och SSH-tillgång till Hetzner-servern.

## Mappstruktur

```
src/
  routes/             ← en .svelte per route (Browse, New, Me, Play)
  play/               ← allt som hör till /w/:id (canvas + panel + sektioner)
    PlayCanvas.svelte ← canvas + bootPlay
    EditPanel.svelte  ← panel under canvas i edit-läge
    BodyList.svelte   ← grid av BodyCards
    BodyCard.svelte   ← en kropp = ett kort
    SpawnSection.svelte
    WorldSection.svelte
    boot.js           ← wirar world/sim/renderer/lab + RAF-loop
    presets.js        ← defaultDraft + ambientWorld (slumpvariation)
    names.js          ← slumpnamn för stjärnor/kometer
    colors.js         ← randomBodyColor (HSL → hex)
  world/              ← geometri (toroidal) + serialize
  stores/
    selection.js      ← always-notify stores: selected, lifted, bodies
  simulator.js        ← physics tick (pure JS)
  renderer.js         ← canvas draw + camera (pure JS)
  lab.js              ← canvas pointer-input, urval, drag, overlay (pure JS)
  bodies.js           ← createStar / createComet
  api.js              ← fetch-wrappers mot data.sxa.se
  App.svelte          ← router + bottennav + ambient bg
  BackgroundCanvas.svelte ← rullar ambientWorld bakom meta-vyer
```

## Koncept

Världen består av kroppar (`Body`). Varje kropp har en uppsättning fält (`pinned`, `attraction`, `radius`, `vel`, …) som styr beteendet:

| Typ | `pinned` | `attraction` | Trail |
|-----|----------|--------------|-------|
| Star | `true` | `1` | nej |
| Comet | `false` | `0` | ja |

Distinktionen är inte fast — sätt `attraction: 1` på en komet och den drar i andra rörliga kroppar. Sätt `body.lifted = true` och simulator hoppar över den helt.

## Arkitektur

```
World      — geometri och topologi (idag toroidal: src/world/toroidal.js)
Simulator  — räknar krafter och uppdaterar positioner (src/simulator.js)
Renderer   — ritar bodies + trails på canvas (src/renderer.js)
Lab        — pointer-input → urval, drag, handles, overlay (src/lab.js)
```

`World` är utbytbart. Simulatorn anropar bara `world.distance/direction/step` och bryr sig inte om topologin.

`Lab` exponerar `isPaused()` så `boot.js` vet när sim-loopen ska pausas (under drag av kropp eller handle), `recenter()` för fit-to-view, och spawn/remove-helpers.

## Fysik

Pull-kraften per (body, attractor)-par:

- **Sizefactor:** `attractor.radius / maxAttractorRadius` — större attraktor drar starkare. Radius är alltså mass-proxy.
- **Repel:** när `dist < radius * 1.5` byter kraften tecken med `(repelRadius/dist)²`. Singularitetsskydd. Inte exponerat i UI.
- **Perpendicular kick:** vid head-on-approach inom repel-zonen läggs en sidledes kraft till. Magnitud `0.5 * |accel| * |cos(vel, dir)|`. Riktning från `body.id & 1`. Bryter symmetri utan att tappa replay-determinism.
- **Asymmetrisk reaktion:** kroppar som inte själva attraherar (kometer med `attraction = 0`) påverkar inte sina attraktorer alls. En attraktor känner bara krafter från *andra* attraktorer (vilket sker naturligt när vi itererar den andra kroppens pulls). Konsekvens: en lös flytande stjärna ligger stilla även med kometer runt sig.

`settings.attractionMode` styr hur en kropp viktar flera attractorer (`nearest`, `weighted`, `normalized`, `normalized2`, `all`). Default är `nearest`. Inte exponerat i UI just nu.

## Routes & lägen

| Path | Komponent | Roll |
|---|---|---|
| `/` | `Browse.svelte` | landing — listar mina senaste världar |
| `/new` | `New.svelte` | mallväljare |
| `/me` | `Me.svelte` | alla mina världar |
| `/w/:id` | `Play.svelte` | själva spelet (`:id = draft` för osparad) |

Play-vyn har två lägen i samma route:

- **View** — fullscreen canvas, ingen UI förutom HUD (back, mode-toggle, save, fit-to-view, speed). För att titta på världen.
- **Edit** — sticky canvas (50dvh) + scrollande HTML-panel under (Spawn, Värld, Kroppar). Markerad kropp lyfts ur simens fysik (`body.lifted = true`) så man kan editera utan att den flyger iväg. Resten av världen rullar vidare.

Toggle via "Visa"/"Redigera"-knappen i HUD.

## Konventioner

- **Pure JS för logik** — `simulator.js`, `renderer.js`, `lab.js`, `world/*` är vanliga moduler utan Svelte. Lättare att förstå isolerat och testbart om vi nånsin lägger tester.
- **Svelte för layout/binding** — komponenter äger DOM och state-bindings. Ingen affärslogik här.
- **Always-notifying stores** (`stores/selection.js`) — Svelte's standard `writable` skippar `set()` när nya värdet är `===` det gamla. Bodies muteras i samma referens (handle-drag, slider-input) så subscribers behöver poke även med samma referens. Använd `selected.set(selected)` som "force refresh".
- **Lab som JS-modul** — `createLab()` returnerar ett objekt med metoder. Den skriver direkt till stores; komponenter läser via `$selected` etc. Inga callbacks uppåt.
- **`body.id` är persistent** — sparas i serialize. Viktig för perpendicular-kickens deterministiska tecken över save/load.
- **`schema_version`** bumpas vid breaking changes; deserializer felar på okända versioner.

## Lägga till en ny edit-sektion (recept)

Säg att du vill ha en "Effekter"-sektion i edit-panelen:

1. Skapa `src/play/EffectsSection.svelte` — egen `<section>`, exporterar de props den behöver.
2. Importera och mounta i `EditPanel.svelte` på rätt plats i layout.
3. Om sektionen behöver muta sim-settings → ta `bind:settings` som prop.
4. Om sektionen behöver markerad kropp → `import { selected } from '../stores/selection.js'` och använd `$selected`.
5. Om sektionen ska reagera när sim:en muteras (drag, tick) → mirror state via `setInterval` (se `BodyCard` stats).

Spawn / remove / select går alltid via `lab.spawnAtCenter()`, `lab.removeBody()`, `selectedStore.set()` — aldrig direkt mot `sim.bodies`.

## Spara / ladda

`src/world/serialize.js`. Sparar `world.{width,height}`, `settings.{acceleration,maxSpeed,attractionMode}` och en `bodies`-array. Trail-punkter och `body.stats` serialiseras inte (byggs upp på nytt). `body.lifted` strippas vid load.

## Dev helpers

I dev-bygget (`npm run dev`) exponerar `PlayCanvas` referenser på `window.__play`:

```js
__play.sim.bodies     // alla kroppar
__play.sim.bodies[2].lifted = true   // frys en kropp
__play.lab.recenter()
__play.world          // världs-geometri
```

Inte tillgängligt i produktion (gating via `import.meta.env.DEV`).

## Pågående arbete & idéer

- [`reviews/`](./reviews/) — granskningar och beslutsdokument per datum.
- [`IDEAS.md`](./IDEAS.md) — lös samling att plocka från.
