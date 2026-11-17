# Enterprise Accessible Dashboard

Semantic HTML5 & Accessible Component Architecture: a multi-page, vanilla HTML/CSS/JS admin dashboard targeting WCAG 2.1.

## Problem statement and objectives
Enterprise dashboards are often built from generic `div`s that are hard to use with a keyboard or screen reader. Objectives: strict semantic HTML5, correct DOM hierarchy, WCAG 2.1 conformance work, reusable components, responsive design.

## Technology stack
HTML5, CSS3, vanilla JavaScript, WAI-ARIA only where native HTML is not enough. No frameworks.

## Features
Dashboard stats; user list with search, filters, sortable columns, add/edit/delete with a confirmation dialog; validated add-user and settings forms (including password change); reports with date/category filters and CSV export; alerts.

**Data lives in localStorage: demonstration storage, not a secure production database. The password form stores nothing.**

## Semantic HTML and accessibility
See [docs/accessibility.md](docs/accessibility.md) for the implementation and keyboard test procedure.

## Component architecture
`components/header.html`, `sidebar.html` and `footer.html` are fetched by `js/main.js` into `data-include` placeholders on every page. Cards, tables, forms, buttons and alerts are shared CSS classes; `EAD.notify` (alerts) and `EAD.confirm` (modal) are shared helpers.

## Folder structure
`index.html`, `pages/`, `components/`, `css/`, `js/`, `assets/images/`, `docs/`.

## Run (Windows 11 PowerShell)
Components load with `fetch`, so use a local server (not double-click):

```powershell
cd semantic-dashboard
python -m http.server 8080
Start-Process http://localhost:8080
```
(or `npx serve .`)

## Validate HTML
Open https://validator.w3.org/nu/ and use "Check by text input" with each page's source. Because components are injected by JavaScript, also validate the rendered DOM (DevTools, copy outerHTML). Offline: `npx vnu-jar` (requires Java).

**Status: W3C validation pending, not yet run.**

## Screenshots
Pending: add captures to `assets/images/` and link them here.

## Future enhancements
Backend and authentication, pagination, i18n, automated axe-core tests.

## Task 05 – Dynamic JavaScript DOM Logic & RESTful API Client

The **Live catalogue** page (`pages/products.html`) demonstrates asynchronous REST API integration using the public [FakeStoreAPI](https://fakestoreapi.com/products).

### Implemented requirements
- `async`/`await` and `fetch()` retrieve product data from the REST API.
- Search filters product names, descriptions and categories as the user types.
- Category tabs are generated from the API response and filter products without a page reload.
- Sorting supports recommended order, name, ascending/descending price and rating.
- Product cart quantities are stored in `localStorage` (`eadProductCart`).
- API responses are cached in `localStorage` (`eadProductsCache`) for 10 minutes to reduce repeat requests.
- Loading skeletons, accessible status messages, error banners and cached-data fallback handle loading and network failures.
- API logic and page-specific styles are separated into `js/api.js` and `css/api-client.css`.

### Run locally
Run the project through a local HTTP server because shared page components are loaded with `fetch()`:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080/pages/products.html` in your browser. An internet connection is required for the first live API request. The page can show cached data after a previous successful request if the API is temporarily unavailable.

### Task 05 files
- `pages/products.html` – catalogue interface
- `js/api.js` – REST API client, search, category filtering, sorting, caching and cart state
- `css/api-client.css` – catalogue and loading-state styles
- `components/sidebar.html` – navigation link to the catalogue
