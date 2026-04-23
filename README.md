# Workout Tracker

A lightweight, zero-backend fitness tracker for logging lifting workouts and runs. Everything runs in the browser with localStorage persistence — no accounts, no server, no cost.

![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white)
![No build step](https://img.shields.io/badge/build-none-success)
![PWA ready](https://img.shields.io/badge/PWA-ready-5A0FC8)

## Features

- **Lifting + Running modes** — toggle between activity types in both the workout and history views.
- **Pre-built programs** — includes a weekly hinge / squat / pull / press rotation with optional accessory lifts.
- **Exercise substitutions** — swap in an alternative when the gym equipment is in use.
- **Progress charts** — Chart.js visualizations for both lifting (weight × reps over time) and runs (distance / pace).
- **Mobile-first UI** — responsive design with light + dark themes (CSS variables).
- **Offline-first** — all data lives in `localStorage` under the `hp_tracker_` prefix.
- **Safe DOM manipulation** — uses `createElement` + `replaceChildren` throughout, no `innerHTML` XSS surface.

## Tech stack

- Vanilla JavaScript (no framework, no build step)
- Chart.js for progress visualization
- Font Awesome for icons
- CSS variables + `[data-theme="dark"]` for theming

## Run locally

```bash
# Clone and serve the directory with anything — no build step needed.
git clone https://github.com/pgil256/tracker-app.git
cd tracker-app

# Pick your favorite static server:
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000`.

## Project structure

```
tracker-app/
├── index.html           # entry point, loads all scripts
├── css/
│   └── styles.css       # mobile-first responsive + theme variables
└── js/
    ├── data.js          # PROGRAMS, EXERCISE_SUBSTITUTIONS, OPTIONAL_EXERCISES
    ├── storage.js       # localStorage wrapper (lifts + runs)
    ├── charts.js        # Chart.js helpers for progress viz
    └── app.js           # UI rendering + event handling
```

## Architecture notes

- **No framework on purpose.** The point was to stay under the ~200 LOC threshold where a framework starts paying for itself.
- **Data flow is one-directional.** `data.js` → `storage.js` → `app.js` → `charts.js`. No shared mutable state beyond localStorage.
- **Activity type is a top-level tab.** Lifting and running share the same history view but have different schemas, so `storage.js` namespaces each under its own key.

## Roadmap

- Export to CSV
- Cloud sync (optional, likely via a Supabase backend)
- PWA install prompt + offline caching manifest
