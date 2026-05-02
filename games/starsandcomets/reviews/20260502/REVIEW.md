---
date: 2026-05-02
checkpoint: a5cea7d
---

# Review 2026-05-02

Levande arbetsdokument. Sissis fulla genomgång: [`SISSI_REVIEW.md`](./SISSI_REVIEW.md).
Checkpoint: `a5cea7d` (`git checkout a5cea7d` för att se exakt det tillstånd vi pratar om).

---

## Problem

- Landningssidan känns inte spelig — ser ut som en admin-dashboard, inget säljer "rymdsimulator" första halvsekunden.
- Färgvalet (Catppuccin Mocha) är mjukt men inte "rymd".
- Ingen logo finns och behövs inte — men något måste fylla rollen.
- Meta-vyerna (`/`, `/new`, `/me`) är desktop-tänkta. Play-vyn är redan touch-anpassad.
- Bottennav-ikonerna (`✦ + ★`) är vaga, säger inte vad de gör.
- Listrader i `/me` och `/` är tunna — borde vara tumstora kort med visuell preview.

## Beslut / riktning

- **Levande bakgrund**: en sim-instans rullar bakom `/`, `/new`, `/me`. Ersätter logo. Ger sömlös övergång in i `/w/:id`.
- **Mobile-first**: gäller framförallt meta-vyerna; Play är redan OK.
- **Två lägen i Play (inte modlöst)**: View = ren canvas fullscreen; Edit = sticky canvas + scrollande HTML-panel under (settings, body-lista med stats). Samma URL, toggle-knapp.
- **Layer-modell för edit/spawn**: en kropp som editeras/skapas är "lyft ur simen" (pausad, visuellt halo + handles). Resten av simen rullar vidare. Släpp = den joinar simen igen.
- **Förenkla UI**: dölj `repelRadius` och `attractionMode` från användaren. `radius` = "Storlek" (är fortfarande mass-proxy internt — större = tyngre, intuitivt).
- **Singularitetsskydd**: behåll repel internt (`repelRadius = radius * 1.5` auto). Lägg till deterministisk perpendicular-kick när `dist < repelRadius` — magnitud `~(1 - |cos(angle vel/radial)|)`, riktning från `sign(cross(vel, radial))` med `body.id` som tiebreaker. Löser head-on-bouncen utan att förstöra replay-determinism.
- **Stats per body**: simulator håller ringbuffer per kropp (max speed senaste, närmsta passage, ålder, total sträcka). Visas som småkort i edit-panelen.
- **Separat URL för View/Edit**: skippa nu. Återbesök om iframe-embed blir aktuellt.

## Palett (vald)

| Hex | Namn | Föreslagen roll |
|---|---|---|
| `#242828` | Graphite Black | bakgrund |
| `#0B467B` | Mermaid Blues | panel / sheet |
| `#E1DACA` | Albescent | text |
| `#723740` | Köfte Brown | dim text / borders |
| `#3983B1` | Mediterranean Blue | kometsvansar / länkar |
| `#CEA158` | Camel | stjärnor |
| `#B51B8B` | Vibrant Velvet | accent / markering / repel |
| `#329960` | Eucalyptus | spara / positiv bekräftelse |

Värmare och mer affischigt än Catppuccin. Ingen ren röd för "fara" — Vibrant Velvet får göra jobbet.

**Källa:** Studio Ghibli-scen (pojke i röd-vit-randig tröja över parkeringsplats). Estetisk princip:

- Handmålad känsla — mjuka kanter, ingen neon-glow eller bloom på stjärnor.
- Lätt kornighet/textur på paneler kan stärka stämningen.
- Vibrant Velvet och Eucalyptus är "den ena rosa bilen" / "det ensamma trädet" — används *sparsamt*, bara där något ska sticka ut (markering, sparat-bekräftelse).
- Ikoner får gärna vara handritade snarare än geometriska/emoji.

## Öppna frågor

- Delad bakgrundsvärld för alla meta-vyer, eller olika per vy?
- Pausa bakgrundssimen när tabben är dold / sänka FPS när inget händer? (batteri på mobil)
- attractionMode (`nearest`/`weighted`/…) — ta tillbaka i UI eller låt vara dold? Reaktion är ortogonal och troligen mer intressant.

## Backlog (prioriterad)

Vad som är gjort och vad som ligger kvar. Sorterat efter ordning vi tänker ta.

### Klart

- [x] **Palett-byte** — CSS-tokens, Studio Ghibli-färger. Commit `ebb3998`.
- [x] **Perpendicular-kick i sim** — bryter head-on-symmetri. Commit `8f42980`.
- [x] **Förenkla sheet** — dölj repel + attractionMode, auto-räkna repel från radius.
- [x] **Newton-3 reaction** — rörlig attraktor får motkraft från det den drar i (mass-viktad).
- [x] **Ta bort INTERAKTION.md, fyll på README** med arkitektur + fysik.

### Nästa upp

1. **Stats-ringbuffer per body** — sim håller `maxSpeed`, `closestApproach`, `age`, `totalDistance`. Data only, ingen UI än. Sätter upp för #4.
2. **Levande bakgrund-sim på meta-vyer** — `App.svelte` får en `BackgroundCanvas`-komponent som rullar en värld bakom `/`, `/new`, `/me`. Pausa när tab dold.
3. **View / Edit-lägen + layer-modell** — stora refactorn. Bottensheet rivs, ersätts med sticky canvas + scrollande HTML-panel. Edit lyfter selected body ur simen.
4. **Mobile-first redesign meta-vyer** — kort med thumbnails, handritade ikoner, bättre nav.

### Polish (senare)

- Thumbnail-snapshot vid Spara, visas i `/me` och `/`.
- Description-fält redigerbart i sheet/panel.
- Kamera-recenter / fit-to-view-knapp.
- Undo (minst ett steg) på Ta bort + radie-handle.
- Auto-save av draft till `localStorage`.
- Default-namn på bodies → svenska (`Stjärna N`, `Komet N`).
- Lägg `infra/www/` i `.gitignore`.
