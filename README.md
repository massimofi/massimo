# Massimo Arellano — Portfolio

2-page portfolio. Home + Resume.

## Run it

```
cd portfolio
python3 -m http.server 8000
```

Open http://localhost:8000

## Stack

- **Lenis** — smooth scroll
- **anime.js** — candlestick chart in hero + text reveals
- **GSAP ScrollTrigger** — horizontal pinned project scroll
- **Barba.js** — page transitions

All via CDN. No build step.

## Files

- `index.html` — Hero + projects
- `resume.html` — Resume PDF embed
- `styles.css` — All styling
- `main.js` — All animations
- `resume.pdf` — Your resume

## Edit

- **Projects**: edit the `.project-card` blocks in `index.html`
- **Colors**: `:root` variables at top of `styles.css`
- **Resume**: replace `resume.pdf`
- **GitHub links**: search/replace `github.com/massimofi`

## Deploy

Drag folder onto https://app.netlify.com/drop — done.
