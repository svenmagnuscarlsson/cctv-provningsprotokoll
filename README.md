# CCTV Provningsprotokoll App

En fristående webbapplikation för att skapa, redigera och hantera CCTV-provningsprotokoll. Appen är byggd med HTML, CSS och vanliga JavaScript utan externa beroenden och designad för att köras direkt i webbläsaren med offline-stöd och lokal datalagring.

## 🚀 Funktioner

*   **Dashboard (`index.html` / `dashboard.js`)**
    *   Översikt över alla dina skapade provningsprotokoll.
    *   Skapa nya protokoll eller fortsätt redigera befintliga.
    *   Smidig hantering med möjlighet att ta bort äldre projekt.
*   **Protokollredigerare (`protocol.html` / `app.js`)**
    *   Detaljerat formulär för att mata in all data för CCTV-inspektionen.
    *   Stöd för bilduppladdning och nedskalning av kamerabilder för att optimera prestanda.
    *   Redigerbara kameraetiketter (labels).
    *   Bilderna behåller sitt ursprungliga bildförhållande (aspect ratio).
*   **A4-Utskrift & Export**
    *   Fullt anpassad layout för smidig och korrekt utskrift via webbläsarens inbyggda utskriftsfunktion (anpassat för att exakt rymmas på A4-format).
*   **Lokal Datalagring (`db.js`)**
    *   All data, inklusive uppladdade bilder och formulärfält, sparas automatiskt lokalt i webbläsarens **IndexedDB**.
    *   Ingen backend, databas eller specifik servermjukvara krävs, vilket innebär att appen är blixtsnabb och din data stannar lokalt på din enhet.

## 🛠️ Teknisk Stack

*   **Huvudspråk:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla, ES6+).
*   **Datalagring:** IndexedDB API för asynkron lagring i klienten.

## 📂 Mappstruktur

```text
/
├── index.html        - Dashboard/Huvudsidan för att lista och skapa protokoll
├── protocol.html     - Sidan för att redigera ett specifikt protokoll
├── css/
│   └── style.css     - Stilregler för appen och pappers/A4-utskriftslayout
└── js/
    ├── app.js        - Logik för protokollredigering, bilduppladdning och fältinmatning
    ├── dashboard.js  - Logik för startsidan och filhantering/protokollistan
    └── db.js         - Databaslogik och alla operationer mot bekväm hantering av IndexedDB
```

## 💻 Så här kör du appen

Eftersom detta är en ren klientside-applikation (HTML/CSS/JS) behövs inga tunga byggverktyg. Du har flera alternativ:

1.  **Enkel filöppning:** 
    Öppna bara `index.html` direkt i din moderna webbläsare (Google Chrome, Firefox, Safari eller Edge rekommenderas).
    
    *Observera att vissa funktioner (som kameratillgång eller stränga CORS-policies med lokala JSON/bilder) ibland kräver att tjänsten körs via en lokal server, men IndexedDB bör fungera ändå.*
    
2.  **Lokal webbserver (Rekommenderas):**
    För bästa upplevelse och kompatibilitet kan det vara bra att köra en enkel lokal webbserver:
    *   Har du Python installerat: Kör `python -m http.server` i mappen.
    *   Har du Node.js installerat: Använd `npx serve` eller `npx live-server`.
    *   Eller använd ett plugin som t.ex. "Live Server" i VS Code.
    Besök sedan `http://localhost:<port>` i din webbläsare.

## 📝 Användning & Arbetsflöde

1.  Gå till **Dashboard** (`index.html`).
2.  Klicka för att skapa ett **nytt projekt/protokoll**.
3.  Fyll i dina inspektionsdata och ladda upp dina bilder i **Protokollredigeraren**. 
    *Allt autosparas (eller sparas via spara-knapp) till webbläsarens IndexedDB medan du jobbar.*
4.  När du är klar och ska skicka protokollet till en kund - klicka på **Skriv ut/Export (Ctrl+P)**. Formatet är utformat för att skalas perfekt vid en standard PDF-utskrift.

## 💡 Begränsningar

*   All data ligger lagrad i din aktuella webbläsare. Om du rensar webbläsarens lokala data/cache, avinstallerar webbläsaren eller kör i "Inkognito-läge", kan din data gå förlorad.
*   En export/import-funktion av data (t.ex. JSON-dump + bas64-bilder) kan implementeras i framtiden för att flytta data mellan enheter.

---
*Skapad och underhålls för CCTV Provningsprotokoll-inspektioner.*
