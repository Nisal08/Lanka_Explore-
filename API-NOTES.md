# API Notes — Lanka Explorer (Week 04)

This project is a static front end. The browser makes the requests directly, so no API key or server is required. API responses can be unavailable while the rest of the site remains usable.

## 1. Open-Meteo — current weather and three-day forecast

- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Request parameters:** latitude, longitude, current temperature / relative humidity / wind / WMO weather code, daily weather code / max and min temperature / precipitation probability, `timezone=Asia/Colombo`, `forecast_days=3`.
- **Used on:** each `details.html?id=...` page.
- **What I learned:** the response has separate `current` and `daily` objects. The daily values are parallel arrays, so the same array index refers to the same forecast day. `weather_code` is a WMO number that the JavaScript translates into a short description and icon.
- **Key handling:** a loading state appears first; failed HTTP responses, offline requests or incomplete data produce a friendly message in the weather panel.
- **Documentation:** [open-meteo.com/en/docs](https://open-meteo.com/en/docs)

## 2. Frankfurter — USD to LKR exchange rate

- **Endpoint:** `https://api.frankfurter.dev/v2/rate/usd/lkr`
- **Response values used:** `rate` and `date`.
- **Used on:** paid destination details and the My Trip budget.
- **What I learned:** a small response can be cached and reused instead of making one request for every fee. Lanka Explorer stores the latest successful rate in memory and in `localStorage` for up to 12 hours. The displayed LKR values are approximate because the exchange rate changes.
- **Key handling:** if the service cannot be reached, the project keeps the USD values and shows an LKR-unavailable note rather than breaking the trip planner.
- **Documentation:** [frankfurter.dev](https://www.frankfurter.dev/)

## 3. Leaflet + OpenStreetMap — interactive maps

- **Library:** Leaflet 1.9.4, loaded from `unpkg.com` on the Destinations and Details pages.
- **Tile endpoint:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Used on:** a map with one marker on a destination detail page and a map with filtered markers on the Destinations page.
- **What I learned:** Leaflet turns a regular HTML element into a pannable, zoomable map. Marker coordinates come from `destinations.json`; map popups are bound to each marker. The OpenStreetMap credit must remain visible.
- **Key handling:** if the Leaflet library is missing, the page shows a clear message and the rest of the destination content still works.
- **Documentation:** [leafletjs.com/reference.html](https://leafletjs.com/reference.html) · [OpenStreetMap copyright and tile usage](https://www.openstreetmap.org/copyright)

## Testing notes

- The endpoints were checked while building the project on 2 November 2026.
- Test with DevTools → Network (including Slow 3G) and block one API request at a time to see the error states.
- A GitHub Pages deployment needs an internet connection for the public APIs, the Leaflet CDN and OpenStreetMap tiles.
- The entry fees in `data/destinations.json` are **classroom planning estimates**, not official quotes. Confirm current visitor prices with the attraction or park before travelling.
