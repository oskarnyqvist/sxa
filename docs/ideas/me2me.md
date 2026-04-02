# Me2Me — Personlig kommunikationshub

## Vad är det?

En chattapp där du bara pratar med dig själv, dina enheter och dina tjänster. Istället för att varje verktyg/projekt behöver ett eget UI pluggar de in som kanaler i chatten. Chat är gränssnittet för allt.

## Grundidé

- WhatsApp/Telegram-liknande UX, men privat — bara du
- Varje "kontakt" eller kanal är en tjänst, device eller anteckningsyta
- Nya appar = nya kanaler med en bot/tjänst bakom
- Synkat mellan alla dina enheter (mobil, dator)

## Exempelkanaler

- **Anteckningar** — skicka meddelanden till dig själv, synkat överallt
- **AI** — prata med Claude/GPT direkt i chatten
- **Prylkoll** — "när bytte jag olja på fyrhjulingen?" → svar från tjänsten
- **Bilköp** — "lägg till blocket.se/abc123" → hämtar data, lägger till kandidat
- **Landstället** — notifikationer från sensorer, kameror
- **Haiku-appen** — nån random tredjepart som byggt en rolig grej

## Plattform för andra

- Tredjepartsappar ansluter som en bot/kanal (enkelt API)
- Användare "installerar" en app genom att lägga till den i sin chatt
- Likt Telegram-bots eller Slack-appar, fast chatten *är* hela plattformen
- Apparna slipper bygga eget UI — de pratar bara chat-protokollet

## Kommunikationsbryggor

- Chat (kärnan)
- Email — ta emot och skicka via chatten
- SMS — ta emot och skicka via chatten
- Push-notifikationer till mobilen

## Att utforska

- Protokoll/API för att ansluta en app — WebSocket? Webhooks? Båda?
- Hur hanteras rika svar? (knappar, bilder, kartor, formulär — eller bara text?)
- End-to-end-kryptering?
- PWA för mobil eller native app?
- Hur skiljer sig detta från Matrix/Beeper? (Svar: de bryggar *andras* chattar, Me2Me är en *egen* plattform med appar)
