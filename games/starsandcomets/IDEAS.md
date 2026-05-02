# Idéer

Lös samling av idéer att plocka från senare. Inte prioriterade.

- Knapp för att rendera ut sitt system i högupplöst bild, med valbart format (square, landscape, portrait).
- Färgteman för världar — välj tema som sätter färger på stjärnor, kometer m.m. Förutsätter att fysik och presentation hålls separerade.
- Smartare lagring av banhistorik — istället för en rå punkt-lista, undersök splines / Douglas-Peucker-förenkling / adaptiv sampling så långa svansar blir billiga utan att tappa form. Bör vara inställbart (svanslängd, detaljnivå).
- Gör om listningen av kroppar från stora kort till mindre kompakta kort — klick öppnar modal där man sätter färg, storlek m.m.
- Tematiska namnpooler (mytologi, växter, latin, sci-fi) — utöka `play/names.js`.
- "Laga"-knapp för system i dåligt läge — om kometerna studsar eller ligger fult, försök starta om dem med bättre startvektorer så banorna blir snyggare.
- Se över fysiken kring stora stjärnor — kometer fastnar lätt i dem; rör de sig för långsamt nära tunga kroppar? Justera så närpassager känns mer dynamiska. (Delvis adresserat av perpendicular-kicken, men kan finjusteras.)

## Sim-kontroll

- Pause/play-knapp utöver 0×-snap. Lägg ev. till 4× i speed-snaps.
- Reset till ursprungstillstånd utan att tappa designen.
- Determinism / seed så samma värld alltid spelar ut likadant (krävs om man delar).

## Dev/debug

- FPS-räknare + body count som dev-overlay (toggle).
- Export/import JSON för felsökning och säkerhetskopia.
