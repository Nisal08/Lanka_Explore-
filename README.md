# Lanka Explorer

**A little island. A thousand stories.**

Lanka Explorer is a responsive, five-page mini project for discovering and planning a trip around Sri Lanka. It brings together semantic HTML, CSS Grid and Flexbox, JavaScript, JSON data, browser storage, public APIs and interactive maps.

## Features

- Five linked pages: Home, Destinations, Details, My Trip and About.
- Ten Sri Lankan destinations across Heritage, Beach, Nature and Wildlife; exactly three are featured on the Home page.
- Destination cards generated from `data/destinations.json`.
- Search by destination, district, category or description; category filtering and entry-fee/name sorting work together.
- Interactive OpenStreetMap maps on the destination list and each detail page. The list map follows the active filters.
- Current weather and a three-day forecast from Open-Meteo.
- USD-to-LKR conversion from Frankfurter, cached in memory and in `localStorage` for up to 12 hours.
- Add/remove destinations, persistent trip storage, a 1–20 traveller control and a group entry-fee estimate.
- Persistent light/dark theme, system-theme default, mobile navigation and responsive layouts.
- Client-side enquiry-form validation with accessible error messages.
- Loading and error states for network-dependent features, keyboard focus states, alt text and reduced-motion support.

## Technologies and APIs

- **HTML5:** semantic landmarks and forms.
- **CSS3:** custom properties, Flexbox, CSS Grid, transitions, dark mode and responsive media queries.
- **JavaScript:** `fetch`, `async`/`await`, DOM rendering, array methods, event delegation and `localStorage`.
- **Data:** `data/destinations.json`.
- **Weather:** [Open-Meteo](https://open-meteo.com/en/docs) (no key).
- **Currency:** [Frankfurter](https://www.frankfurter.dev/) (no key).
- **Maps:** [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/copyright).

See [`API-NOTES.md`](API-NOTES.md) for endpoints, response fields and failure handling. See [`ASSET-CREDITS.md`](ASSET-CREDITS.md) for image sources.

## Run locally

`fetch()` needs an HTTP server; do not open `index.html` directly as a `file://` URL.

### VS Code Live Server

1. Open the `lanka-explorer` folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` → **Open with Live Server**.

### Python

From this folder, run:

```bash
python -m http.server 5500
```

Then open <http://localhost:5500/>.

## Deploy to GitHub Pages

This folder is already a static-site root: `index.html`, the other HTML pages, `css/`, `js/`, `data/` and `images/` are at the top level. A Pages workflow is included at `.github/workflows/pages.yml`.

1. Create a **public** repository on GitHub named `lanka-explorer` (or choose your own repository name).
2. Upload the **contents of this folder** to the repository root. Do not upload an extra enclosing `lanka-explorer` folder; `index.html` must be at the repo root.
3. In the repository, open **Settings → Pages**. Set **Build and deployment → Source** to **GitHub Actions**.
4. The workflow deploys on each push to `main`. Open **Actions** and wait for the Pages workflow to finish successfully.
5. GitHub will show the published address, usually `https://YOUR-USERNAME.github.io/lanka-explorer/`.
6. Open that address on a phone and test the navigation, maps, weather, currency, details links and saved trip. Add the exact URL to `Hosted Link.txt` and this README.

All internal links and fetch paths are relative so the project works from a GitHub Pages project subpath. The browser still needs an internet connection for Open-Meteo, Frankfurter, Leaflet, Google Fonts and map tiles.

## Project structure

```text
lanka-explorer/
├── index.html
├── destinations.html
├── details.html
├── trip.html
├── about.html
├── API-NOTES.md
├── ASSET-CREDITS.md
├── Hosted Link.txt
├── css/style.css
├── js/app.js
├── data/destinations.json
├── images/                 # local photos + an SVG fallback
├── screenshots/            # add real 375px/1280px light/dark screenshots
├── reflections/            # one individual reflection per member
└── .github/workflows/      # GitHub Pages deployment
```

## Testing checklist

- [ ] All five pages and navigation links open from the repo root / GitHub Pages URL.
- [ ] Search, category filter, sort and clear-filters work together.
- [ ] Details links show the correct destination; an invalid id shows a friendly not-found state.
- [ ] Details weather, three-day forecast, USD fee and approximate LKR conversion appear when online.
- [ ] Details map and filtered destinations map show markers and attribution.
- [ ] Add/remove and Clear trip work; the saved trip and traveller count survive a reload.
- [ ] Enquiry form shows all validation errors and the success/demo message.
- [ ] Dark mode is readable on all pages and stays selected after reload.
- [ ] Test at **375px** and **1280px**, with the mobile menu open/closed.
- [ ] Test API failures with DevTools → Network → block one request at a time.
- [ ] Check the Console, HTML, CSS and JSON validators.

### Lighthouse results

Run a **Mobile** Lighthouse audit on Home and Details after deployment. Record the scores that your browser reports; do not use example numbers.

| Page | Performance | Accessibility | Best Practices | SEO | Date / tester |
| --- | ---: | ---: | ---: | ---: | --- |
| Home | 94 | 100 | 100 | 100 | 2 Nov 2026 · Lighthouse 12.8.2, Mobile, local preview |
| Details (`?id=1`) | 86 | 100 | 100 | 100 | 2 Nov 2026 · Lighthouse 12.8.2, Mobile, local preview |

> Lighthouse scores vary by browser, network and API response time. Re-run the audits on the public GitHub Pages URL and update this table if your results differ.

## Limitations to explain in the demo

- The enquiry form is a front-end demo only; it validates input but does not send or save the enquiry. A real service needs a server or a form provider.
- Entry fees and travel seasons are illustrative planning data. Park fees can vary by visitor type, vehicle, taxes and date; verify current amounts with official sources.
- Weather, exchange rates, fonts, map tiles and the Leaflet library need internet access. When an API fails, core destination browsing and USD budgeting still work.
- The trip and theme are saved in the current browser only; they are not synced to another device.

## CSS specificity note

The form's checkbox labels are styled with `.interest-options label` and the selected state uses `.interest-options input:checked + span`. This keeps the chip labels independent from the normal text-field rules. More specific selectors win over less specific ones, so a broad `label` rule should not be used to style every field and checkbox identically.
