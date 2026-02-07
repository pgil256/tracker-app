// Main application logic for Lifting Tracker

const App = {
    currentView: 'workout',
    currentProgram: null,
    currentDay: 0,
    isDeloadWorkout: false,
    optionalExercises: [], // tracks added optional exercise selections

    init() {
        // Load theme
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);

        // Load program
        const programId = Storage.getProgram();
        this.currentProgram = PROGRAMS[programId];

        // Initialize with 1 optional exercise slot
        this.optionalExercises = [''];

        // Set up event listeners
        this.setupEventListeners();

        // Check for deload suggestion
        this.checkDeloadSuggestion();

        // Render initial view
        this.renderWorkoutView();
        this.updateNavigation();
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Program selector
        document.getElementById('program-select').addEventListener('change', (e) => {
            this.changeProgram(e.target.value);
        });

        // Day tabs (for twice per week)
        document.getElementById('day-tabs').addEventListener('click', (e) => {
            if (e.target.classList.contains('day-tab')) {
                this.switchDay(parseInt(e.target.dataset.day));
            }
        });

        // Deload toggle
        document.getElementById('deload-toggle').addEventListener('change', (e) => {
            this.isDeloadWorkout = e.target.checked;
            this.renderExerciseList();
        });

        // Save workout button
        document.getElementById('save-workout').addEventListener('click', () => {
            this.saveWorkout();
        });

        // Complete week button
        document.getElementById('complete-week').addEventListener('click', () => {
            this.completeWeek();
        });

        // Modal close
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // Exercise select in history
        document.getElementById('history-exercise-select').addEventListener('change', (e) => {
            this.renderHistoryChart(e.target.value);
        });

        // Deload banner actions
        document.getElementById('accept-deload').addEventListener('click', () => {
            this.acceptDeload();
        });

        document.getElementById('dismiss-deload').addEventListener('click', () => {
            this.dismissDeload();
        });
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.setTheme(newTheme);
        this.updateThemeIcon(newTheme);

        // Re-render charts if on history view
        if (this.currentView === 'history') {
            const select = document.getElementById('history-exercise-select');
            if (select.value) {
                this.renderHistoryChart(select.value);
            }
        }
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        this.updateNavigation();

        if (view === 'history') {
            this.renderHistoryView();
        } else if (view === 'settings') {
            this.renderSettingsView();
        } else if (view === 'workout') {
            this.renderWorkoutView();
        }
    },

    updateNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    },

    changeProgram(programId) {
        Storage.setProgram(programId);
        this.currentProgram = PROGRAMS[programId];
        this.currentDay = 0;
        this.optionalExercises = [''];
        this.renderWorkoutView();
    },

    switchDay(dayIndex) {
        this.currentDay = dayIndex;
        document.querySelectorAll('.day-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === dayIndex);
        });
        this.optionalExercises = [''];
        this.renderExerciseList();
    },

    checkDeloadSuggestion() {
        const weeksSinceDeload = Storage.getWeeksSinceDeload();
        const dismissed = Storage.isDeloadDismissed();
        const banner = document.getElementById('deload-banner');

        if (weeksSinceDeload >= 6 && !dismissed) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    },

    acceptDeload() {
        this.isDeloadWorkout = true;
        document.getElementById('deload-toggle').checked = true;
        document.getElementById('deload-banner').classList.add('hidden');
        this.renderExerciseList();
    },

    dismissDeload() {
        Storage.setDeloadDismissed(true);
        document.getElementById('deload-banner').classList.add('hidden');
    },

    renderWorkoutView() {
        const programSelect = document.getElementById('program-select');
        programSelect.value = this.currentProgram.id;

        const weekDisplay = document.getElementById('current-week');
        weekDisplay.textContent = Storage.getCurrentWeek();

        // Show/hide day tabs
        const dayTabs = document.getElementById('day-tabs');
        if (this.currentProgram.days.length > 1) {
            dayTabs.classList.remove('hidden');
            this.renderDayTabs();
        } else {
            dayTabs.classList.add('hidden');
        }

        this.renderExerciseList();
    },

    // Helper to create elements safely
    createElement(tag, attributes = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key.startsWith('data')) {
                el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child) {
                el.appendChild(child);
            }
        });
        return el;
    },

    renderDayTabs() {
        const dayTabs = document.getElementById('day-tabs');
        dayTabs.replaceChildren();

        this.currentProgram.days.forEach((day, i) => {
            const btn = this.createElement('button', {
                className: `day-tab ${i === this.currentDay ? 'active' : ''}`,
                'data-day': i.toString(),
                textContent: day.name
            });
            dayTabs.appendChild(btn);
        });
    },

    renderExerciseList() {
        const container = document.getElementById('exercise-list');
        const day = this.currentProgram.days[this.currentDay];
        const substitutions = Storage.getSubstitutions();

        container.replaceChildren();

        // Render core exercises
        day.exercises.forEach(exercise => {
            const displayName = getExerciseDisplayName(exercise.id, substitutions);
            const lastData = Storage.getLastExerciseData(exercise.id);
            const lastWeight = lastData?.weight || '';
            const suggestedWeight = this.isDeloadWorkout && lastWeight ? Math.round(lastWeight * 0.5) : lastWeight;

            const card = this.createExerciseCard(exercise, displayName, suggestedWeight, lastData);
            container.appendChild(card);
        });

        // Render optional exercises section
        const optionalSection = this.createElement('div', { className: 'optional-exercises-section' });
        const optionalHeader = this.createElement('div', { className: 'optional-header' });
        optionalHeader.appendChild(this.createElement('h3', { className: 'optional-title', textContent: 'Optional Exercises' }));

        const addBtn = this.createElement('button', { className: 'btn btn-secondary btn-add-optional' });
        addBtn.appendChild(this.createElement('i', { className: 'fas fa-plus' }));
        addBtn.appendChild(document.createTextNode(' Add Exercise'));
        addBtn.addEventListener('click', () => {
            this.optionalExercises.push('');
            this.renderExerciseList();
        });
        optionalHeader.appendChild(addBtn);
        optionalSection.appendChild(optionalHeader);

        this.optionalExercises.forEach((selectedId, index) => {
            const optCard = this.createOptionalExerciseCard(index, selectedId);
            optionalSection.appendChild(optCard);
        });

        container.appendChild(optionalSection);
    },

    createExerciseCard(exercise, displayName, suggestedWeight, lastData) {
        const card = this.createElement('div', { className: 'exercise-card', 'data-exercise-id': exercise.id });

        // Header
        const header = this.createElement('div', { className: 'exercise-header' });
        const info = this.createElement('div', { className: 'exercise-info' });
        info.appendChild(this.createElement('h3', { className: 'exercise-name', textContent: displayName }));
        info.appendChild(this.createElement('span', { className: 'exercise-prescription', textContent: formatSetsReps(exercise) }));
        header.appendChild(info);

        const subBtn = this.createElement('button', {
            className: 'btn-icon substitute-btn',
            'data-exercise-id': exercise.id,
            title: 'Substitute exercise'
        });
        const subIcon = this.createElement('i', { className: 'fas fa-exchange-alt' });
        subBtn.appendChild(subIcon);
        subBtn.addEventListener('click', () => this.showSubstituteModal(exercise.id));
        header.appendChild(subBtn);
        card.appendChild(header);

        // Inputs
        const inputs = this.createElement('div', { className: 'exercise-inputs' });

        // Weight dropdown (0-100 by 5)
        const weightGroup = this.createElement('div', { className: 'input-group' });
        weightGroup.appendChild(this.createElement('label', { textContent: 'Weight (lbs)' }));
        const weightSelect = this.createElement('select', {
            className: 'weight-input',
            'data-exercise-id': exercise.id
        });
        for (let w = 0; w <= 100; w += 5) {
            const opt = this.createElement('option', { value: w.toString(), textContent: w.toString() });
            const swNum = typeof suggestedWeight === 'number' ? suggestedWeight : parseInt(suggestedWeight) || 0;
            // Snap to nearest 5
            const snapped = Math.round(swNum / 5) * 5;
            if (w === snapped) {
                opt.selected = true;
            }
            weightSelect.appendChild(opt);
        }
        weightGroup.appendChild(weightSelect);
        inputs.appendChild(weightGroup);

        // Sets container with rep dropdowns (5-20 by 1)
        const setsContainer = this.createElement('div', { className: 'sets-container' });
        for (let i = 0; i < exercise.sets; i++) {
            const lastReps = lastData?.reps?.[i] || '';
            const setGroup = this.createElement('div', { className: 'input-group set-input' });
            setGroup.appendChild(this.createElement('label', { textContent: `Set ${i + 1}` }));
            const repsSelect = this.createElement('select', {
                className: 'reps-input',
                'data-exercise-id': exercise.id,
                'data-set': i.toString()
            });
            // Empty default option
            const emptyOpt = this.createElement('option', { value: '', textContent: '-' });
            repsSelect.appendChild(emptyOpt);
            for (let r = 5; r <= 20; r++) {
                const opt = this.createElement('option', { value: r.toString(), textContent: r.toString() });
                if (lastReps && parseInt(lastReps) === r) {
                    opt.selected = true;
                }
                repsSelect.appendChild(opt);
            }
            setGroup.appendChild(repsSelect);
            setsContainer.appendChild(setGroup);
        }
        inputs.appendChild(setsContainer);
        card.appendChild(inputs);

        // Notes
        const notesGroup = this.createElement('div', { className: 'input-group notes-group' });
        notesGroup.appendChild(this.createElement('label', { textContent: 'Notes' }));
        const notesInput = this.createElement('input', {
            type: 'text',
            className: 'notes-input',
            'data-exercise-id': exercise.id,
            placeholder: 'Optional notes...',
            value: lastData?.notes || ''
        });
        notesGroup.appendChild(notesInput);
        card.appendChild(notesGroup);

        return card;
    },

    createOptionalExerciseCard(index, selectedId) {
        const card = this.createElement('div', { className: 'exercise-card optional-card', 'data-optional-index': index.toString() });

        // Header with exercise selector and remove button
        const header = this.createElement('div', { className: 'exercise-header' });

        const selectWrapper = this.createElement('div', { className: 'exercise-info' });
        const exerciseSelect = this.createElement('select', {
            className: 'optional-exercise-select',
            'data-optional-index': index.toString()
        });
        const defaultOpt = this.createElement('option', { value: '', textContent: 'Select an exercise...' });
        exerciseSelect.appendChild(defaultOpt);
        OPTIONAL_EXERCISES.forEach(ex => {
            const opt = this.createElement('option', { value: ex.id, textContent: ex.name });
            if (selectedId === ex.id) {
                opt.selected = true;
            }
            exerciseSelect.appendChild(opt);
        });
        exerciseSelect.addEventListener('change', (e) => {
            this.optionalExercises[index] = e.target.value;
            // Re-render just this card's inputs
            this.updateOptionalCardInputs(card, index, e.target.value);
        });
        selectWrapper.appendChild(exerciseSelect);
        header.appendChild(selectWrapper);

        // Remove button (only if more than 1 optional)
        const removeBtn = this.createElement('button', {
            className: 'btn-icon remove-optional-btn',
            title: 'Remove optional exercise'
        });
        removeBtn.appendChild(this.createElement('i', { className: 'fas fa-times' }));
        removeBtn.addEventListener('click', () => {
            this.optionalExercises.splice(index, 1);
            if (this.optionalExercises.length === 0) {
                this.optionalExercises = [''];
            }
            this.renderExerciseList();
        });
        header.appendChild(removeBtn);
        card.appendChild(header);

        // If an exercise is selected, show weight/rep inputs
        if (selectedId) {
            this.appendOptionalInputs(card, index, selectedId);
        }

        return card;
    },

    updateOptionalCardInputs(card, index, exerciseId) {
        // Remove existing inputs and notes if any
        const existingInputs = card.querySelector('.exercise-inputs');
        const existingNotes = card.querySelector('.notes-group');
        if (existingInputs) existingInputs.remove();
        if (existingNotes) existingNotes.remove();

        if (exerciseId) {
            this.appendOptionalInputs(card, index, exerciseId);
        }
    },

    appendOptionalInputs(card, index, exerciseId) {
        const lastData = Storage.getLastExerciseData(exerciseId);
        const lastWeight = lastData?.weight || 0;
        const suggestedWeight = this.isDeloadWorkout && lastWeight ? Math.round(lastWeight * 0.5) : lastWeight;

        const inputs = this.createElement('div', { className: 'exercise-inputs' });

        // Weight dropdown
        const weightGroup = this.createElement('div', { className: 'input-group' });
        weightGroup.appendChild(this.createElement('label', { textContent: 'Weight (lbs)' }));
        const weightSelect = this.createElement('select', {
            className: 'weight-input',
            'data-optional-index': index.toString()
        });
        for (let w = 0; w <= 100; w += 5) {
            const opt = this.createElement('option', { value: w.toString(), textContent: w.toString() });
            const swNum = typeof suggestedWeight === 'number' ? suggestedWeight : parseInt(suggestedWeight) || 0;
            const snapped = Math.round(swNum / 5) * 5;
            if (w === snapped) {
                opt.selected = true;
            }
            weightSelect.appendChild(opt);
        }
        weightGroup.appendChild(weightSelect);
        inputs.appendChild(weightGroup);

        // 3 sets of rep dropdowns
        const setsContainer = this.createElement('div', { className: 'sets-container' });
        for (let i = 0; i < 3; i++) {
            const lastReps = lastData?.reps?.[i] || '';
            const setGroup = this.createElement('div', { className: 'input-group set-input' });
            setGroup.appendChild(this.createElement('label', { textContent: `Set ${i + 1}` }));
            const repsSelect = this.createElement('select', {
                className: 'reps-input',
                'data-optional-index': index.toString(),
                'data-set': i.toString()
            });
            const emptyOpt = this.createElement('option', { value: '', textContent: '-' });
            repsSelect.appendChild(emptyOpt);
            for (let r = 5; r <= 20; r++) {
                const opt = this.createElement('option', { value: r.toString(), textContent: r.toString() });
                if (lastReps && parseInt(lastReps) === r) {
                    opt.selected = true;
                }
                repsSelect.appendChild(opt);
            }
            setGroup.appendChild(repsSelect);
            setsContainer.appendChild(setGroup);
        }
        inputs.appendChild(setsContainer);
        card.appendChild(inputs);

        // Notes
        const notesGroup = this.createElement('div', { className: 'input-group notes-group' });
        notesGroup.appendChild(this.createElement('label', { textContent: 'Notes' }));
        const notesInput = this.createElement('input', {
            type: 'text',
            className: 'notes-input',
            'data-optional-index': index.toString(),
            placeholder: 'Optional notes...',
            value: lastData?.notes || ''
        });
        notesGroup.appendChild(notesInput);
        card.appendChild(notesGroup);
    },

    showSubstituteModal(exerciseId) {
        const modal = document.getElementById('substitute-modal');
        const alternatives = EXERCISE_SUBSTITUTIONS[exerciseId] || [];
        const substitutions = Storage.getSubstitutions();
        const currentSub = substitutions[exerciseId];

        // Find original exercise name
        let originalName = exerciseId;
        for (const program of Object.values(PROGRAMS)) {
            for (const day of program.days) {
                const ex = day.exercises.find(e => e.id === exerciseId);
                if (ex) {
                    originalName = ex.name;
                    break;
                }
            }
        }

        const content = document.getElementById('substitute-options');
        content.replaceChildren();

        // Original option
        const originalOption = this.createSubstituteOption(exerciseId, '', originalName, !currentSub, true);
        content.appendChild(originalOption);

        // Alternative options
        alternatives.forEach(alt => {
            const option = this.createSubstituteOption(exerciseId, alt.name, alt.name, currentSub === alt.name, false);
            content.appendChild(option);
        });

        modal.classList.add('active');
    },

    createSubstituteOption(exerciseId, name, displayName, isSelected, isOriginal) {
        const option = this.createElement('div', {
            className: `substitute-option ${isSelected ? 'selected' : ''}`,
            'data-exercise-id': exerciseId,
            'data-name': name
        });
        option.appendChild(this.createElement('span', { textContent: displayName }));
        if (isOriginal) {
            option.appendChild(this.createElement('span', { className: 'original-badge', textContent: 'Original' }));
        }
        option.addEventListener('click', () => {
            if (name) {
                Storage.setSubstitution(exerciseId, name);
            } else {
                Storage.removeSubstitution(exerciseId);
            }
            this.closeModal();
            this.renderExerciseList();
        });
        return option;
    },

    closeModal() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    },

    saveWorkout() {
        const day = this.currentProgram.days[this.currentDay];
        const workout = {
            program: this.currentProgram.id,
            day: this.currentDay,
            dayName: day.name,
            week: Storage.getCurrentWeek(),
            isDeload: this.isDeloadWorkout,
            completed: false,
            exercises: {}
        };

        let hasData = false;

        // Save core exercises
        day.exercises.forEach(exercise => {
            const weightInput = document.querySelector(`select.weight-input[data-exercise-id="${exercise.id}"]`);
            const repsInputs = document.querySelectorAll(`select.reps-input[data-exercise-id="${exercise.id}"]`);
            const notesInput = document.querySelector(`.notes-input[data-exercise-id="${exercise.id}"]`);

            const weight = parseFloat(weightInput.value) || 0;
            const reps = Array.from(repsInputs).map(input => parseInt(input.value) || 0);
            const notes = notesInput.value.trim();

            if (weight > 0 || reps.some(r => r > 0)) {
                hasData = true;
                workout.exercises[exercise.id] = { weight, reps, notes };
            }
        });

        // Save optional exercises
        this.optionalExercises.forEach((exerciseId, index) => {
            if (!exerciseId) return;

            const weightInput = document.querySelector(`select.weight-input[data-optional-index="${index}"]`);
            const repsInputs = document.querySelectorAll(`select.reps-input[data-optional-index="${index}"]`);
            const notesInput = document.querySelector(`.notes-input[data-optional-index="${index}"]`);

            if (!weightInput) return;

            const weight = parseFloat(weightInput.value) || 0;
            const reps = Array.from(repsInputs).map(input => parseInt(input.value) || 0);
            const notes = notesInput ? notesInput.value.trim() : '';

            if (weight > 0 || reps.some(r => r > 0)) {
                hasData = true;
                workout.exercises[exerciseId] = { weight, reps, notes };
            }
        });

        if (!hasData) {
            this.showToast('Please log at least one exercise', 'error');
            return;
        }

        Storage.saveWorkout(workout);
        this.showToast('Workout saved!', 'success');

        // Reset deload toggle
        this.isDeloadWorkout = false;
        document.getElementById('deload-toggle').checked = false;
    },

    completeWeek() {
        const currentWeek = Storage.getCurrentWeek();
        const weeksSinceDeload = Storage.getWeeksSinceDeload();

        // Mark current week workouts as completed
        const workouts = Storage.getAllWorkouts();
        let weekHasWorkouts = false;

        workouts.forEach(w => {
            if (w.week === currentWeek) {
                w.completed = true;
                weekHasWorkouts = true;
            }
        });

        if (!weekHasWorkouts) {
            this.showToast('No workouts logged for this week', 'error');
            return;
        }

        localStorage.setItem('hp_tracker_workouts', JSON.stringify(workouts));

        // Check if this was a deload week
        const wasDeload = workouts.some(w => w.week === currentWeek && w.isDeload);

        if (wasDeload) {
            Storage.setWeeksSinceDeload(0);
        } else {
            Storage.setWeeksSinceDeload(weeksSinceDeload + 1);
        }

        // Reset deload dismissed flag
        Storage.setDeloadDismissed(false);

        // Advance week
        Storage.setCurrentWeek(currentWeek + 1);

        // Update UI
        document.getElementById('current-week').textContent = Storage.getCurrentWeek();
        this.checkDeloadSuggestion();
        this.showToast(`Week ${currentWeek} completed!`, 'success');
    },

    renderHistoryView() {
        const select = document.getElementById('history-exercise-select');
        const substitutions = Storage.getSubstitutions();

        // Populate exercise dropdown with all exercises from both programs + optional
        const allExercises = new Map();
        Object.values(PROGRAMS).forEach(program => {
            program.days.forEach(day => {
                day.exercises.forEach(ex => {
                    if (!allExercises.has(ex.id)) {
                        allExercises.set(ex.id, getExerciseDisplayName(ex.id, substitutions));
                    }
                });
            });
        });
        OPTIONAL_EXERCISES.forEach(ex => {
            if (!allExercises.has(ex.id)) {
                allExercises.set(ex.id, ex.name);
            }
        });

        select.replaceChildren();
        const defaultOption = this.createElement('option', { value: '', textContent: 'Select an exercise...' });
        select.appendChild(defaultOption);

        Array.from(allExercises.entries()).forEach(([id, name]) => {
            const option = this.createElement('option', { value: id, textContent: name });
            select.appendChild(option);
        });

        // Render stats
        this.renderHistoryStats();
    },

    renderHistoryStats() {
        const stats = Storage.getProgressStats();
        const container = document.getElementById('history-stats');

        container.replaceChildren();

        const statItems = [
            { value: stats.totalWorkouts, label: 'Total Workouts' },
            { value: stats.totalWeeks, label: 'Weeks Tracked' },
            { value: Object.keys(stats.exerciseProgress).length, label: 'Exercises Logged' }
        ];

        statItems.forEach(item => {
            const card = this.createElement('div', { className: 'stat-card' });
            card.appendChild(this.createElement('div', { className: 'stat-value', textContent: item.value.toString() }));
            card.appendChild(this.createElement('div', { className: 'stat-label', textContent: item.label }));
            container.appendChild(card);
        });

        // Render overview chart
        Charts.renderOverviewChart('overview-chart');
    },

    renderHistoryChart(exerciseId) {
        if (!exerciseId) return;
        const substitutions = Storage.getSubstitutions();
        Charts.renderProgressChart('progress-chart', exerciseId, substitutions);
    },

    renderSettingsView() {
        const substitutions = Storage.getSubstitutions();
        const container = document.getElementById('substitutions-list');

        const subEntries = Object.entries(substitutions);
        container.replaceChildren();

        if (subEntries.length === 0) {
            const noData = this.createElement('p', {
                className: 'no-data',
                textContent: 'No substitutions set. Tap the swap icon on any exercise to substitute it.'
            });
            container.appendChild(noData);
            return;
        }

        subEntries.forEach(([exerciseId, newName]) => {
            // Find original name
            let originalName = exerciseId;
            for (const program of Object.values(PROGRAMS)) {
                for (const day of program.days) {
                    const ex = day.exercises.find(e => e.id === exerciseId);
                    if (ex) {
                        originalName = ex.name;
                        break;
                    }
                }
            }

            const item = this.createElement('div', { className: 'substitution-item' });
            const info = this.createElement('div', { className: 'substitution-info' });
            info.appendChild(this.createElement('span', { className: 'original-exercise', textContent: originalName }));
            const arrow = this.createElement('i', { className: 'fas fa-arrow-right' });
            info.appendChild(arrow);
            info.appendChild(this.createElement('span', { className: 'new-exercise', textContent: newName }));
            item.appendChild(info);

            const removeBtn = this.createElement('button', {
                className: 'btn-icon remove-sub',
                'data-exercise-id': exerciseId,
                title: 'Remove substitution'
            });
            const removeIcon = this.createElement('i', { className: 'fas fa-times' });
            removeBtn.appendChild(removeIcon);
            removeBtn.addEventListener('click', () => {
                Storage.removeSubstitution(exerciseId);
                this.renderSettingsView();
                this.showToast('Substitution removed', 'success');
            });
            item.appendChild(removeBtn);

            container.appendChild(item);
        });
    },

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
