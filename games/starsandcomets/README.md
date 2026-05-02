# Stars & Comets

En avslappningssimulator för gravitationsvärldar. Inte en fysiksimulerare — en estetisk maskin för att skapa vackra, lugna banor.

## Köra lokalt

```sh
npm install
npm run dev
```

Backend (Django, separat repo) körs på `data.sxa.se`. Krävs för login/spara, men spelet fungerar i draft-läge utan.

## Koncept

Världen består av kroppar (`Body`). Varje kropp har en uppsättning fält (`pinned`, `attraction`, `radius`, `vel`, …) som styr beteendet:

| Typ | `pinned` | `attraction` | Trail |
|-----|----------|--------------|-------|
| Star | `true` | `1` | nej |
| Comet | `false` | `0` | ja |

Distinktionen är inte fast — sätt `attraction: 1` på en komet och den drar i andra rörliga kroppar.

## Arkitektur

```
World      — geometri och topologi (idag toroidal: src/world/toroidal.js)
Simulator  — räknar krafter och uppdaterar positioner (src/simulator.js)
Renderer   — ritar bodies + trails på canvas (src/renderer.js)
Lab        — pointer-input → urval, drag, handles, overlay (src/lab.js)
```

`World` är utbytbart. Simulatorn anropar bara `world.distance/direction/step` och bryr sig inte om topologin.

`Lab` ansvarar för all canvas-interaktion (pan, pinch-zoom, klick på kropp, drag av handles). Den exponerar `isPaused()` så `boot.js` vet när sim-loopen ska pausas (under drag av kropp eller handle).

## Fysik

Pull-kraften per (body, attractor)-par:

- **Sizefactor:** `attractor.radius / maxAttractorRadius` — större attraktor drar starkare. Radius är alltså mass-proxy.
- **Repel:** när `dist < radius * 1.5` byter kraften tecken med `(repelRadius/dist)²`. Singularitetsskydd. Inte exponerat i UI.
- **Perpendicular kick:** vid head-on-approach inom repel-zonen läggs en sidledes kraft till. Magnitud `0.5 * |accel| * |cos(vel, dir)|`. Riktning från `body.id & 1`. Bryter symmetri utan att tappa replay-determinism.
- **Reaction (Newton 3):** när en *rörlig* attraktor drar i en kropp som inte själv attraherar, får attraktorn en motsvarande motkraft viktad med `body.radius / attractor.radius`. Pinned attraktorer (stjärnor) ignorerar reaktion = oändlig massa.

`settings.attractionMode` styr hur en kropp viktar flera attractorer (`nearest`, `weighted`, `normalized`, `normalized2`, `all`). Default är `nearest`. Inte exponerat i UI just nu.

## Spara / ladda

`src/world/serialize.js`. Sparar `world.{width,height}`, `settings.{acceleration,maxSpeed,attractionMode}` och en `bodies`-array. Trail-punkter serialiseras inte (byggs upp på nytt). `body.id` persisterar — viktigt för att perpendicular-kickens tecken är deterministiskt över save/load.

`schema_version` bumpas vid breaking changes; deserializer felar på okända versioner.

## Routes

| Path | Komponent | Roll |
|---|---|---|
| `/` | `Browse.svelte` | landing — listar mina senaste världar |
| `/new` | `New.svelte` | mallväljare |
| `/me` | `Me.svelte` | alla mina världar |
| `/w/:id` | `Play.svelte` | själva spelet (`:id = draft` för osparad) |

## Pågående arbete

Aktuella beslut + prioritering: [`reviews/20260502/REVIEW.md`](./reviews/20260502/REVIEW.md).
