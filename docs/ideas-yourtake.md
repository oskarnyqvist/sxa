# YourTake — Produktidé

## Vad är det?

YourTake är ett verktyg för att skapa datavisualiserade grafiker och korta animerade videos med ett personligt perspektiv — en "take" — inbyggt. Användaren väljer färdig data, visualiserar den, annoterar vad som är viktigt, och skriver sin analys. Resultatet exporteras som bild eller video för att delas på befintliga plattformar som Instagram, Twitter/X, TikTok och Substack.

YourTake är **inte** en social plattform med egen feed. Det är ett produktionsverktyg som lever på andras plattformar.


## Kärnflödet

1. **Välj dataset** — bläddra i en kurerad datakatalog
2. **Välj visualisering** — stapel, linje, karta etc.
3. **Annotera** — peka ut vad som är viktigt direkt i grafen
4. **Skriv din Take** — ett obligatoriskt perspektivblock, inte bara neutral data
5. **Exportera** — statisk bild (1:1, 16:9), Stories (9:16), animerad video (MP4/GIF)


## Målgrupp

Helt vanliga användare utan teknisk bakgrund eller kodkunskap. Tänk någon som har en åsikt om bostadspriser, sitt lokala fotbollslag eller inflationen — och vill uttrycka den med data istället för bara ord.


## Det unika: Take-blocket

Det som skiljer YourTake från Datawrapper och liknande verktyg är att ett perspektiv är **obligatoriskt**. Man kan inte publicera utan att ha skrivit sin take. Det gör varje graf till ett argument, inte bara en presentation av data.


## Datakällor (MVP)

Starta med **SCB (Statistikmyndigheten)** eftersom:
- Öppet API (PxWeb), ingen nyckel krävs, gratis
- Hög datakvalitet och trovärdighet
- Täcker Sverige på tre geografiska nivåer: riket, län (21 st), kommuner (290 st)
- Uppdateras regelbundet med månads-, kvartals- och årsdata

Framtida källor att lägga till: Finansdata (OMXS30, KPI), Sport (Allsvenskan, NHL), Globalt (World Bank, OECD).


## Dimensionsmodell

All data i systemet har två dimensioner:

**Geografisk nivå**
- Sverige (riket som helhet)
- Län (21 regioner)
- Kommuner (290 kommuner)

**Tidsupplösning**
- Månadsvis
- Kvartalsvis
- Årsvis

Två dataset kan **kombineras i samma graf** om de delar geografisk nivå. Till exempel: medelinkomst per kommun + bostadspriser per kommun = kompatibla, kan visas tillsammans.

Om tidsupplösningen skiljer sig aggregeras data automatiskt upp till den grövre nivån (t.ex. kvartal + år → visas som årsdata). Ingen interpolation eller gissning.


## Exportformat (MVP)

- **Statisk bild** — PNG/JPG i 1:1 och 16:9
- **Stories-format** — 9:16 för Instagram Stories och TikTok
- **Animerad video** — MP4/GIF, 15–30 sekunder där diagrammet "byggs upp" visuellt

Animationsformatet är det viktigaste differentieringsverktyget — Bloomberg-estetik tillgänglig för alla.


## Distribution

YourTake publicerar inte på en egen feed. Innehållet delas direkt på:
- Instagram (Post, Stories, Reels)
- Twitter / X
- TikTok
- Substack och nyhetsbrev (embed eller bild)
- LinkedIn

Plattformsbyte är produktens styrka, inte en begränsning.


## Vad som inte ingår (medvetna val)

- Ingen CSV-import eller manuell datainmatning
- Ingen egen social feed eller följar-system
- Inga inloggningskrav för att konsumera innehåll
- Ingen kodredigerare eller tekniska alternativ


## Öppna frågor

- Hur kureras och uppdateras dataset-katalogen löpande?
- Hur hanteras dataset som uppdateras i realtid (finans)?
- Ska det finnas en "Populärt"-vy som visar vad andra gör Takes på just nu, som growth-loop utan att vara en feed?
- Affärsmodell: freemium med exportlimit, eller betald per export?
