// EcoPulse Application Logic

// Initial State
let state = {
    isOnboarded: false,
    footprint: {
        energy: 0,
        transport: 0,
        diet: 0,
        waste: 0
    },
    actions: [
        { id: 1, category: 'energy', title: 'Lower Thermostat by 1°C', desc: 'Reduce space heating energy.', savings: 0.45, xp: 40, completed: false },
        { id: 2, category: 'transport', title: 'Commute via Public Transit/Bike', desc: 'Leave the car at home.', savings: 1.2, xp: 80, completed: false },
        { id: 3, category: 'diet', title: 'Eat Plant-Based Today', desc: 'Zero meat and dairy products.', savings: 0.8, xp: 60, completed: false },
        { id: 4, category: 'waste', title: 'Line Dry Clothes', desc: 'Avoid using the high-energy clothes dryer.', savings: 0.35, xp: 30, completed: false },
        { id: 5, category: 'energy', title: 'Unplug Idle Electronics', desc: 'Prevent phantom energy draw.', savings: 0.15, xp: 20, completed: false },
        { id: 6, category: 'waste', title: 'Compost Organic Waste', desc: 'Avoid food waste rotting in landfills.', savings: 0.25, xp: 35, completed: false }
    ],
    logs: [],
    xp: 0,
    streak: 0,
    lastLogDate: null
};

// Global Chart variables
let compositionChart = null;
let trendChart = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupNavigation();
    setupQuiz();
    setupLogForm();
    setupActions();
    setupAssistant();
    renderApp();
});

// Load state from LocalStorage
function loadState() {
    const savedState = localStorage.getItem('ecopulse_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
        } catch (e) {
            console.error('Error parsing local storage state, using default.', e);
        }
    }
}

// Save state to LocalStorage
function saveState() {
    localStorage.setItem('ecopulse_state', JSON.stringify(state));
}

// Navigation & Tab Switching
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!state.isOnboarded) return; // Prevent navigation until onboarded
            
            navButtons.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.add('hidden'));

            btn.classList.add('active');
            const activeTab = document.getElementById(btn.dataset.tab);
            if (activeTab) {
                activeTab.classList.remove('hidden');
                if (btn.dataset.tab === 'dashboard-tab') {
                    // Force chart redraw
                    initCharts();
                }
            }
        });
    });
}

// Onboarding Quiz Logic
function setupQuiz() {
    const quizSection = document.getElementById('onboarding-section');
    const quizSteps = document.querySelectorAll('.quiz-step');
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    
    let currentStep = 1;
    let selectedValues = {
        energy: null,
        transport: null,
        diet: null,
        waste: null
    };

    // Handle Option Clicks
    quizSteps.forEach(step => {
        const optionButtons = step.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                optionButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                const val = parseFloat(btn.dataset.value);
                const category = btn.dataset.category;
                selectedValues[category] = val;
                
                nextBtn.removeAttribute('disabled');
            });
        });
    });

    // Navigation buttons
    nextBtn.addEventListener('click', () => {
        if (currentStep < 4) {
            quizSteps[currentStep - 1].classList.remove('active');
            currentStep++;
            quizSteps[currentStep - 1].classList.add('active');
            
            prevBtn.removeAttribute('disabled');
            
            // Check if next step already has a selection
            const activeCategory = quizSteps[currentStep - 1].querySelector('.option-btn').dataset.category;
            if (selectedValues[activeCategory] !== null) {
                nextBtn.removeAttribute('disabled');
            } else {
                nextBtn.setAttribute('disabled', 'true');
            }
        } else {
            // Complete Onboarding
            state.footprint = { ...selectedValues };
            state.isOnboarded = true;
            state.logs.push({
                id: Date.now(),
                category: 'System',
                description: 'Onboarding Baseline Calculated',
                value: 0,
                date: new Date().toISOString().split('T')[0],
                isSystem: true
            });
            saveState();
            
            quizSection.classList.add('hidden');
            document.getElementById('dashboard-tab').classList.remove('hidden');
            document.getElementById('nav-dashboard').classList.add('active');
            
            renderApp();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            quizSteps[currentStep - 1].classList.remove('active');
            currentStep--;
            quizSteps[currentStep - 1].classList.add('active');
            
            nextBtn.removeAttribute('disabled');
            if (currentStep === 1) {
                prevBtn.setAttribute('disabled', 'true');
            }
        }
    });
}

// Setup Daily reduction actions
function setupActions() {
    const container = document.getElementById('actions-container');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Filter implementation
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderActions(btn.dataset.filter);
        });
    });
}

function renderActions(filter = 'all') {
    const container = document.getElementById('actions-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = state.actions.filter(act => filter === 'all' || act.category === filter);

    filtered.forEach(act => {
        const card = document.createElement('div');
        card.className = `card action-card ${act.category}`;
        card.innerHTML = `
            <div>
                <div class="action-card-header">
                    <span class="action-category-tag">${act.category}</span>
                    <span class="action-impact-tag">+${act.xp} XP</span>
                </div>
                <h4 class="action-title">${act.title}</h4>
                <p class="action-description">${act.desc}</p>
            </div>
            <div class="action-card-footer">
                <div class="action-savings">
                    <span class="savings-label">Est. Savings</span>
                    <span class="savings-value">-${act.savings} t CO₂e/yr</span>
                </div>
                <button class="primary-btn action-check-btn" data-id="${act.id}">
                    ${act.completed ? '✓ Active' : 'Commit'}
                </button>
            </div>
        `;

        // Check button event listener
        const btn = card.querySelector('.action-check-btn');
        if (act.completed) {
            btn.style.backgroundColor = 'var(--color-success)';
            btn.style.color = '#131412';
        }
        
        btn.addEventListener('click', () => {
            toggleAction(act.id);
        });

        container.appendChild(card);
    });
}

function toggleAction(id) {
    const actionIndex = state.actions.findIndex(a => a.id === id);
    if (actionIndex !== -1) {
        const act = state.actions[actionIndex];
        act.completed = !act.completed;

        if (act.completed) {
            state.xp += act.xp;
            // Subtract temporary footprint reduction
            state.footprint[act.category] = Math.max(0, state.footprint[act.category] - (act.savings / 12)); // Monthly savings fraction
            state.streak = Math.min(30, state.streak + 1);
        } else {
            state.xp = Math.max(0, state.xp - act.xp);
            state.footprint[act.category] = state.footprint[act.category] + (act.savings / 12);
        }

        saveState();
        renderApp();
    }
}

// Log Activity Tab logic
function setupLogForm() {
    const categorySelect = document.getElementById('log-category');
    const dynamicField = document.getElementById('log-dynamic-field');
    const logForm = document.getElementById('daily-log-form');
    const clearBtn = document.getElementById('clear-logs-btn');
    
    // Set date input to today
    document.getElementById('log-date').value = new Date().toISOString().split('T')[0];

    const fields = {
        transport: `
            <label for="log-input-value">Distance Travelled (miles)</label>
            <input type="number" id="log-input-value" min="1" step="any" placeholder="e.g. 15" required>
            <label for="log-sub-type" style="margin-top: 1rem;">Commute Mode</label>
            <select id="log-sub-type" required>
                <option value="petrol">Petrol / Diesel Car</option>
                <option value="electric">Electric Vehicle (EV)</option>
                <option value="transit">Public Bus / Train</option>
            </select>
        `,
        diet: `
            <label for="log-sub-type">Diet / Meal Choice</label>
            <select id="log-sub-type" required>
                <option value="beef">Red Meat (Beef/Pork Meal)</option>
                <option value="chicken">Poultry / Fish Meal</option>
                <option value="veggie">Vegetarian Meal</option>
                <option value="vegan">Vegan Meal</option>
            </select>
        `,
        energy: `
            <label for="log-input-value">Electricity/Utility Usage (kWh)</label>
            <input type="number" id="log-input-value" min="0.1" step="any" placeholder="e.g. 12" required>
        `,
        waste: `
            <label for="log-sub-type">Waste Recycled / Composted</label>
            <select id="log-sub-type" required>
                <option value="compost">Composted organic waste</option>
                <option value="recycle">Recycled paper/plastic/glass</option>
                <option value="landfill">Standard landfill trash bag</option>
            </select>
        `
    };

    // Handle change event
    categorySelect.addEventListener('change', () => {
        dynamicField.innerHTML = fields[categorySelect.value] || '';
    });

    // Initialize with transport fields
    dynamicField.innerHTML = fields.transport;

    // Handle form submit
    logForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const category = categorySelect.value;
        const date = document.getElementById('log-date').value;
        const subType = document.getElementById('log-sub-type') ? document.getElementById('log-sub-type').value : '';
        const rawValue = document.getElementById('log-input-value') ? parseFloat(document.getElementById('log-input-value').value) : 1;
        
        let calculatedEmissions = 0;
        let desc = '';

        if (category === 'transport') {
            if (subType === 'petrol') {
                calculatedEmissions = rawValue * 0.411; // kg CO2 per mile
                desc = `Drove petrol car (${rawValue} mi)`;
            } else if (subType === 'electric') {
                calculatedEmissions = rawValue * 0.12; 
                desc = `Drove electric vehicle (${rawValue} mi)`;
            } else {
                calculatedEmissions = rawValue * 0.08; 
                desc = `Used public transit (${rawValue} mi)`;
            }
        } else if (category === 'diet') {
            if (subType === 'beef') {
                calculatedEmissions = 7.2; // kg CO2
                desc = `Red meat meal (Beef/Pork)`;
            } else if (subType === 'chicken') {
                calculatedEmissions = 2.4;
                desc = `Poultry / Fish meal`;
            } else if (subType === 'veggie') {
                calculatedEmissions = 1.1;
                desc = `Vegetarian meal`;
            } else {
                calculatedEmissions = 0.5;
                desc = `Vegan plant-based meal`;
            }
        } else if (category === 'energy') {
            calculatedEmissions = rawValue * 0.385; // kg CO2 per kWh
            desc = `Utility Electricity (${rawValue} kWh)`;
        } else if (category === 'waste') {
            if (subType === 'compost') {
                calculatedEmissions = -0.5; // Saving credit
                desc = `Composted organic waste`;
            } else if (subType === 'recycle') {
                calculatedEmissions = -0.3;
                desc = `Recycled recyclables`;
            } else {
                calculatedEmissions = 1.5;
                desc = `Disposed landfill trash`;
            }
        }

        // Add Log Item
        state.logs.unshift({
            id: Date.now(),
            category,
            description: desc,
            value: calculatedEmissions,
            date
        });

        // Add XP for logging
        state.xp += 10;
        
        // Save and re-render
        saveState();
        renderApp();
        
        // Reset form inputs (keep date)
        if (document.getElementById('log-input-value')) {
            document.getElementById('log-input-value').value = '';
        }
    });

    // Clear Logs
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire log history?')) {
            state.logs = state.logs.filter(l => l.isSystem);
            saveState();
            renderApp();
        }
    });
}

function renderLogHistory() {
    const listContainer = document.getElementById('log-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const nonSystemLogs = state.logs.filter(l => !l.isSystem);

    if (nonSystemLogs.length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No logged activities yet.</p>`;
        return;
    }

    nonSystemLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        
        let icon = '📝';
        if (log.category === 'transport') icon = '🚗';
        if (log.category === 'diet') icon = '🥗';
        if (log.category === 'energy') icon = '🔌';
        if (log.category === 'waste') icon = '♻️';

        const isSaving = log.value < 0;
        const valText = isSaving ? `${log.value.toFixed(2)} kg CO₂e` : `+${log.value.toFixed(2)} kg CO₂e`;
        const valClass = isSaving ? 'saving' : '';

        item.innerHTML = `
            <div class="log-item-left">
                <span class="log-item-icon">${icon}</span>
                <div class="log-item-details">
                    <span class="log-item-title">${log.description}</span>
                    <span class="log-item-meta">${log.date} • ${log.category}</span>
                </div>
            </div>
            <div class="log-item-right">
                <span class="log-item-value ${valClass}">${valText}</span>
                <button class="delete-log-btn" data-id="${log.id}">🗑️</button>
            </div>
        `;

        item.querySelector('.delete-log-btn').addEventListener('click', () => {
            deleteLog(log.id);
        });

        listContainer.appendChild(item);
    });
}

function deleteLog(id) {
    const log = state.logs.find(l => l.id === id);
    if (log) {
        state.xp = Math.max(0, state.xp - 10);
        state.logs = state.logs.filter(l => l.id !== id);
        saveState();
        renderApp();
    }
}

// AI Assistant / chatbot logic
function setupAssistant() {
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-user-input');
    const chips = document.querySelectorAll('.chip-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = input.value.trim();
        if (msg) {
            handleUserMessage(msg);
            input.value = '';
        }
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            handleUserMessage(chip.dataset.query);
        });
    });
}

function handleUserMessage(msg) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'message user-msg';
    userDiv.innerHTML = `<p>${msg}</p>`;
    container.appendChild(userDiv);
    
    // Auto Scroll
    container.scrollTop = container.scrollHeight;

    // Simulated Assistant typing latency
    setTimeout(() => {
        const reply = getAssistantResponse(msg.toLowerCase());
        const assistantDiv = document.createElement('div');
        assistantDiv.className = 'message assistant-msg';
        assistantDiv.innerHTML = `<p>${reply}</p>`;
        container.appendChild(assistantDiv);
        container.scrollTop = container.scrollHeight;
    }, 450);
}

function getAssistantResponse(query) {
    if (query.includes('transport') || query.includes('car') || query.includes('commute')) {
        return `🚗 **Transportation Insights:** Commuting is typically the largest slice of an individual's carbon footprint. 
        Replacing petrol driving with a bike or public transit saves roughly 0.41 kg of CO2 *per mile*. If you commute 15 miles daily, switching to transit reduces your annual footprint by almost **1.5 tons of CO2**!`;
    }
    if (query.includes('diet') || query.includes('recipe') || query.includes('food') || query.includes('eat')) {
        return `🥗 **Low-Carbon Diet Tips:** Beef produces about **27 kg of CO2e** per kilogram of meat, whereas plant-based foods like lentils, beans, and tofu produce less than **1 kg**. 
        Here is a quick eco-friendly recipe:
        
        **Lentil & Coconut Dahl (Serves 4):**
        * Heat 1 tbsp oil, sauté 1 chopped onion, 2 garlic cloves, and 1 tbsp ginger.
        * Add 1 tbsp curry powder, 1 cup red lentils, 1 can coconut milk, and 2 cups vegetable broth.
        * Simmer for 20 mins until lentils are soft. Stir in baby spinach.
        * Carbon impact: **~0.3 kg CO2e per serving** (vs. ~6.5 kg for a beef burger!).`;
    }
    if (query.includes('energy') || query.includes('bill') || query.includes('electricity') || query.includes('heat')) {
        return `💡 **Home Energy Efficiency:** Heating and cooling accounts for nearly half of household utility energy.
        * **Thermostat Control:** Dropping your heating thermostat by just 1°C saves around **10%** on your energy usage (equal to ~450 kg CO2/year).
        * **LED Transition:** Replacing traditional bulbs with LEDs reduces light energy consumption by **75%**.
        * **Vampire Draw:** Unplugging chargers and TV standby units saves around $50-$100 and ~150 kg CO2 annually!`;
    }
    if (query.includes('badge') || query.includes('level') || query.includes('xp')) {
        return `🏆 **EcoPulse Gamification & Rewards:**
        * Log logs daily (+10 XP) and commit to daily habits (+20 to +80 XP).
        * **Levels:**
          * Level 1: Seedling (0 - 100 XP)
          * Level 2: Sprout (101 - 300 XP)
          * Level 3: Sapling (301 - 700 XP)
          * Level 4: Oak Tree (701 - 1500 XP)
          * Level 5: Forest Guardian (1500+ XP)
        Keep making sustainable choices to level up!`;
    }
    return `🌱 I'm your eco-assistant! You can ask me details about diet, utility calculations, transport footprints, or our badges. Try asking: *'Suggest some diet recipes'* or *'How can I save transport emissions?'*`;
}

// Redraw / Update dashboard displays
function renderApp() {
    if (!state.isOnboarded) {
        document.getElementById('onboarding-section').classList.remove('hidden');
        document.getElementById('dashboard-tab').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.add('active');
        return;
    }

    document.getElementById('onboarding-section').classList.add('hidden');
    
    // Switch to active tab
    const activeBtn = document.querySelector('.nav-btn.active');
    const activeTabId = activeBtn ? activeBtn.dataset.tab : 'dashboard-tab';
    document.getElementById(activeTabId).classList.remove('hidden');

    // Calculate total carbon footprint
    const totalFootprintVal = (state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste).toFixed(1);
    document.getElementById('total-carbon-score').innerText = totalFootprintVal;

    // Comparison copy
    const avgRegional = 16.0; // average US/Europe baseline
    const percentDiff = Math.abs(((totalFootprintVal - avgRegional) / avgRegional) * 100).toFixed(0);
    const comparisonText = totalFootprintVal < avgRegional 
        ? `${percentDiff}% lower than regional average (${avgRegional}t)`
        : `${percentDiff}% higher than regional average (${avgRegional}t)`;
    document.getElementById('score-comparison-text').innerText = comparisonText;

    // Fill comparison bar
    const barPercent = Math.min(100, (totalFootprintVal / 20.0) * 100);
    document.getElementById('carbon-bar-fill').style.width = `${barPercent}%`;

    // Compute metrics
    const annualSavings = state.actions.filter(a => a.completed).reduce((sum, a) => sum + a.savings, 0);
    const weeklySavingsKg = ((annualSavings * 1000) / 52).toFixed(1);
    document.getElementById('weekly-savings-val').innerText = `${weeklySavingsKg} kg`;

    // Tree equivalence (1 mature tree absorbs ~22kg of CO2 per year)
    const treeEquiv = Math.round((annualSavings * 1000) / 22);
    document.getElementById('tree-equivalent-val').innerText = `${treeEquiv} trees`;

    // Streak and XP
    document.getElementById('streak-val').innerText = `${state.streak} days`;
    document.getElementById('points-val').innerText = `${state.xp} XP`;

    // Level calculator
    let levelName = 'Level 1: Seedling';
    if (state.xp > 1500) levelName = 'Level 5: Forest Guardian';
    else if (state.xp > 700) levelName = 'Level 4: Oak Tree';
    else if (state.xp > 300) levelName = 'Level 3: Sapling';
    else if (state.xp > 100) levelName = 'Level 2: Sprout';
    
    document.getElementById('user-level').innerText = levelName;

    // Render Actions and Logs
    const activeFilter = document.querySelector('.filter-btn.active');
    renderActions(activeFilter ? activeFilter.dataset.filter : 'all');
    renderLogHistory();

    // Redraw charts
    initCharts();
}

// Chart.js Configuration
function initCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') return;

    const compositionCanvas = document.getElementById('composition-chart');
    const trendCanvas = document.getElementById('trend-chart');
    if (!compositionCanvas || !trendCanvas) return;

    // Destroy existing charts to reload clean configurations
    if (compositionChart) compositionChart.destroy();
    if (trendChart) trendChart.destroy();

    // 1. Composition Chart (Doughnut)
    const compositionData = [
        state.footprint.energy,
        state.footprint.transport,
        state.footprint.diet,
        state.footprint.waste
    ];

    compositionChart = new Chart(compositionCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Energy', 'Transport', 'Diet', 'Waste'],
            datasets: [{
                data: compositionData,
                backgroundColor: [
                    '#c2d8b4', // Sage Green
                    '#df8a60', // Terracotta
                    '#e8ddc5', // Sand
                    '#79a6d2'  // Soft Blue
                ],
                borderColor: '#1b1d19',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9da397',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });

    // 2. Trend Chart (Line)
    // Create simulated historical points by computing impact of checked actions
    const baseEmissions = state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste;
    
    // Show a hypothetical history reduction trend line
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = [
        baseEmissions + 2.4, 
        baseEmissions + 1.8, 
        baseEmissions + 1.1, 
        baseEmissions + 0.6, 
        baseEmissions + 0.2, 
        baseEmissions
    ];

    trendChart = new Chart(trendCanvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'CO₂e Emissions (tons)',
                data: trendData,
                borderColor: '#c2d8b4',
                backgroundColor: 'rgba(194, 216, 180, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: '#2c3327' },
                    ticks: { color: '#9da397', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: '#2c3327' },
                    ticks: { color: '#9da397', font: { family: 'Outfit' } }
                }
            }
        }
    });
}
