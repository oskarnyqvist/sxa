# Gravity Sim — Designdokument

## Vision

En avslappningssimulator för gravitationsvärldar. Inte en fysiksimulerare — en estetisk maskin för att skapa vackra, lugna banor. Parametrarna är designknappar, inte naturlagar.

Två lägen:
- **View** — ta emot en länk, njut. Ingen UI.
- **Lab** — bygg, tweaka, dela.

---

## Byggordning

### Fas 1 — Admin Lab
Rå och teknisk. Alla params exponerade, toolbar med lägen, debug-overlay. Syftet är att utforska fysiken och hitta vad som känns bra. Ingen polish.

### Fas 2 — User Lab
Byggs ovanpå samma simulator. Stars och Comets, slangbella, namn, vänliga sliders, zen-känsla. Simulator och World är redan separerade från UI — ingen omskrivning behövs.

---

## Arkitektur: tre lager

### World
Definierar geometrin. Utbytbart gränssnitt — simulatorn bryr sig inte om vilken World den kör på.

```js
world.distance(a, b)       // skalär
world.direction(from, to)  // enhetsvektor
world.step(pos, vel, dt)   // ny position, stannar på ytan
world.randomPoint()
```

Två implementationer:
- **Toroidal** — platt med wrap
- **Sphere** — yta av en sfär, great-circle-geometri

### Simulator
Anropar World för all geometri. Vet ingenting om rendering.

Varje tick:
1. För varje body som inte är pinnad: summera krafter från alla bodies med influence
2. Uppdatera hastighet och position via `world.step()`

### Renderer
Separat plugin. Beror på World-typen.

| World | Renderer |
|---|---|
| Toroidal | Phaser canvas, standard 2D-kamera |
| Sphere | Three.js med roterbar kamera |

3D-worlds parkeras tills det finns ett konkret behov.

---

## Bodies — en unified typ

Allt i världen är en `Body`. Skillnaden är bara properties.

```js
{
  id: string,
  name: string,          // användaren kan namnge
  pos: [x, y],
  vel: [vx, vy],
  pinned: bool,          // rör sig inte
  affected: bool,        // påverkas av andra bodies
  influence: 'none' | 'always' | 'zone' | 'repulsor',
  strength: number,
  drag: number,
  maxSpeed: number,
  color, radius,
  trail: { duration, width, color } | null
}
```

**Två arketyper** (User Lab-presets):

| Namn | pinned | affected | influence |
|---|---|---|---|
| Star | true | false | always |
| Comet | false | true | none |

---

## Rörelselogik

Styrlogik, inte fysik. Varje body med `influence` bidrar med en kraft mot (eller från) en body med `affected: true`. Styrkan beror på influensmodellen:

| Typ | Beteende |
|---|---|
| `always` | Drar alltid, nära = starkare |
| `zone` | Repellerar innanför en radie, attrakterar utanför |
| `repulsor` | Alltid repellerande |
| `none` | Påverkar ingen |

---

## User Lab UX (fas 2)

- **Klick på tom yta** → välj Star eller Comet, namnge, placeras
- **Klick på objekt** → markera, panel med namn + vänliga sliders
- **Drag på Star** → flytta live, comets anpassar sig direkt
- **Drag på Comet** → slangbella, dra ut riktning och kraft, släpp för att skjuta
- **Simulationen kör hela tiden**

---

## Serialisering

Hela världen — World-typ + lista av Bodies — sparas som JSON. Fas 1: kodat i URL. Fas 2: server + nyckel.

---

## Öppna frågor

1. **Zone-modellen**: Räcker `innerRadius` + `strength` (negativ innanför)?
2. **Starta om**: Återgå till startläget utan att ladda om?
3. **Slangbelle-preview**: Visa förhandsvisning av bana när man drar?
