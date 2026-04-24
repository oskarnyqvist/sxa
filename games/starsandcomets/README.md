# Stars & Comets

En avslappningssimulator för gravitationsvärldar. Inte en fysiksimulerare — en estetisk maskin för att skapa vackra, lugna banor.

## Koncept

Världen består av tre typer av saker, alla representerade som en `Body`:

| Typ | Rör sig | Påverkas | Påverkar |
|-----|---------|----------|----------|
| Star | Nej | Nej | Ja |
| Comet | Ja | Ja | Nej |

Rörelselogiken är styrlogik, inte fysik. Parametrarna är designknappar.

## Arkitektur

```
World      — geometri och topologi (toroidal, sfär)
Simulator  — räknar krafter och uppdaterar positioner
Renderer   — ritar på canvas, vet ingenting om logik
Lab        — UI för admin-läget
```

`World` är utbytbart. Simulatorn anropar `world.distance/direction/step` och bryr sig inte om topologin.

## Lägen

**Admin Lab** (nu) — rå, teknisk, alla params exponerade. Används för att utforska och hitta vad som känns bra.

**User Lab** (senare) — zen-känsla, slangbella för att skjuta comets, vänliga namn på parametrar.

**View** (senare) — delbar länk, ingen UI, bara världen.

## Köra lokalt

```
npm install
npm run dev
```
