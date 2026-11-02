'use strict';

// ===== 1. MOBILE NAVIGATION =====
const menuToggle = document.querySelector('.menu-toggle');
const primaryNavigation = document.querySelector('#primary-navigation');

if (menuToggle && primaryNavigation) {
  function setMenuOpen(isOpen) {
    primaryNavigation.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    const icon = menuToggle.querySelector('.menu-icon');
    if (icon) icon.textContent = isOpen ? '×' : '☰';
  }

  menuToggle.addEventListener('click', function () {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  primaryNavigation.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && primaryNavigation.classList.contains('is-open')) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
}

// ===== 1b. DARK MODE =====
const THEME_KEY = 'lankaExplorerTheme';
const themeToggle = document.querySelector('.theme-toggle');

function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);

  if (themeToggle) {
    const label = themeToggle.querySelector('.theme-label');
    const icon = themeToggle.querySelector('.theme-icon');
    if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (icon) icon.textContent = isDark ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }
}

const savedTheme = readSavedTheme();
const initialTheme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      // Theme still changes for this page if browser storage is disabled.
    }
    applyTheme(nextTheme);
  });
}

// ===== 2. LOAD DESTINATION DATA =====
async function loadDestinations() {
  const url = new URL('data/destinations.json', document.baseURI);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load destinations (HTTP ${response.status}).`);
  }

  const destinations = await response.json();
  if (!Array.isArray(destinations)) {
    throw new Error('Destination data is not a valid list.');
  }
  return destinations;
}

// ===== 3. SHARED HELPERS & DISPLAY COMPONENTS =====
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, function (character) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
}

function formatFee(fee) {
  const numericFee = Number(fee);
  return numericFee === 0 ? 'Free' : `USD ${numericFee.toLocaleString('en-US')}`;
}

function getPriceLabel(fee) {
  const numericFee = Number(fee);
  if (numericFee === 0) return 'Free';
  if (numericFee <= 15) return 'Budget';
  if (numericFee <= 30) return 'Mid-range';
  return 'Premium';
}

function getCategoryClass(category) {
  switch (category) {
    case 'Heritage': return 'badge-heritage';
    case 'Beach': return 'badge-beach';
    case 'Nature': return 'badge-nature';
    case 'Wildlife': return 'badge-wildlife';
    default: return 'badge-other';
  }
}

function formatLkr(amount) {
  return `Rs. ${Math.round(amount).toLocaleString('en-LK')}`;
}

function showLoading(element, text) {
  if (!element) return;
  element.innerHTML = `<div class="loading"><span class="spinner" aria-hidden="true"></span><span>${escapeHTML(text)}</span></div>`;
}

function showError(element, text) {
  if (!element) return;
  element.innerHTML = `<p class="error-message">${escapeHTML(text)}</p>`;
}

function setImageFallback(image) {
  if (!image) return;
  image.addEventListener('error', function () {
    image.src = 'images/placeholder.svg';
    image.alt = 'Illustrated Sri Lanka landscape';
    image.classList.add('image-fallback');
  }, { once: true });
}

function createCard(place) {
  const card = document.createElement('article');
  card.className = 'destination-card';

  const name = escapeHTML(place.name);
  const category = escapeHTML(place.category);
  const district = escapeHTML(place.district);
  const image = escapeHTML(place.image);
  const imageAlt = escapeHTML(place.imageAlt || `${place.name} in Sri Lanka`);
  const description = escapeHTML(place.description);
  const priceBand = Number(place.entryFeeUSD) > 0
    ? `<span class="card-price-band">${escapeHTML(getPriceLabel(place.entryFeeUSD))}</span>`
    : '';

  card.innerHTML = `
    <a class="card-image-link" href="details.html?id=${encodeURIComponent(place.id)}" tabindex="-1" aria-hidden="true">
      <img src="${image}" alt="${imageAlt}" loading="lazy" decoding="async">
    </a>
    <div class="destination-card-body">
      <div class="card-topline"><span class="badge ${getCategoryClass(place.category)}">${category}</span><span class="card-area">${district} District</span></div>
      <h3><a href="details.html?id=${encodeURIComponent(place.id)}">${name}</a></h3>
      <p class="card-description">${description}</p>
      <div class="card-bottom"><p class="fee-label">Entry: ${escapeHTML(formatFee(place.entryFeeUSD))}${priceBand}</p><a class="card-link" href="details.html?id=${encodeURIComponent(place.id)}">Discover <span aria-hidden="true">↗</span></a></div>
    </div>
  `;

  setImageFallback(card.querySelector('img'));
  return card;
}

// ===== 4. HOME PAGE: FEATURED PLACES =====
async function initHomePage() {
  const featuredList = document.querySelector('#featured-list');
  if (!featuredList) return;

  showLoading(featuredList, 'Finding your first island stories…');
  try {
    const destinations = await loadDestinations();
    const featured = destinations.filter(place => place.featured === true);
    featuredList.replaceChildren();

    if (featured.length === 0) {
      featuredList.innerHTML = '<p class="no-results">Featured places will appear here soon.</p>';
      return;
    }

    featured.forEach(place => featuredList.appendChild(createCard(place)));
  } catch (error) {
    showError(featuredList, 'Featured destinations could not be loaded. Please check your connection and try again.');
  }
}

// ===== 5. DESTINATIONS PAGE: SEARCH, FILTER & SORT =====
let allPlacesMap = null;
let allPlacesLayer = null;
let allPlacesMarkers = [];

function addOpenStreetMapLayer(map) {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function showAllDestinationsMap(destinations) {
  const mapBox = document.querySelector('#all-map');
  if (!mapBox) return;

  if (typeof L === 'undefined') {
    mapBox.innerHTML = '<p class="map-placeholder-error">The map library could not be loaded. Your destination list still works above.</p>';
    return;
  }

  if (!allPlacesMap) {
    mapBox.replaceChildren();
    allPlacesMap = L.map(mapBox, { scrollWheelZoom: false }).setView([7.8731, 80.7718], 7);
    addOpenStreetMapLayer(allPlacesMap);
    allPlacesLayer = L.layerGroup().addTo(allPlacesMap);
  }

  allPlacesLayer.clearLayers();
  allPlacesMarkers = [];
  const points = [];

  destinations.forEach(function (place) {
    const marker = L.marker([place.lat, place.lng]).addTo(allPlacesLayer);
    marker.bindPopup(`<strong>${escapeHTML(place.name)}</strong><br>${escapeHTML(place.category)} · ${escapeHTML(place.district)}<br><a href="details.html?id=${encodeURIComponent(place.id)}">View destination</a>`);
    allPlacesMarkers.push(marker);
    points.push([place.lat, place.lng]);
  });

  if (points.length > 1) {
    allPlacesMap.fitBounds(points, { padding: [28, 28], maxZoom: 8 });
  } else if (points.length === 1) {
    allPlacesMap.setView(points[0], 10);
  } else {
    allPlacesMap.setView([7.8731, 80.7718], 7);
  }

  window.setTimeout(function () {
    if (allPlacesMap) allPlacesMap.invalidateSize();
  }, 100);
}

async function initDestinationsPage() {
  const list = document.querySelector('#destination-list');
  if (!list) return;

  const searchInput = document.querySelector('#search');
  const categorySelect = document.querySelector('#category');
  const sortSelect = document.querySelector('#sort');
  const resultCount = document.querySelector('#result-count');
  const clearButton = document.querySelector('#clear-filters');
  let allDestinations = [];

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('category');
  if (initialCategory && [...categorySelect.options].some(option => option.value === initialCategory)) {
    categorySelect.value = initialCategory;
  }

  showLoading(list, 'Loading island stops…');
  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    showError(list, 'Sorry, destinations could not be loaded. Please try again when you are online.');
    if (resultCount) resultCount.textContent = 'Destinations unavailable';
    const mapBox = document.querySelector('#all-map');
    if (mapBox) mapBox.innerHTML = '<p class="map-placeholder-error">Destination locations are unavailable because the data could not be loaded.</p>';
    return;
  }

  function updateList() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sortBy = sortSelect.value;

    const results = allDestinations.filter(function (place) {
      const searchableText = `${place.name} ${place.district} ${place.category} ${place.description}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchText);
      const matchesCategory = category === 'all' || place.category === category;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'fee-low') {
      results.sort((a, b) => a.entryFeeUSD - b.entryFeeUSD || a.name.localeCompare(b.name));
    } else if (sortBy === 'fee-high') {
      results.sort((a, b) => b.entryFeeUSD - a.entryFeeUSD || a.name.localeCompare(b.name));
    }

    list.replaceChildren();
    if (results.length === 0) {
      list.innerHTML = '<p class="no-results">No destinations match those filters. Try a different search or clear the filters.</p>';
    } else {
      results.forEach(place => list.appendChild(createCard(place)));
    }

    if (resultCount) {
      resultCount.textContent = `Showing ${results.length} of ${allDestinations.length} destination${allDestinations.length === 1 ? '' : 's'}`;
    }
    showAllDestinationsMap(results);
  }

  searchInput.addEventListener('input', updateList);
  categorySelect.addEventListener('change', updateList);
  sortSelect.addEventListener('change', updateList);
  if (clearButton) {
    clearButton.addEventListener('click', function () {
      searchInput.value = '';
      categorySelect.value = 'all';
      sortSelect.value = 'name';
      updateList();
      searchInput.focus();
    });
  }

  updateList();
}

// ===== 5b. API: WEATHER (OPEN-METEO) =====
function describeWeather(code) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Mixed conditions';
}

function weatherIcon(code) {
  if (code === 0) return '☀';
  if (code === 1 || code === 2) return '⛅';
  if (code === 3) return '☁';
  if (code === 45 || code === 48) return '〰';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '☂';
  if (code >= 71 && code <= 86) return '❄';
  if (code >= 95) return 'ϟ';
  return '◌';
}

async function showWeather(place) {
  const weatherBox = document.querySelector('#weather');
  if (!weatherBox) return;

  showLoading(weatherBox, `Checking the forecast for ${place.name}…`);
  const query = new URLSearchParams({
    latitude: place.lat,
    longitude: place.lng,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'Asia/Colombo',
    forecast_days: '3'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${query.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
    const data = await response.json();
    if (!data.current || !data.daily || !Array.isArray(data.daily.time)) {
      throw new Error('Weather response was incomplete.');
    }

    const current = data.current;
    const daily = data.daily;
    const forecastItems = daily.time.map(function (dateString, index) {
      const date = new Date(`${dateString}T12:00:00`);
      const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const code = Number(daily.weather_code[index]);
      const max = Math.round(daily.temperature_2m_max[index]);
      const min = Math.round(daily.temperature_2m_min[index]);
      const rain = Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max[index] : null;
      return `
        <div class="forecast-day">
          <span class="forecast-date">${escapeHTML(dateLabel)}</span>
          <span class="forecast-icon" aria-hidden="true">${weatherIcon(code)}</span>
          <span class="forecast-condition">${escapeHTML(describeWeather(code))}</span>
          <span class="forecast-temperatures">${max}° / ${min}°</span>
          <span class="forecast-rain">Rain ${rain === null || rain === undefined ? '—' : `${Math.round(rain)}%`}</span>
        </div>
      `;
    }).join('');

    const currentCode = Number(current.weather_code);
    weatherBox.innerHTML = `
      <div class="weather-now">
        <span class="weather-symbol" aria-hidden="true">${weatherIcon(currentCode)}</span>
        <div class="weather-reading">
          <span class="weather-temp">${Math.round(current.temperature_2m)}°</span>
          <span class="weather-condition">${escapeHTML(describeWeather(currentCode))}</span>
          <p class="weather-meta">Humidity ${Math.round(current.relative_humidity_2m)}% · Wind ${Math.round(current.wind_speed_10m)} km/h</p>
        </div>
      </div>
      <p class="forecast-heading">Three-day forecast · °C</p>
      <div class="forecast-grid">${forecastItems}</div>
    `;
  } catch (error) {
    weatherBox.innerHTML = '<div class="weather-unavailable"><p>Live weather is unavailable right now. The rest of this destination is still ready to explore.</p></div>';
  }
}

// ===== 5c. API: CURRENCY (FRANKFURTER) =====
const RATE_CACHE_KEY = 'lankaExplorerUsdLkrRate';
const RATE_CACHE_MAX_AGE = 12 * 60 * 60 * 1000;
let usdToLkrRate = null;
let usdToLkrRateDate = '';
let usdToLkrRequest = null;

async function getUsdToLkrRate() {
  if (usdToLkrRate !== null) return { rate: usdToLkrRate, date: usdToLkrRateDate, cached: true };

  if (!usdToLkrRequest) {
    usdToLkrRequest = (async function () {
      try {
        const stored = localStorage.getItem(RATE_CACHE_KEY);
        if (stored) {
          const cached = JSON.parse(stored);
          const age = Date.now() - Number(cached.savedAt);
          if (Number(cached.rate) > 0 && age >= 0 && age < RATE_CACHE_MAX_AGE) {
            usdToLkrRate = Number(cached.rate);
            usdToLkrRateDate = cached.date || '';
            return { rate: usdToLkrRate, date: usdToLkrRateDate, cached: true };
          }
        }
      } catch (error) {
        // Ignore an unavailable or malformed local rate cache and request a fresh rate.
      }

      const response = await fetch('https://api.frankfurter.dev/v2/rate/usd/lkr');
      if (!response.ok) throw new Error(`Currency service returned HTTP ${response.status}.`);
      const data = await response.json();
      const rate = Number(data.rate);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Currency service returned an invalid exchange rate.');

      usdToLkrRate = rate;
      usdToLkrRateDate = data.date || '';
      try {
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, date: usdToLkrRateDate, savedAt: Date.now() }));
      } catch (error) {
        // Keep the fetched rate in memory if browser storage is disabled.
      }
      return { rate, date: usdToLkrRateDate, cached: false };
    })();
  }

  try {
    return await usdToLkrRequest;
  } catch (error) {
    usdToLkrRequest = null;
    throw error;
  }
}

async function showFeeInLkr(place) {
  const feeBox = document.querySelector('#fee-lkr');
  if (!feeBox || Number(place.entryFeeUSD) === 0) return;

  try {
    const rateData = await getUsdToLkrRate();
    feeBox.textContent = ` · ≈ ${formatLkr(Number(place.entryFeeUSD) * rateData.rate)}`;
    feeBox.title = rateData.date ? `Exchange rate date: ${rateData.date}` : 'Approximate conversion using a live exchange rate';
  } catch (error) {
    feeBox.textContent = ' · LKR conversion unavailable';
  }
}

// ===== 5d. API: MAPS (LEAFLET + OPENSTREETMAP) =====
function showMap(place) {
  const mapBox = document.querySelector('#map');
  if (!mapBox) return;

  if (typeof L === 'undefined') {
    mapBox.innerHTML = '<p class="map-placeholder-error">The map library could not be loaded. You can still see the destination coordinates in its quick facts.</p>';
    return;
  }

  try {
    mapBox.replaceChildren();
    const map = L.map(mapBox, { scrollWheelZoom: false }).setView([place.lat, place.lng], 13);
    addOpenStreetMapLayer(map);
    L.marker([place.lat, place.lng]).addTo(map)
      .bindPopup(`<strong>${escapeHTML(place.name)}</strong><br>${escapeHTML(place.district)} District`)
      .openPopup();
    window.setTimeout(() => map.invalidateSize(), 100);
  } catch (error) {
    mapBox.innerHTML = '<p class="map-placeholder-error">The map could not be displayed right now. Please check your connection.</p>';
  }
}

// ===== 6. DETAILS PAGE: ONE DESTINATION PER URL =====
async function initDetailsPage() {
  const container = document.querySelector('#destination');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const requestedId = Number(params.get('id') || 1);
  showLoading(container, 'Loading destination details…');

  try {
    const destinations = await loadDestinations();
    const place = destinations.find(destination => destination.id === requestedId);

    if (!place) {
      container.classList.add('not-found');
      container.innerHTML = '<div class="detail-content"><div><p class="eyebrow"><span class="eyebrow-line"></span> A little detour</p><h1>Place not found.</h1><p>That destination is not in this guide yet. Head back to the full list and choose another island stop.</p><a class="button button-dark" href="destinations.html">Browse destinations <span aria-hidden="true">↗</span></a></div></div>';
      const addButton = document.querySelector('#add-to-trip');
      if (addButton) addButton.hidden = true;
      const weatherBox = document.querySelector('#weather');
      if (weatherBox) weatherBox.replaceChildren();
      const mapBox = document.querySelector('#map');
      if (mapBox) mapBox.replaceChildren();
      return;
    }

    container.classList.remove('not-found');
    document.title = `${place.name} — Lanka Explorer`;
    const categoryClass = getCategoryClass(place.category);
    const feeBand = Number(place.entryFeeUSD) > 0 ? `<span class="fact-label">Price band · ${escapeHTML(getPriceLabel(place.entryFeeUSD))}</span>` : '';

    container.innerHTML = `
      <div class="detail-image-wrap">
        <img class="detail-hero-image" src="${escapeHTML(place.image)}" alt="${escapeHTML(place.imageAlt || place.name)}" fetchpriority="high">
        <div class="detail-image-shade" aria-hidden="true"></div>
        <div class="detail-image-caption">
          <span class="badge ${categoryClass}">${escapeHTML(place.category)}</span>
          <h1>${escapeHTML(place.name)}</h1>
          <p>${escapeHTML(place.district)} District · Sri Lanka</p>
        </div>
      </div>
      <div class="detail-content">
        <div class="detail-story">
          <p class="detail-description">${escapeHTML(place.description)}</p>
          <h2 class="detail-small-heading">Quick facts</h2>
          <ul class="detail-facts">
            <li><span class="fact-label">Entry fee · estimate</span><span class="fact-value">${escapeHTML(formatFee(place.entryFeeUSD))}${Number(place.entryFeeUSD) > 0 ? '<span id="fee-lkr"></span>' : ''}</span>${feeBand}</li>
            <li><span class="fact-label">Best time to visit</span><span class="fact-value">${escapeHTML(place.bestTime)}</span></li>
            <li><span class="fact-label">Time to allow</span><span class="fact-value">${escapeHTML(place.timeNeeded || 'Half a day')}</span></li>
          </ul>
        </div>
        <aside class="detail-side-note"><span class="side-note-icon" aria-hidden="true">✳</span><p>Save this stop to your trip and compare it with the rest of your route.</p></aside>
      </div>
    `;
    setImageFallback(container.querySelector('.detail-hero-image'));
    showWeather(place);
    showFeeInLkr(place);
    showMap(place);
    setupTripButton(place);
  } catch (error) {
    container.classList.add('not-found');
    showError(container, 'Sorry, this destination could not be loaded. Please return to the list and try again.');
    const addButton = document.querySelector('#add-to-trip');
    if (addButton) addButton.hidden = true;
  }
}

// ===== 6b. MY TRIP STORAGE (LOCALSTORAGE) =====
const TRIP_KEY = 'lankaExplorerTrip';
const TRAVELLERS_KEY = 'lankaExplorerTravellers';

function getTrip() {
  try {
    const saved = localStorage.getItem(TRIP_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(Number).filter(id => Number.isInteger(id) && id > 0))];
  } catch (error) {
    return [];
  }
}

function saveTrip(trip) {
  const cleanTrip = [...new Set(trip.map(Number).filter(id => Number.isInteger(id) && id > 0))];
  try {
    localStorage.setItem(TRIP_KEY, JSON.stringify(cleanTrip));
  } catch (error) {
    // The page continues to work until it is closed if localStorage is unavailable.
  }
  updateTripCount();
}

function isInTrip(id) {
  return getTrip().includes(Number(id));
}

function addToTrip(id) {
  const trip = getTrip();
  const numericId = Number(id);
  if (!trip.includes(numericId)) {
    trip.push(numericId);
    saveTrip(trip);
  }
}

function removeFromTrip(id) {
  saveTrip(getTrip().filter(tripId => tripId !== Number(id)));
}

function updateTripCount() {
  document.querySelectorAll('.trip-nav-link').forEach(function (link) {
    const badge = link.querySelector('.trip-count');
    if (!badge) return;
    const count = getTrip().length;
    badge.textContent = count > 0 ? String(count) : '';
    badge.setAttribute('aria-label', `${count} saved ${count === 1 ? 'place' : 'places'}`);
    link.setAttribute('aria-label', count > 0 ? `My Trip, ${count} saved ${count === 1 ? 'place' : 'places'}` : 'My Trip');
  });
}

function setupTripButton(place) {
  const button = document.querySelector('#add-to-trip');
  if (!button) return;

  const feedback = document.querySelector('#trip-feedback');
  button.hidden = false;
  button.setAttribute('aria-pressed', String(isInTrip(place.id)));

  function refreshButton() {
    const added = isInTrip(place.id);
    button.classList.toggle('is-added', added);
    button.setAttribute('aria-pressed', String(added));
    button.innerHTML = added ? '✓ In My Trip <span aria-hidden="true">−</span>' : 'Add to My Trip <span aria-hidden="true">＋</span>';
  }

  button.addEventListener('click', function () {
    if (isInTrip(place.id)) {
      removeFromTrip(place.id);
      if (feedback) feedback.textContent = `${place.name} removed from your trip.`;
    } else {
      addToTrip(place.id);
      if (feedback) feedback.textContent = `${place.name} saved to your trip.`;
    }
    refreshButton();
  });

  refreshButton();
}

// ===== 7. MY TRIP PAGE: ROUTE & BUDGET =====
async function initTripPage() {
  const tableBody = document.querySelector('#trip-table tbody');
  if (!tableBody) return;

  const summary = document.querySelector('#trip-summary');
  const travellersInput = document.querySelector('#travellers');
  const totalUsdCell = document.querySelector('#total-usd');
  const totalLkrCell = document.querySelector('#total-lkr');
  const clearButton = document.querySelector('#clear-trip');
  const budgetHighlight = document.querySelector('#budget-highlight');
  const budgetLkrHighlight = document.querySelector('#budget-lkr-highlight');
  const rateNote = document.querySelector('#rate-note');

  showLoading(summary, 'Putting your trip together…');

  let allDestinations;
  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    showError(summary, 'Your saved stops could not be loaded. Please try again.');
    return;
  }

  let rateData = null;
  try {
    rateData = await getUsdToLkrRate();
  } catch (error) {
    rateData = null;
  }

  let storedTravellers = 1;
  try {
    storedTravellers = Number(localStorage.getItem(TRAVELLERS_KEY)) || 1;
  } catch (error) {
    storedTravellers = 1;
  }
  travellersInput.value = String(Math.min(20, Math.max(1, Math.floor(storedTravellers))));

  function travellerCount() {
    return Math.min(20, Math.max(1, Math.floor(Number(travellersInput.value) || 1)));
  }

  function renderTrip() {
    const tripIds = getTrip();
    const places = allDestinations.filter(place => tripIds.includes(place.id));
    const travellers = travellerCount();
    tableBody.replaceChildren();

    if (places.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="5" class="no-results">Your trip is empty. <a href="destinations.html">Browse destinations</a> and save a few places to get started.</td>';
      tableBody.appendChild(emptyRow);
    }

    const perPersonTotal = places.reduce((sum, place) => sum + Number(place.entryFeeUSD || 0), 0);
    places.forEach(function (place) {
      const row = document.createElement('tr');
      const lkrFee = rateData ? formatLkr(Number(place.entryFeeUSD) * rateData.rate) : '—';
      row.innerHTML = `
        <td><a href="details.html?id=${encodeURIComponent(place.id)}">${escapeHTML(place.name)}</a></td>
        <td><span class="badge ${getCategoryClass(place.category)}">${escapeHTML(place.category)}</span></td>
        <td>${escapeHTML(formatFee(place.entryFeeUSD))}</td>
        <td>${escapeHTML(lkrFee)}</td>
        <td><button class="remove-btn" type="button" data-id="${Number(place.id)}" aria-label="Remove ${escapeHTML(place.name)} from trip">Remove</button></td>
      `;
      tableBody.appendChild(row);
    });

    const groupTotal = perPersonTotal * travellers;
    totalUsdCell.textContent = `USD ${groupTotal.toLocaleString('en-US')}`;
    totalLkrCell.textContent = rateData ? formatLkr(groupTotal * rateData.rate) : 'Unavailable';
    budgetHighlight.textContent = `USD ${groupTotal.toLocaleString('en-US')}`;
    budgetLkrHighlight.textContent = rateData ? formatLkr(groupTotal * rateData.rate) : 'LKR unavailable';

    const savedStops = places.length;
    summary.textContent = `${savedStops} saved ${savedStops === 1 ? 'stop' : 'stops'} · ${travellers} ${travellers === 1 ? 'traveller' : 'travellers'} · ${formatFee(perPersonTotal)} per person`;
    if (rateData) {
      const dateText = rateData.date ? ` Rate date: ${rateData.date}.` : '';
      rateNote.textContent = `1 USD ≈ ${formatLkr(rateData.rate).replace('Rs. ', 'Rs. ')}.${dateText} Approximate conversion.`;
    } else {
      rateNote.textContent = 'Currency service unavailable. USD totals are still calculated.';
    }
    clearButton.hidden = places.length === 0;
  }

  // Event delegation: one listener handles all generated Remove buttons.
  tableBody.addEventListener('click', function (event) {
    const removeButton = event.target.closest('.remove-btn');
    if (!removeButton) return;
    removeFromTrip(Number(removeButton.dataset.id));
    renderTrip();
  });

  function saveTravellerValue() {
    const count = travellerCount();
    travellersInput.value = String(count);
    try {
      localStorage.setItem(TRAVELLERS_KEY, String(count));
    } catch (error) {
      // Keep the current value in the page if browser storage is disabled.
    }
    renderTrip();
  }

  travellersInput.addEventListener('input', function () {
    if (travellersInput.value === '') {
      renderTrip();
      return;
    }
    saveTravellerValue();
  });
  travellersInput.addEventListener('change', saveTravellerValue);

  document.querySelectorAll('[data-traveller-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      const step = Number(button.dataset.travellerStep);
      travellersInput.value = String(Math.min(20, Math.max(1, travellerCount() + step)));
      saveTravellerValue();
    });
  });

  clearButton.addEventListener('click', function () {
    if (window.confirm('Remove every saved destination from your trip?')) {
      saveTrip([]);
      renderTrip();
    }
  });

  renderTrip();
}

// ===== 8. ABOUT PAGE: ENQUIRY FORM VALIDATION =====
function initEnquiryForm() {
  const form = document.querySelector('#enquiry-form');
  if (!form) return;

  const message = document.querySelector('#form-message');
  const dateInput = document.querySelector('#date');
  const textArea = document.querySelector('#message');
  const characterCount = document.querySelector('#message-count');

  if (dateInput) {
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = localToday;
  }

  function updateCharacterCount() {
    if (characterCount && textArea) characterCount.textContent = `${textArea.value.length} / 500`;
  }

  if (textArea) textArea.addEventListener('input', updateCharacterCount);
  updateCharacterCount();

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    message.replaceChildren();
    message.classList.remove('is-error');

    const name = document.querySelector('#name').value.trim();
    const email = document.querySelector('#email').value.trim();
    const date = dateInput.value;
    const travellers = Number(document.querySelector('#people').value);
    const interests = form.querySelectorAll('input[name="interest"]:checked');
    const note = textArea ? textArea.value.trim() : '';
    const errors = [];

    if (name.length < 3) errors.push('Please enter your full name (at least 3 characters).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (date) {
      const selectedDate = new Date(`${date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.push('The travel date cannot be in the past.');
    }
    if (!Number.isInteger(travellers) || travellers < 1 || travellers > 20) errors.push('Number of travellers must be between 1 and 20.');
    if (interests.length === 0) errors.push('Choose at least one travel interest.');
    if (note.length > 500) errors.push('Your note must be no longer than 500 characters.');

    if (errors.length > 0) {
      message.classList.add('is-error');
      const list = document.createElement('ul');
      errors.forEach(function (errorText) {
        const item = document.createElement('li');
        item.textContent = errorText;
        list.appendChild(item);
      });
      message.appendChild(list);
      message.focus();
      return;
    }

    message.textContent = `Thanks, ${name}! Your details passed the demo checks. This project does not send or store enquiries; connect a form service or back end to receive real messages.`;
    form.reset();
    if (dateInput) dateInput.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    updateCharacterCount();
  });
}

// ===== 9. START THE APP =====
updateTripCount();
initHomePage();
initDestinationsPage();
initDetailsPage();
initTripPage();
initEnquiryForm();

window.addEventListener('storage', function (event) {
  if (event.key === TRIP_KEY) updateTripCount();
});
