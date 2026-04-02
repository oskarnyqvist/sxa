# Kortspel — Freecell och kortmotor

## Vad är det?

Webbaserat Freecell som första spel, byggt på en återanvändbar kortmotor. Motorn hanterar kortlek, drag, animationer och rendering — nya kortspel byggs ovanpå.

## Grundidé

- Freecell först — ett väl avgränsat spel att bygga motorn kring
- Kortmotorn som eget lager: kortlek, drag-and-drop, animationer, regler-API
- Nya spel (Klondike, Spider, Patiens, Poker?) återanvänder motorn
- Regler definierade separat från rendering

## Kortmotorn

- Kortlek: skapa, blanda, dela ut
- Rendering: kort, högar, drag-and-drop
- Animationer: flytta kort, vända, dela ut
- Regel-API: vilka drag är tillåtna, vinst-villkor, undo/redo
- Touch-stöd för mobil

## Att utforska

- Canvas eller DOM/CSS för rendering?
- Statistik/highscore — spåra vinster, tid, antal drag
- Dagligt seed-nummer (samma spel för alla, som Wordle)?
- Tema/skins för korten
