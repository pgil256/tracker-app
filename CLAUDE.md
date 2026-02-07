# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lifting Tracker - A fitness tracker web application for logging workouts. Static site deployable on GitHub Pages with client-side data persistence.

## Architecture

```
index.html              # Main entry point, loads all scripts
css/
  styles.css            # Mobile-first responsive styles, light/dark themes
js/
  data.js               # PROGRAMS object, EXERCISE_SUBSTITUTIONS, OPTIONAL_EXERCISES, helper functions
  storage.js            # Storage object wrapping localStorage APIs
  charts.js             # Charts object using Chart.js for progress visualization
  app.js                # App object - main application logic, DOM manipulation
```

### Key Patterns

- **No build step** - Pure static files, uses CDN for Chart.js and Font Awesome
- **Safe DOM manipulation** - Uses `createElement()` and `replaceChildren()` instead of innerHTML
- **localStorage persistence** - All user data stored with `hp_tracker_` prefix keys
- **Theme support** - CSS variables with `[data-theme="dark"]` selectors
- **Dropdown inputs** - Weight (0-100 by 5) and reps (5-20 by 1) use `<select>` dropdowns

### Data Flow

1. `data.js` defines the workout programs, substitution options, and optional exercises (static)
2. `storage.js` handles all localStorage read/write operations
3. `app.js` orchestrates UI rendering and user interactions
4. `charts.js` renders Chart.js visualizations from stored workout data

## Programs

- **Once Per Week**: Hinge, Squat, Pull, Press + optional exercises
- **Twice Per Week**: Day 1 (Hinge, Vertical Press, Vertical Pull + optional), Day 2 (Squat, Horizontal Press, Horizontal Pull + optional)

## Development Commands

```bash
# Serve locally (any static server works)
python3 -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

## Deployment

Static files only - push to GitHub and enable GitHub Pages from repository settings. No build required.

## Key Features

- **Two programs**: Once Per Week (4 core exercises) and Twice Per Week (2 days, 3 core exercises each)
- **Optional exercises**: Each workout has 1 default optional exercise slot with ability to add more (lunges, split squats, plank, leg raise, face pull, dumbbell curl, hamstring curl, calf raise)
- **Exercise substitutions**: Permanent replacements stored in localStorage via swap icon
- **Deload suggestions**: Auto-prompts every 6-8 weeks, user can accept/dismiss
- **Progress charts**: Weight and rep tracking per exercise over time
- **Week completion**: Manual marking with automatic week advancement

## Workout Data Structure

```javascript
// Stored workout object
{
  id: "timestamp",
  program: "oncePerWeek" | "twicePerWeek",
  day: 0 | 1,
  week: number,
  isDeload: boolean,
  completed: boolean,
  exercises: {
    "exercise-id": {
      weight: number,
      reps: [number, number, number],  // per set
      notes: string
    }
  }
}
```
