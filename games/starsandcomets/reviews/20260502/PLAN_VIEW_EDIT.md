---
parent: REVIEW.md
status: draft — for discussion
---

# Plan: View/Edit-lägen + layer-modell

Refactor av Play-vyn från modless HUD till två tydliga lägen och en sticky-canvas + scrollande HTML-panel. Skrivet som diskussionsunderlag — koden ska vara hanterbar och iterabel ett halvår framåt, inte bara funka idag.

---

## 1. Mål

- **Två lägen**: View (ren canvas, fullscreen) och Edit (sticky canvas + scrollande HTML-panel under).
- **Layer-modell**: kropp som editeras lyfts ur simens fysik. Frystes pos/vel, andra bodies fortsätter, släpp = återgå.
- **Stats per body** (#1, redan i sim) görs synliga i edit-panelen.
- **Bevara all fysik och spara/ladda** — denna refactor rör inte simulator/world/serialize utöver `body.lifted`-flagga.
- **Mobile portrait först.** Desktop polish senare.

## 2. Icke-mål

- Separat URL för edit (`/w/:id/edit`) — väntar.
- Spawn-from-icon drag (Toolbox) — ersätts av tap-and-place från panelen.
- attractionMode i UI — fortfarande dolt, defaultar till `'nearest'`.
- Sparkline-grafer per body — kanske senare, nu räcker siffror.
- Desktop-layout — sidopanel istället för sticky-top kommer senare.
- Undo/redo — separat, bygger på en commandbus vi inte har.

## 3. State-arkitektur

Idag äger `Play.svelte` allt: canvas-ref, selected, sheetSnap, locked, lab/sim/world/settings, save state, level meta. Det blir svårnavigerat. Förslag:

| State | Ägare | Notering |
|---|---|---|
| `mode: 'view' \| 'edit'` | `Play.svelte` | Toggle-knapp i HUD |
| `selected: Body \| null` | store `stores/selection.js` | Skrivs av lab.js, läses av panelkomponenter |
| `lifted: Body \| null` | samma store | Skrivs av Play vid mode-switch + av BodyCard "lift"-toggle |
| `bodies, settings, world` | `simulator` / `world` (oförändrat) | Exponerade via boot |
| `camera` | `renderer` (oförändrat) | |
| `timeScale` | `boot.js` | |
| `levelMeta, saveState` | `Play.svelte` | |

**Varför stores för `selected`/`lifted`:** lab.js är vanlig JS, inte Svelte. Idag löser vi prop-flödet med en `onSelect`-callback uppåt. Med tre konsumenter (lab, edit-panel, body-list-cards) blir prop-drilling/callbacks ohanterligt. Stores ger en kanal — lab `selected.set(b)`, komponenter `$selected`. Liten, ärlig.

## 4. Layer-modell

`body.lifted = true` är flaggan. Simulator-effekt:

```js
// i tick()
const attractors = bodies.filter(b => b.attraction !== 0 && !b.lifted);
const movable    = bodies.filter(b => !b.pinned && !b.lifted);
```

Lifted body:
- Inte i attractor-listan → drar inte i något
- Inte i movable-listan → påverkas inte av krafter, position uppdateras inte
- Är fortfarande i `bodies[]` → renderas, kan editeras, kan sparas
- `body.lifted` serialiseras *inte* (strippas i serialize)

Visuellt (lab overlay):
- Selected (i view): streckad ring (idag)
- Lifted: fylld halo + handles + etikett som svävar

Lifecycle-regler:
- Enter edit mode utan vald: ingen lift
- Enter edit mode med vald: `lifted = selected`
- I edit mode, byta selected: `lifted` följer (drop tidigare, lift ny)
- Exit edit mode: `lifted = null` (alla bodies aktiva)
- Spawn ny body i edit mode: skapas redan lifted

## 5. Komponent-tree

Bryt isär dagens `Play.svelte`:

```
Play.svelte                     — load, save, level meta, mode-state, layout
├── PlayCanvas.svelte           — ny: canvas-element + boot-wiring + cleanup
├── HudTop.svelte               — back, mode toggle, save
├── HudSpeed.svelte             — timescale slider (bottom)
└── EditPanel.svelte            — bara i edit mode
    ├── WorldSection.svelte     — acceleration, maxSpeed
    ├── SpawnSection.svelte     — + stjärna, + komet
    └── BodyList.svelte
        └── BodyCard.svelte     — namn, färg, storlek, attraherar, stats, ta bort, lift-toggle
```

Riktlinjer:
- Varje komponent har *en* ansvarspunkt. Storleken talar — om en svelte-fil har > ~150 rader, dela.
- Ingen prop-drilling djupare än två nivåer. För djupare → store.
- `lab.js`, `simulator.js`, `renderer.js`, `world/*` rörs så lite som möjligt.

## 6. Layout

```
┌──────────────────────┐
│       HudTop         │  fixed
├──────────────────────┤
│                      │
│      Canvas          │  view: 100dvh
│                      │  edit: 50dvh sticky
│                      │
├──────────────────────┤
│   HudSpeed (canvas)  │  view: above canvas
├──────────────────────┤
│                      │
│    EditPanel         │  edit: scrolls, fills rest
│    (scrollar)        │
│                      │
└──────────────────────┘
```

I view mode tar canvas hela viewport. I edit mode delas viewport: ~50dvh canvas (sticky top), resten scroll-panel. Speed slider hör hemma över canvas i view, över panel i edit.

`touch-action: none` på canvas (idag), `touch-action: pan-y` på panel — pinch-zoom på canvas vs scroll på panel disambiguerar.

## 7. Lifecycle-scenarion

### A. Tap på kropp (view)
Lab hits → `selected.set(body)`. Streckad ring visas. Inget annat ändras. Sim rullar oavbrutet.

### B. Tap på kropp (edit)
Lab hits → `selected.set(body)`. Play.svelte reagerar på `$selected`-ändring i edit mode → `lifted.set(body)` (släpper tidigare). Body fryses, halo + handles ritas. BodyList scrollar in det nya kortet.

### C. Toggle view → edit
Mode flippar. Layout shiftas (canvas → 50dvh). Camera bevaras. Om `selected` finns: `lifted = selected`.

### D. Toggle edit → view
Mode flippar. `lifted = null` (kroppen återgår till simen med nuvarande pos+vel). `selected` behålls (visas som streckad ring i view).

### E. Spawn ny kropp (edit)
SpawnSection-knapp → kropp skapas i mitten av synlig canvas (`renderer.screenToWorld(canvas.width/2, canvas.height/2)`), `body.lifted = true`, `selected.set(newBody)`, BodyList scrollar dit. Användaren panorerar/justerar fält. När de "släpper" (toggle på BodyCard, eller tap någon annanstans) blir den live.

### F. Editera fält i BodyCard
Två-vägs binding direkt på `body.radius` etc. Sim ser mutationer omedelbart (samma objekt). Ingen extra synk.

### G. Save
Mode-agnostiskt. `serialize({world, settings, bodies})` — `lifted`-flaggan strippas. Save-knappen visas i båda lägen.

### H. Exit (back)
`teardown` stoppar RAF + listeners. Stores rensas (`selected.set(null)`, `lifted.set(null)`).

## 8. Migration — incrementella steg

Varje steg en commit, varje commit lämnar appen funktionell. Kan testas i webbläsare innan nästa.

| # | Steg | Risk | Notering |
|---|---|---|---|
| 1 | Extrahera `PlayCanvas.svelte` (canvas + boot-wiring) ur `Play.svelte` | låg | Pure refactor, samma UI |
| 2 | Skapa `stores/selection.js`, byt `onSelect`-callback mot store | låg | Pure refactor |
| 3 | Lägg `body.lifted` i sim, hoppa över i tick. Strip i serialize. Ingen UI än | låg | Förberedelse |
| 4 | `mode: 'view' \| 'edit'` state + toggle-knapp i HudTop. Edit visar dagens BottomSheet, view döljer den. (Lock-knappen tas bort — mode ersätter den) | medel | UX-skifte men reversibelt |
| 5 | Riv `BottomSheet.svelte`, bygg tom `EditPanel.svelte` med sticky canvas-layout | medel | Tom panel — bara layout |
| 6 | `WorldSection.svelte` + `SpawnSection.svelte` (ersätter Toolbox) | låg | |
| 7 | `BodyList.svelte` + `BodyCard.svelte` med fält | medel | Mest kod, men varje card är liten |
| 8 | Hook lift/drop: `$selected` i edit mode → `lifted` synk; toggle på BodyCard | medel | Kärnan av layer-modellen |
| 9 | Sync canvas-tap ↔ card-highlight (scroll-into-view, focus-ring) | låg | Polish |
| 10 | Stats-fält i BodyCard (max speed, age, closest, total) | låg | Använder #1-data |

Ungefärlig insats: 1–4 = en kväll. 5–8 = två kvällar. 9–10 = en kväll. Total ~en helg.

## 9. Filer som påverkas

**Nya:**
- `src/stores/selection.js`
- `src/play/PlayCanvas.svelte`
- `src/play/EditPanel.svelte`
- `src/play/WorldSection.svelte`
- `src/play/SpawnSection.svelte`
- `src/play/BodyList.svelte`
- `src/play/BodyCard.svelte`
- `src/play/HudTop.svelte`
- `src/play/HudSpeed.svelte`

**Ändras:**
- `src/routes/Play.svelte` — slimmas till ~50 rader: load, save, mode-state, layout
- `src/lab.js` — `selected` läses/skrivs via store; lägg till hit-test exponerad API; hantera lifted i overlay
- `src/simulator.js` — filter `!b.lifted` i tick
- `src/world/serialize.js` — strip `lifted` i `serializeBody`
- `src/play/boot.js` — exponera `renderer` (för centerScreenToWorld i SpawnSection)

**Tas bort:**
- `src/play/BottomSheet.svelte`
- `src/play/Toolbox.svelte`

## 10. Maintainability-principer

Tidlösa regler för denna kod, inte bara denna PR:

1. **En komponent = ett ansvar.** Om du läser filnamn och måste tänka för att gissa vad den gör, dela.
2. **State så nära användning som möjligt.** Lyft till parent eller store först när tre+ ställen behöver det.
3. **Undvik effekter i `$:`-blocks utöver enkel reaktion.** Ingen async, ingen event-listener-hookning.
4. **Ren JS för logik (lab, simulator, renderer).** Svelte för layout/binding. Inte rota.
5. **Inga `if (mode === 'edit') { ... } else { ... }`-spaghetti.** Använd `{#if mode === 'edit'}` för konditionell rendering, eller separata komponenter per läge.
6. **Inga magiska tal i markup/style.** `50dvh` får vara en CSS-var (`--canvas-edit-height`).
7. **Två-vägs binding på data-objekt är OK** (`bind:value={body.radius}`). Mutation är vägen — vi har inget immutable state-tree.
8. **Tester:** vi har inga idag. Lägg inte till för denna refactor. Manuell testning i webbläsare per migration-steg räcker.

## 11. Risker

- **iOS Safari touch-action quirks** med sticky element + canvas. Måste testas på riktig enhet i steg 5.
- **Canvas resize** när panelen växer/krymper. Renderer's `resize()` läser `clientWidth/Height` varje draw — bör fungera, men flickering möjligt.
- **`lifted` attractor**: om man lifter en stjärna slutar den dra i kometer → de kan flyga iväg. Det är beteendet vi vill ha (som om stjärnan inte fanns medan du editerar). OK men dokumentera.
- **Spawn placering**: nya kropp i mitten av canvas. Om användaren panorerat långt bort blir den i synfältet, inte vid världens (3000,3000). Bra default.

## 12. Öppna frågor

- **Camera vid mode-toggle**: bevaras (förslag) eller fit-to-view? Jämför med YouTube fullscreen som bevarar pause-state — bevarad känsla är generellt bättre.
- **Edit-panelens default-höjd**: 45dvh / 50dvh / 55dvh — bestäms i steg 5 efter att ha testat på telefon.
- **HudSpeed i edit mode**: ovanpå canvas (samma som view) eller överst i panelen? Lutar åt ovanpå — konsekvent.
- **"Pausad/Aktiv"-toggle på BodyCard**: behövs det utöver att tap = lift? Ja — användaren kan vilja titta på en kropps stats utan att lyfta den. Toggle ger explicit kontroll.
- **Tom EditPanel utan selected**: visa World-sektion + spawn-sektion + tom body-lista? Eller en "tap något"-prompt? Förslag: visa World + Spawn alltid, BodyList alltid (tom = empty state).
