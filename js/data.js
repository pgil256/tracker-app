// Lifting Tracker Program Data and Exercise Substitutions

const PROGRAMS = {
    oncePerWeek: {
        id: 'oncePerWeek',
        name: 'Once Per Week',
        days: [
            {
                name: 'Full Body',
                exercises: [
                    { id: 'hinge', name: 'Romanian Deadlift', category: 'hinge', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'squat', name: 'Goblet Squat', category: 'squat', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'pull', name: 'Dumbbell Row', category: 'pull', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'press', name: 'Single Arm Press', category: 'press', sets: 3, repsMin: 5, repsMax: 20 }
                ]
            }
        ]
    },
    twicePerWeek: {
        id: 'twicePerWeek',
        name: 'Twice Per Week',
        days: [
            {
                name: 'Day 1',
                exercises: [
                    { id: 'hinge', name: 'Romanian Deadlift', category: 'hinge', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'v-press', name: 'Single Arm Press', category: 'v-press', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'v-pull', name: 'Pull-up', category: 'v-pull', sets: 3, repsMin: 5, repsMax: 20 }
                ]
            },
            {
                name: 'Day 2',
                exercises: [
                    { id: 'squat', name: 'Goblet Squat', category: 'squat', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'h-press', name: 'Push-up', category: 'h-press', sets: 3, repsMin: 5, repsMax: 20 },
                    { id: 'h-pull', name: 'Dumbbell Row', category: 'h-pull', sets: 3, repsMin: 5, repsMax: 20 }
                ]
            }
        ]
    }
};

const EXERCISE_SUBSTITUTIONS = {
    'squat': [
        { id: 'barbell-squat', name: 'Barbell Squat' },
        { id: 'leg-press', name: 'Leg Press' },
        { id: 'hack-squat', name: 'Hack Squat' }
    ],
    'hinge': [
        { id: 'hip-thrust', name: 'Hip Thrust' },
        { id: 'barbell-deadlift', name: 'Barbell Deadlift' },
        { id: 'back-extension', name: 'Back Extension' }
    ],
    'press': [
        { id: 'seated-dumbbell-press', name: 'Seated Dumbbell Press' }
    ],
    'pull': [
        { id: 'lat-pulldown', name: 'Lat Pulldown' }
    ],
    'v-press': [
        { id: 'seated-dumbbell-press', name: 'Seated Dumbbell Press' }
    ],
    'h-press': [
        { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press' }
    ],
    'v-pull': [
        { id: 'lat-pulldown', name: 'Lat Pulldown' }
    ],
    'h-pull': [
        { id: 'inverted-row', name: 'Inverted Row' }
    ]
};

const OPTIONAL_EXERCISES = [
    { id: 'lunges', name: 'Lunges' },
    { id: 'split-squats', name: 'Split Squats' },
    { id: 'plank', name: 'Plank' },
    { id: 'leg-raise', name: 'Leg Raise' },
    { id: 'face-pull', name: 'Face Pull' },
    { id: 'dumbbell-curl', name: 'Dumbbell Curl' },
    { id: 'hamstring-curl', name: 'Hamstring Curl' },
    { id: 'calf-raise', name: 'Calf Raise' }
];

// Get exercise display name (accounting for substitutions)
function getExerciseDisplayName(exerciseId, substitutions = {}) {
    if (substitutions[exerciseId]) {
        return substitutions[exerciseId];
    }
    // Find original name from programs
    for (const program of Object.values(PROGRAMS)) {
        for (const day of program.days) {
            const exercise = day.exercises.find(e => e.id === exerciseId);
            if (exercise) return exercise.name;
        }
    }
    // Check optional exercises
    const optional = OPTIONAL_EXERCISES.find(e => e.id === exerciseId);
    if (optional) return optional.name;
    return exerciseId;
}

// Format sets x reps string
function formatSetsReps(exercise) {
    const suffix = exercise.perSide ? ' ea' : '';
    if (exercise.repsMin === exercise.repsMax) {
        return `${exercise.sets} × ${exercise.repsMin}${suffix}`;
    }
    return `${exercise.sets} × ${exercise.repsMin}-${exercise.repsMax}${suffix}`;
}
