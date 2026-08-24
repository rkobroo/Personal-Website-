# Himal Paudel — Portfolio

Ultra-premium personal portfolio. Dark navy-black theme, neon purple/blue/cyan accents,
glassmorphism cards, particle field, cursor glow, animated counters and skill bars.
Pure HTML/CSS/JS — zero build step, deploys straight to **Cloudflare Pages**.

## Structure

```
himal-portfolio/
├── index.html          # all sections (hero, stats, about, skills, projects, experience, contact)
├── css/style.css       # full design system
├── js/main.js          # particles, cursor glow, typing, reveals, counters, tilt, map
└── assets/
    ├── favicon.svg
    └── Himal-Paudel-CV.pdf   <- drop your real CV here (Download CV button links to it)
```

## Run locally

```powershell
# any static server works — from the project root:
npx serve .
# or: python -m http.server 8080
```

Then open http://localhost:3000 (or :8080).

## Deploy to Cloudflare Pages

### Option A — Wrangler CLI (fastest)

```powershell
npx wrangler login
npx wrangler pages deploy . --project-name=himal-portfolio
```

Live at `https://himal-portfolio.pages.dev`.

### Option B — Dashboard drag & drop

1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Pages -> Upload assets
2. Drag the `himal-portfolio` folder -> Deploy.

### Option C — Git integration (auto-build on push)

1. Push this folder to a GitHub repo.
2. Cloudflare Pages -> Create project -> Connect to Git.
3. Build settings: framework preset **None**, build command *(empty)*, output dir `/`.

## Customize checklist

- [ ] Replace `.portrait` initials in `index.html` with `<img src="assets/portrait.jpg" alt="Himal Paudel">`
- [ ] Add real CV: `assets/Himal-Paudel-CV.pdf`
- [ ] Update social URLs (GitHub / LinkedIn / X / Instagram) in hero, contact and footer
- [ ] Set real project links (`Live Demo` / `GitHub` buttons currently `#`)
- [ ] Update email/phone placeholders in About + Contact
- [ ] Wire the contact form: point `js/main.js` (search "Demo submit") at Formspree or a Pages Function
- [ ] Adjust stat numbers via `data-count` attributes in the Stats section
