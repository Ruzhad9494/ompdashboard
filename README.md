# Solar O&M Performance Dashboard

React + Vite dashboard untuk monitoring solar plant performance (generation, PR, availability, downtime, dsb).

## Deploy ke Netlify (tanpa npm locally)

1. Push folder ni ke GitHub repo baru (jangan masukkan `node_modules`, dah handle dalam `.gitignore`).
2. Kat Netlify: **Add new site > Import an existing project** > connect GitHub repo.
3. Build settings (Netlify biasanya auto-detect, tapi kalau tak, set manual):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy. Netlify akan run `npm install` + `npm run build` untuk kau.

## Kalau nak run locally (optional)

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> folder dist/
npm run preview   # preview production build
```

## Struktur

```
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── src/
    ├── main.jsx
    ├── App.jsx      <- dashboard punya logic & UI
    └── index.css
```
