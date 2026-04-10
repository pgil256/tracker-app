// localStorage utilities for Lifting Tracker

const STORAGE_KEYS = {
    PROGRAM: 'hp_tracker_program',
    WORKOUTS: 'hp_tracker_workouts',
    SUBSTITUTIONS: 'hp_tracker_substitutions',
    THEME: 'hp_tracker_theme',
    CURRENT_WEEK: 'hp_tracker_current_week',
    WEEKS_SINCE_DELOAD: 'hp_tracker_weeks_since_deload',
    DELOAD_DISMISSED: 'hp_tracker_deload_dismissed',
    ACTIVITY_TYPE: 'hp_tracker_activity_type',
    RUNS: 'hp_tracker_runs'
};

const Storage = {
    // Program selection
    getProgram() {
        return localStorage.getItem(STORAGE_KEYS.PROGRAM) || 'oncePerWeek';
    },

    setProgram(programId) {
        localStorage.setItem(STORAGE_KEYS.PROGRAM, programId);
    },

    // Theme
    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    },

    setTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },

    // Current week number
    getCurrentWeek() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK)) || 1;
    },

    setCurrentWeek(week) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, week.toString());
    },

    // Weeks since last deload
    getWeeksSinceDeload() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.WEEKS_SINCE_DELOAD)) || 0;
    },

    setWeeksSinceDeload(weeks) {
        localStorage.setItem(STORAGE_KEYS.WEEKS_SINCE_DELOAD, weeks.toString());
    },

    // Deload dismissed for current suggestion
    isDeloadDismissed() {
        return localStorage.getItem(STORAGE_KEYS.DELOAD_DISMISSED) === 'true';
    },

    setDeloadDismissed(dismissed) {
        localStorage.setItem(STORAGE_KEYS.DELOAD_DISMISSED, dismissed.toString());
    },

    // Exercise substitutions (permanent)
    getSubstitutions() {
        const data = localStorage.getItem(STORAGE_KEYS.SUBSTITUTIONS);
        return data ? JSON.parse(data) : {};
    },

    setSubstitution(exerciseId, newName) {
        const subs = this.getSubstitutions();
        subs[exerciseId] = newName;
        localStorage.setItem(STORAGE_KEYS.SUBSTITUTIONS, JSON.stringify(subs));
    },

    removeSubstitution(exerciseId) {
        const subs = this.getSubstitutions();
        delete subs[exerciseId];
        localStorage.setItem(STORAGE_KEYS.SUBSTITUTIONS, JSON.stringify(subs));
    },

    // Workout data
    getAllWorkouts() {
        const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
        return data ? JSON.parse(data) : [];
    },

    saveWorkout(workout) {
        const workouts = this.getAllWorkouts();
        // Add unique ID and timestamp
        workout.id = Date.now().toString();
        workout.timestamp = new Date().toISOString();
        workouts.push(workout);
        localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
        return workout;
    },

    getWorkoutsForWeek(weekNumber) {
        return this.getAllWorkouts().filter(w => w.week === weekNumber);
    },

    getWorkoutsForExercise(exerciseId) {
        const workouts = this.getAllWorkouts();
        const exerciseData = [];

        workouts.forEach(workout => {
            if (workout.exercises && workout.exercises[exerciseId]) {
                exerciseData.push({
                    week: workout.week,
                    day: workout.day,
                    date: workout.timestamp,
                    isDeload: workout.isDeload || false,
                    ...workout.exercises[exerciseId]
                });
            }
        });

        return exerciseData.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    // Get the last logged data for an exercise (for pre-filling forms)
    getLastExerciseData(exerciseId) {
        const workouts = this.getAllWorkouts()
            .filter(w => w.exercises && w.exercises[exerciseId])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (workouts.length > 0) {
            return workouts[0].exercises[exerciseId];
        }
        return null;
    },

    // Week completion
    getCompletedWeeks() {
        const workouts = this.getAllWorkouts();
        const weeks = new Set();
        workouts.forEach(w => {
            if (w.completed) weeks.add(w.week);
        });
        return Array.from(weeks).sort((a, b) => a - b);
    },

    // Stats helpers
    getProgressStats() {
        const workouts = this.getAllWorkouts();
        const stats = {
            totalWorkouts: workouts.length,
            totalWeeks: new Set(workouts.map(w => w.week)).size,
            exerciseProgress: {}
        };

        // Calculate progress per exercise
        const exerciseHistory = {};
        workouts.forEach(workout => {
            if (workout.exercises) {
                Object.entries(workout.exercises).forEach(([exerciseId, data]) => {
                    if (!exerciseHistory[exerciseId]) {
                        exerciseHistory[exerciseId] = [];
                    }
                    exerciseHistory[exerciseId].push({
                        date: workout.timestamp,
                        weight: data.weight,
                        reps: data.reps
                    });
                });
            }
        });

        // Find max weight for each exercise
        Object.entries(exerciseHistory).forEach(([exerciseId, history]) => {
            const sorted = history.sort((a, b) => new Date(a.date) - new Date(b.date));
            const maxWeight = Math.max(...history.map(h => h.weight || 0));
            const firstWeight = sorted[0]?.weight || 0;
            const lastWeight = sorted[sorted.length - 1]?.weight || 0;

            stats.exerciseProgress[exerciseId] = {
                maxWeight,
                firstWeight,
                lastWeight,
                improvement: lastWeight - firstWeight,
                entries: sorted.length
            };
        });

        return stats;
    },

    // Activity type
    getActivityType() {
        return localStorage.getItem(STORAGE_KEYS.ACTIVITY_TYPE) || 'lifting';
    },

    setActivityType(type) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_TYPE, type);
    },

    // Runs
    getAllRuns() {
        const data = localStorage.getItem(STORAGE_KEYS.RUNS);
        return data ? JSON.parse(data) : [];
    },

    saveRun(run) {
        const runs = this.getAllRuns();
        run.id = Date.now().toString();
        run.timestamp = new Date().toISOString();
        runs.push(run);
        localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs));
        return run;
    },

    getRunStats() {
        const runs = this.getAllRuns();
        const stats = {
            totalRuns: runs.length,
            totalDistance: runs.reduce((sum, r) => sum + (r.distance || 0), 0),
            bestPace: null
        };

        if (runs.length > 0) {
            const paces = runs.map(r => r.pace).filter(p => p && isFinite(p));
            if (paces.length > 0) {
                const bestPaceSeconds = Math.min(...paces);
                const mins = Math.floor(bestPaceSeconds / 60);
                const secs = Math.round(bestPaceSeconds % 60);
                stats.bestPace = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        }

        return stats;
    },

    // Clear all data (for reset)
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
