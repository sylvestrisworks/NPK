# NPK — När gödsel blir geopolitik

Scrollytelling-presentation till måltidsservice ledningsgrupp om hur konflikten kring Hormuzsundet, NPK-gödsel och energipriser hänger ihop — och vad det betyder för matkostnaderna framåt.

## Köra lokalt

Statisk site, inga byggsteg. Kör en enkel HTTP-server i repo-roten:

```powershell
# Python
python -m http.server 8000

# eller Node
npx serve .
```

Öppna sedan `http://localhost:8000` i webbläsaren.

## Filer

- `index.html` — narrativet, struktur per akt
- `style.css` — typografi, sticky-graphic-layout, färgspråk
- `script.js` — Scrollama-init, step-handlers per akt
- `data/` — JSON-data till charts (en snapshot, inte live)
- `assets/` — SVG-kartor, bilder
- `presenter.md` — talarmanus för live-leverans
- `sources.md` — källor till varje sifferpåstående
- `Grundbulten.txt` — ursprungligt utkast som strukturkälla

## Deploy

Deployas som statisk site (Vercel, Netlify eller GitHub Pages). Inga miljövariabler, inga byggsteg.

## Stack

- [Scrollama](https://github.com/russellsamora/scrollama) — scroll-triggered steps
- [D3 v7](https://d3js.org/) — kartor och charts
- [GSAP](https://gsap.com/) — animationer

Alla via CDN. Inga npm-dependencies.
