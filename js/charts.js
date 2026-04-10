// Chart.js integration for Lifting Tracker progress visualization

let progressChart = null;

const Charts = {
    // Initialize or update the progress chart
    renderProgressChart(canvasId, exerciseId, substitutions = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = Storage.getWorkoutsForExercise(exerciseId);

        if (data.length === 0) {
            // Show no data message
            if (progressChart) {
                progressChart.destroy();
                progressChart = null;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px system-ui';
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim() || '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No data yet. Log some workouts!', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = data.map((d, i) => `Week ${d.week}`);
        const weights = data.map(d => d.weight || 0);
        const reps = data.map(d => {
            // Sum reps from all sets
            if (Array.isArray(d.reps)) {
                return d.reps.reduce((sum, r) => sum + (r || 0), 0);
            }
            return d.reps || 0;
        });

        const exerciseName = getExerciseDisplayName(exerciseId, substitutions);

        // Destroy existing chart if any
        if (progressChart) {
            progressChart.destroy();
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#e0e0e0' : '#333';

        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Weight (lbs)',
                        data: weights,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Reps',
                        data: reps,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: exerciseName + ' Progress',
                        color: textColor,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        labels: { color: textColor }
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                if (data[idx].isDeload) {
                                    return '(Deload Week)';
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Weight (lbs)',
                            color: textColor
                        },
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Total Reps',
                            color: textColor
                        },
                        grid: { drawOnChartArea: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    },

    // Render overview stats chart
    renderOverviewChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = Storage.getProgressStats();

        const exerciseNames = [];
        const improvements = [];

        Object.entries(stats.exerciseProgress).forEach(([exerciseId, data]) => {
            if (data.entries >= 2) {
                exerciseNames.push(getExerciseDisplayName(exerciseId, Storage.getSubstitutions()));
                improvements.push(data.improvement);
            }
        });

        if (exerciseNames.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px system-ui';
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim() || '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Complete at least two workouts', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('per exercise to see progress.', canvas.width / 2, canvas.height / 2 + 14);
            return;
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#e0e0e0' : '#333';

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: exerciseNames,
                datasets: [{
                    label: 'Weight Improvement (lbs)',
                    data: improvements,
                    backgroundColor: improvements.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                    borderColor: improvements.map(v => v >= 0 ? '#10B981' : '#EF4444'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Progress by Exercise',
                        color: textColor,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                        title: {
                            display: true,
                            text: 'Weight Change (lbs)',
                            color: textColor
                        }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    },

    renderRunChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const runs = Storage.getAllRuns().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Destroy existing chart on this canvas
        const existing = Chart.getChart(canvas);
        if (existing) existing.destroy();

        if (runs.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px system-ui';
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim() || '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No runs logged yet.', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = runs.map(r => {
            const d = new Date(r.timestamp);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const paces = runs.map(r => r.pace / 60);
        const distances = runs.map(r => r.distance);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const textColor = isDark ? '#e0e0e0' : '#333';

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Pace (min/mi)',
                        data: paces,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Distance (mi)',
                        data: distances,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    title: {
                        display: true,
                        text: 'Run Progress',
                        color: textColor,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Pace (min/mi)') {
                                    const totalMins = context.raw;
                                    const mins = Math.floor(totalMins);
                                    const secs = Math.round((totalMins - mins) * 60);
                                    return `Pace: ${mins}:${secs.toString().padStart(2, '0')} /mi`;
                                }
                                return `Distance: ${context.raw} mi`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        reverse: true,
                        title: { display: true, text: 'Pace (min/mi)', color: textColor },
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                const mins = Math.floor(value);
                                const secs = Math.round((value - mins) * 60);
                                return `${mins}:${secs.toString().padStart(2, '0')}`;
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Distance (mi)', color: textColor },
                        grid: { drawOnChartArea: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    },

    destroyChart() {
        if (progressChart) {
            progressChart.destroy();
            progressChart = null;
        }
    }
};
