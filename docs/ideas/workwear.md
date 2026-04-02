# White-Collar Workwear — Uniformer för kontorsarbetare

## Vad är det?

Snygga, enhetliga arbetskläder för tjänstemän. Konceptet: köp 5 likadana skjortor, slipp tänka på vad du ska ha på dig. Minimalistiskt, kvalitet, bulk-köp av samma plagg.

## Målgrupp

Kontorsarbetare, konsulter, säljare — folk som vill se proffsiga ut utan att lägga tid på kläder. Tänk "Steve Jobs-garderob" fast för skjortor och byxor.

## Kärnfunktioner

- Begränsat sortiment: få modeller, få färger, hög kvalitet
- Bulk-orienterat: köp 5-pack, 10-pack — prismodell som uppmuntrar det
- Enkel webshop: välj modell, färg, storlek, antal — klart
- Storleksguide / måttbeställning?

## Vad det inte är

- Ingen modebutik med säsonger och trender
- Inga hundratals varianter — poängen är att det är *få* val
- Ingen produktion ännu — POC först för att validera intresse

## Konkurrenter / Liknande tjänster

- Asket — minimalistiska basplagg, men inte uniformstänk
- Eton, Stenströms — kvalitetsskjortor men dyra och modefokus
- Uniformsföretag (Jobman etc) — blue-collar, inte kontor
- Gapet: ingen gör "white-collar uniformer" med bulk-köp-fokus

## Komplexitet

- **Liten** för POC — statisk/enkel sajt, kanske waitlist eller intresseanmälan
- **Medel** för riktig shop — betalning, lager, ordrar

## Infrastruktur (POC)

- Databas: kanske inte ens — statisk sida med formulär räcker
- Bilder: produktfoton (Object Storage)
- Betalning: inte i POC — validera intresse först
- Email-lista: samla intresseanmälningar

## Tech-stack (förslag POC)

- Svelte statisk sida på sxa.se
- Formulär → enkel backend eller extern tjänst för email-lista

## Resurser

- Mönsterkonstruktör finns tillgänglig

## Att utforska

- Vilka plagg först? Skjortor? Chinos? Pikéer?
- Prispunkt — vad kostar 5-pack av kvalitetsskjortor?
- Var tillverka? Portugal, Turkiet, Baltikum?
- Varumärke/namn?
- Validering: landningssida med "anmäl intresse" → mäta konvertering innan produktion
