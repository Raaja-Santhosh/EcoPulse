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
    lastLogDate: null,
    challengeCompleted: false
};

// Previous Stats for Ticker Animation
let prevStats = {
    totalFootprint: 0,
    weeklySavings: 0,
    treeEquivalent: 0,
    xpPoints: 0,
    loggedToday: 0
};

// Global Chart variables
let compositionChart = null;
let trendChart = null;
let lenis = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupNavigation();
    setupQuiz();
    setupLogForm();
    setupActions();
    setupAssistant();
    setupSimulator();
    setupChallenge();
    setupSandbox();
    setupLevelUpModal();
    
    // Premium Motion Setup
    setupLenis();
    setupVantaBackground();
    setupGSAPAnimations();
    setupCustomCursor();
    setupLandingTriggers();
    
    renderApp();
});

// Load state from LocalStorage
function loadState() {
    const savedState = localStorage.getItem('ecopulse_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            prevStats.totalFootprint = parseFloat((state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste).toFixed(1));
            
            const annualSavings = state.actions.filter(a => a.completed).reduce((sum, a) => sum + a.savings, 0);
            prevStats.weeklySavings = parseFloat(((annualSavings * 1000) / 52).toFixed(1));
            prevStats.treeEquivalent = Math.round((annualSavings * 1000) / 22);
            prevStats.xpPoints = state.xp;
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
    const dots = document.querySelectorAll('.onboarding-step-dot');
    
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

    function goToStep(fromStep, toStep) {
        const currentEl = quizSteps[fromStep - 1];
        const nextEl = quizSteps[toStep - 1];
        
        dots.forEach((dot, idx) => {
            if (idx === toStep - 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        if (toStep > fromStep) {
            currentEl.classList.add('exit-left');
            currentEl.classList.remove('active');
            
            nextEl.classList.remove('exit-left');
            nextEl.classList.add('active');
            
            // Animate SVG inside next step if GSAP is available
            const svg = nextEl.querySelector('.quiz-illustration');
            if (svg && typeof gsap !== 'undefined') {
                gsap.fromTo(svg, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)", delay: 0.1 });
            }
            
            setTimeout(() => {
                currentEl.classList.remove('exit-left');
            }, 500);
        } else {
            currentEl.classList.remove('active');
            nextEl.classList.add('exit-left');
            
            // Force reflow
            nextEl.offsetHeight;
            nextEl.classList.remove('exit-left');
            nextEl.classList.add('active');
        }
        
        currentStep = toStep;
        
        if (currentStep === 1) {
            prevBtn.setAttribute('disabled', 'true');
        } else {
            prevBtn.removeAttribute('disabled');
        }
        
        const activeCategory = nextEl.querySelector('.option-btn').dataset.category;
        if (selectedValues[activeCategory] !== null) {
            nextBtn.removeAttribute('disabled');
        } else {
            nextBtn.setAttribute('disabled', 'true');
        }
    }

    // Dot navigation
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const target = parseInt(dot.dataset.stepIndicator);
            if (target === currentStep) return;
            
            let canGo = true;
            for (let i = 1; i < target; i++) {
                const cat = quizSteps[i - 1].querySelector('.option-btn').dataset.category;
                if (selectedValues[cat] === null) {
                    canGo = false;
                    break;
                }
            }
            
            if (canGo) {
                goToStep(currentStep, target);
            }
        });
    });

    // Navigation buttons
    nextBtn.addEventListener('click', () => {
        if (currentStep < 4) {
            goToStep(currentStep, currentStep + 1);
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
            
            gsap.to(quizSection, {
                opacity: 0,
                y: -30,
                duration: 0.6,
                ease: "power2.inOut",
                onComplete: () => {
                    quizSection.classList.add('hidden');
                    quizSection.style.opacity = '1';
                    quizSection.style.transform = 'none';
                    document.getElementById('dashboard-tab').classList.remove('hidden');
                    document.getElementById('nav-dashboard').classList.add('active');
                    triggerConfetti();
                    renderApp();
                }
            });
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            goToStep(currentStep, currentStep - 1);
        }
    });
}

// Confetti Utility
function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#c2d8b4', '#df8a60', '#e8ddc5']
        });
    }
}

// Setup Daily reduction actions
function setupActions() {
    const container = document.getElementById('actions-container');
    const filterButtons = document.querySelectorAll('.filter-btn');

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

        const btn = card.querySelector('.action-check-btn');
        if (act.completed) {
            btn.style.backgroundColor = 'var(--color-success)';
            btn.style.color = '#131412';
        }
        
        btn.addEventListener('click', () => {
            toggleAction(act.id, card);
        });

        container.appendChild(card);
    });
}

function toggleAction(id, cardEl) {
    const actionIndex = state.actions.findIndex(a => a.id === id);
    if (actionIndex !== -1) {
        const act = state.actions[actionIndex];
        act.completed = !act.completed;

        if (act.completed) {
            state.xp += act.xp;
            state.footprint[act.category] = Math.max(0, state.footprint[act.category] - (act.savings / 12));
            state.streak = Math.min(30, state.streak + 1);
            
            if (cardEl && typeof gsap !== 'undefined') {
                const btn = cardEl.querySelector('.action-check-btn');
                btn.innerText = '✓ Active';
                btn.style.backgroundColor = 'var(--color-accent-sage)';
                btn.style.color = '#131412';
                
                gsap.to(cardEl, {
                    scale: 1.05,
                    borderColor: 'var(--color-accent-sage)',
                    backgroundColor: 'rgba(194, 216, 180, 0.1)',
                    duration: 0.25,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.out",
                    onComplete: () => {
                        saveState();
                        triggerConfetti();
                        renderApp();
                    }
                });
            } else {
                saveState();
                triggerConfetti();
                renderApp();
            }
        } else {
            state.xp = Math.max(0, state.xp - act.xp);
            state.footprint[act.category] = state.footprint[act.category] + (act.savings / 12);
            saveState();
            renderApp();
        }
    }
}

// Log Activity Tab logic
function setupLogForm() {
    const categorySelect = document.getElementById('log-category');
    const dynamicField = document.getElementById('log-dynamic-field');
    const logForm = document.getElementById('daily-log-form');
    const clearBtn = document.getElementById('clear-logs-btn');
    
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

    categorySelect.addEventListener('change', () => {
        dynamicField.innerHTML = fields[categorySelect.value] || '';
    });

    dynamicField.innerHTML = fields.transport;

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
                calculatedEmissions = rawValue * 0.411;
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
                calculatedEmissions = 7.2;
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
            calculatedEmissions = rawValue * 0.385;
            desc = `Utility Electricity (${rawValue} kWh)`;
        } else if (category === 'waste') {
            if (subType === 'compost') {
                calculatedEmissions = -0.5;
                desc = `Composted organic waste`;
            } else if (subType === 'recycle') {
                calculatedEmissions = -0.3;
                desc = `Recycled recyclables`;
            } else {
                calculatedEmissions = 1.5;
                desc = `Disposed landfill trash`;
            }
        }

        state.logs.unshift({
            id: Date.now(),
            category,
            description: desc,
            value: calculatedEmissions,
            date
        });

        state.xp += 10;
        
        saveState();
        triggerConfetti();
        renderApp();
        
        if (document.getElementById('log-input-value')) {
            document.getElementById('log-input-value').value = '';
        }
    });

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
        listContainer.innerHTML = `
            <div class="empty-log-state" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1.5rem; gap: 1rem;">
                <svg viewBox="0 0 100 100" width="80" height="80" style="opacity: 0.35;">
                    <rect x="25" y="15" width="50" height="70" rx="8" fill="none" stroke="var(--text-secondary)" stroke-width="3"/>
                    <rect x="38" y="10" width="24" height="10" rx="3" fill="var(--border-color)" stroke="var(--text-secondary)" stroke-width="2"/>
                    <line x1="35" y1="35" x2="65" y2="35" stroke="var(--text-secondary)" stroke-width="3" stroke-linecap="round"/>
                    <line x1="35" y1="50" x2="55" y2="50" stroke="var(--text-secondary)" stroke-width="3" stroke-linecap="round"/>
                    <line x1="35" y1="65" x2="60" y2="65" stroke="var(--text-secondary)" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <h4 style="color: var(--color-accent-sand); font-family: var(--font-serif); font-size: 1.25rem;">Your Log History is Clean</h4>
                <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 250px;">Log your first travel, food, energy, or waste activity on the left to start tracking your daily carbon pulse!</p>
            </div>
        `;
        return;
    }

    nonSystemLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        
        let iconSvg = '';
        if (log.category === 'transport') {
            iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent-terracotta)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="7" rx="1"/><path d="M7 10l2-5h6l2 5"/><circle cx="8" cy="17" r="1.5" fill="var(--bg-main)"/><circle cx="16" cy="17" r="1.5" fill="var(--bg-main)"/></svg>`;
        } else if (log.category === 'diet') {
            iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent-sand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-10 10c0 4.42 3.58 8 8 8h4c4.42 0 8-3.58 8-8v-2a8 8 0 0 0-8-8z"/><path d="M12 6a3 3 0 0 1 3 3v2a3 3 0 0 1-6 0v-2a3 3 0 0 1 3-3z"/></svg>`;
        } else if (log.category === 'energy') {
            iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
        } else if (log.category === 'waste') {
            iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7H3M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 7v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7M10 11v6M14 11v6"/></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent-sand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
        }

        const isSaving = log.value < 0;
        const valText = isSaving ? `${log.value.toFixed(2)} kg CO₂e` : `+${log.value.toFixed(2)} kg CO₂e`;
        const valClass = isSaving ? 'saving' : '';

        item.innerHTML = `
            <div class="log-item-left">
                <span class="log-item-icon" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: var(--bg-main); border-radius: 8px; border: 1px solid var(--border-color);">${iconSvg}</span>
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

// Carbon Reduction Simulator Logic
let prevProjectedScore = 0;

function setupSimulator() {
    const commuteSlider = document.getElementById('slider-commute');
    const dietSlider = document.getElementById('slider-diet');
    const tempSlider = document.getElementById('slider-temp');

    const commuteVal = document.getElementById('slider-val-commute');
    const dietVal = document.getElementById('slider-val-diet');
    const tempVal = document.getElementById('slider-val-temp');
    const displayEl = document.getElementById('simulator-score-display');

    const updateSimulatorOutput = () => {
        if (!commuteSlider || !dietSlider || !tempSlider || !displayEl) return;
        commuteVal.innerText = `${commuteSlider.value} miles/day`;
        dietVal.innerText = `${dietSlider.value}% plant-based`;
        tempVal.innerText = `${tempSlider.value}°C reduction`;

        const totalBase = state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste;
        
        const transportSavings = (15 - parseFloat(commuteSlider.value)) * 0.411 * 260 / 1000;
        const dietSavings = ((parseFloat(dietSlider.value) - 25) / 100) * 1.5;
        const tempSavings = parseFloat(tempSlider.value) * 0.45;

        const projectedScore = Math.max(0.5, totalBase - (transportSavings + dietSavings + tempSavings));
        
        animateStatCounter(displayEl, prevProjectedScore, projectedScore, 1);
        prevProjectedScore = projectedScore;

        updateSimEcoIsland(projectedScore);
    };

    if (commuteSlider && dietSlider && tempSlider) {
        [commuteSlider, dietSlider, tempSlider].forEach(slider => {
            slider.addEventListener('input', updateSimulatorOutput);
        });
        
        const totalBase = state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste;
        prevProjectedScore = totalBase;
        setTimeout(updateSimulatorOutput, 200);
    }
}

// Challenge of the Day Logic
function setupChallenge() {
    const claimBtn = document.getElementById('claim-challenge-btn');
    if (!claimBtn) return;

    claimBtn.addEventListener('click', () => {
        if (state.challengeCompleted) return;

        state.xp += 150;
        state.challengeCompleted = true;
        state.logs.push({
            id: Date.now(),
            category: 'System',
            description: 'Completed Challenge: Carbon-Free Transit Commute',
            value: -4.5,
            date: new Date().toISOString().split('T')[0]
        });

        state.footprint.transport = Math.max(0.1, state.footprint.transport - 0.3);

        saveState();
        triggerConfetti();
        renderApp();
    });
}

// Decision Sandbox Tab
let sandboxSelection = {
    meal: 'burger',
    commute: 'suv'
};

function setupSandbox() {
    const burgerCard = document.getElementById('opt-meal-burger');
    const bowlCard = document.getElementById('opt-meal-bowl');
    const suvCard = document.getElementById('opt-commute-suv');
    const trainCard = document.getElementById('opt-commute-train');

    const orderBtn = document.getElementById('nudge-btn-order');
    const commuteBtn = document.getElementById('nudge-btn-commute');

    if (burgerCard && bowlCard) {
        burgerCard.addEventListener('click', () => {
            burgerCard.classList.add('selected');
            bowlCard.classList.remove('selected');
            sandboxSelection.meal = 'burger';
        });
        bowlCard.addEventListener('click', () => {
            bowlCard.classList.add('selected');
            burgerCard.classList.remove('selected');
            sandboxSelection.meal = 'bowl';
        });
    }

    if (suvCard && trainCard) {
        suvCard.addEventListener('click', () => {
            suvCard.classList.add('selected');
            trainCard.classList.remove('selected');
            sandboxSelection.commute = 'suv';
        });
        trainCard.addEventListener('click', () => {
            trainCard.classList.add('selected');
            suvCard.classList.remove('selected');
            sandboxSelection.commute = 'train';
        });
    }

    const overlay = document.getElementById('nudge-alert-overlay');
    const cancelBtn = document.getElementById('nudge-alert-cancel');
    const changeBtn = document.getElementById('nudge-alert-change');

    let activeNudgeType = '';

    if (orderBtn) {
        orderBtn.addEventListener('click', () => {
            if (sandboxSelection.meal === 'burger') {
                activeNudgeType = 'meal';
                showNudgeModal(
                    'Carbon Warning: High Footprint Dinner Choice!',
                    'Ordering a Beef Burger with 5-mile courier transit produces <strong>8.2 kg of CO₂e</strong>. Shifting to a local Vegan Buddha Bowl (1-mile walk transit) emits only <strong>0.6 kg</strong>—saving 7.6 kg of carbon (equivalent to charging your phone 950 times!).'
                );
            } else {
                confirmEcoDecision('meal');
            }
        });
    }

    if (commuteBtn) {
        commuteBtn.addEventListener('click', () => {
            if (sandboxSelection.commute === 'suv') {
                activeNudgeType = 'commute';
                showNudgeModal(
                    'Carbon Warning: Solo SUV Commute!',
                    'Driving a solo Petrol SUV for 15 miles emits <strong>6.2 kg of CO₂e</strong>. Shifting to the shared Electric Metro Train emits only <strong>1.2 kg</strong>—saving 5.0 kg of carbon (equivalent to planting a tree seedling!).'
                );
            } else {
                confirmEcoDecision('commute');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            logCarbonDecision(activeNudgeType, false);
        });
    }

    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            if (activeNudgeType === 'meal') {
                if (bowlCard) bowlCard.click();
            } else {
                if (trainCard) trainCard.click();
            }
            confirmEcoDecision(activeNudgeType);
        });
    }
}

function showNudgeModal(title, text) {
    const overlay = document.getElementById('nudge-alert-overlay');
    const titleEl = document.getElementById('nudge-alert-title');
    const textEl = document.getElementById('nudge-alert-text');
    
    if (overlay && titleEl && textEl) {
        titleEl.innerHTML = title;
        textEl.innerHTML = text;
        overlay.classList.remove('hidden');
    }
}

function confirmEcoDecision(type) {
    triggerConfetti();
    logCarbonDecision(type, true);
    alert('Green choice confirmed! Emissions logged and +30 Eco Points (XP) awarded.');
}

function logCarbonDecision(type, isEco) {
    if (type === 'meal') {
        const val = isEco ? 0.6 : 8.2;
        const desc = isEco ? 'Buddha Bowl order (Eco-Nudged)' : 'Beef Burger dinner order';
        state.logs.unshift({
            id: Date.now(),
            category: 'diet',
            description: desc,
            value: val,
            date: new Date().toISOString().split('T')[0]
        });
        state.xp += isEco ? 30 : 10;
        state.footprint.diet = Math.max(0.1, state.footprint.diet + (isEco ? -0.1 : 0.4));
    } else {
        const val = isEco ? 1.2 : 6.2;
        const desc = isEco ? 'Metro train commute (Eco-Nudged)' : 'Solo SUV drive commute';
        state.logs.unshift({
            id: Date.now(),
            category: 'transport',
            description: desc,
            value: val,
            date: new Date().toISOString().split('T')[0]
        });
        state.xp += isEco ? 40 : 10;
        state.footprint.transport = Math.max(0.1, state.footprint.transport + (isEco ? -0.15 : 0.3));
    }
    saveState();
    renderApp();
}

// AI Assistant / chatbot logic
function setupAssistant() {
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-user-input');
    const chips = document.querySelectorAll('.chip-btn');

    const saveKeyBtn = document.getElementById('save-gemini-key-btn');
    const clearKeyBtn = document.getElementById('clear-gemini-key-btn');
    const keyInput = document.getElementById('gemini-key-input');
    const statusEl = document.getElementById('gemini-status');

    const savedKey = localStorage.getItem('ecopulse_gemini_key');
    if (savedKey) {
        if (keyInput) keyInput.value = savedKey;
        if (statusEl) statusEl.innerText = 'Mode: Gemini API Active';
    }

    if (saveKeyBtn && keyInput) {
        saveKeyBtn.addEventListener('click', () => {
            const val = keyInput.value.trim();
            if (val) {
                localStorage.setItem('ecopulse_gemini_key', val);
                if (statusEl) statusEl.innerText = 'Mode: Gemini API Active';
                alert('API Key saved securely. Conversational intelligence activated.');
            }
        });
    }

    if (clearKeyBtn && keyInput) {
        clearKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('ecopulse_gemini_key');
            keyInput.value = '';
            if (statusEl) statusEl.innerText = 'Mode: Simulated';
            alert('Gemini key cleared. Swapping to offline simulation mode.');
        });
    }

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

    const userDiv = document.createElement('div');
    userDiv.className = 'message user-msg';
    const p = document.createElement('p');
    p.textContent = msg;
    userDiv.appendChild(p);
    container.appendChild(userDiv);
    
    container.scrollTop = container.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant-msg typing-msg';
    typingIndicator.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    container.appendChild(typingIndicator);
    container.scrollTop = container.scrollHeight;

    const apiKey = localStorage.getItem('ecopulse_gemini_key');

    if (apiKey) {
        const score = (state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste).toFixed(1);
        const requestPayload = {
            contents: [{
                parts: [{
                    text: `You are EcoPulse Assistant, a personal carbon intelligence coach. The user currently emits ${score} tons of CO2e per year. Answer this ecological question concisely using Markdown: "${msg}"`
                }]
            }]
        };

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        })
        .then(res => {
            if (!res.ok) throw new Error('API Request Failed');
            return res.json();
        })
        .then(data => {
            typingIndicator.remove();
            const reply = data.candidates[0].content.parts[0].text;
            
            const assistantDiv = document.createElement('div');
            assistantDiv.className = 'message assistant-msg';
            assistantDiv.innerHTML = `<p>${reply.replace(/\n/g, '<br>')}</p>`;
            container.appendChild(assistantDiv);
            container.scrollTop = container.scrollHeight;
        })
        .catch(err => {
            console.error(err);
            typingIndicator.remove();
            fallbackRuleResponse(msg, container);
        });
    } else {
        setTimeout(() => {
            typingIndicator.remove();
            fallbackRuleResponse(msg, container);
        }, 600);
    }
}

function fallbackRuleResponse(msg, container) {
    const reply = getAssistantResponse(msg.toLowerCase());
    const assistantDiv = document.createElement('div');
    assistantDiv.className = 'message assistant-msg';
    assistantDiv.innerHTML = `<p>${reply}</p>`;
    container.appendChild(assistantDiv);
    container.scrollTop = container.scrollHeight;
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

// ----------------------------------------------------
// PREMIUM MOTION IMPLEMENTATION (LENIS, GSAP, VANTA)
// ----------------------------------------------------

// 1. Lenis Smooth Scroll Setup
function setupLenis() {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.3,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
            smoothWheel: true
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
}

// 2. Vanta Fog Background (Hero Section)
let vantaInstance = null;
function setupVantaBackground() {
    const container = document.getElementById('vanta-bg-container');
    if (container && typeof VANTA !== 'undefined' && typeof THREE !== 'undefined') {
        vantaInstance = VANTA.FOG({
            el: "#vanta-bg-container",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0xc2d8b4,
            mitchellColor: 0xdf8a60,
            baseColor: 0x131412,
            lowlightColor: 0x1b1d19,
            blurFactor: 0.60,
            speed: 1.20,
            zoom: 1.10
        });
    }
}

// 3. GSAP ScrollTrigger Story reveals & CountUp Numbers
function setupGSAPAnimations() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion) return; // Skip heavy animations

        // Hero title stagger reveal
        gsap.fromTo(".reveal-word", {
            opacity: 0,
            y: 35
        }, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.18,
            ease: "power4.out"
        });

        // Story 1: Definition Image reveal
        gsap.from("#showcase-img-island", {
            scrollTrigger: {
                trigger: "#story-section-1",
                start: "top 70%",
                toggleActions: "play none none reverse"
            },
            scale: 0.85,
            opacity: 0.2,
            duration: 1.4,
            ease: "power2.out"
        });

        // Story 2: Causes Image reveal
        gsap.from("#showcase-img-sources", {
            scrollTrigger: {
                trigger: "#story-section-2",
                start: "top 70%",
                toggleActions: "play none none reverse"
            },
            scale: 0.85,
            opacity: 0.2,
            duration: 1.4,
            ease: "power2.out"
        });

        // Story 2: Cause List Items stagger
        gsap.from(".cause-list-item", {
            scrollTrigger: {
                trigger: "#story-section-2",
                start: "top 60%"
            },
            opacity: 0,
            x: 50,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out"
        });

        // Story 3: Comparative Statistics Counters CountUp Concurrent
        gsap.fromTo("#counter-india", { innerText: "0.0" }, {
            innerText: "1.9", duration: 2.0, ease: "power2.out",
            scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
            snap: { innerText: 0.1 },
            onUpdate: function() {
                const val = parseFloat(this.targets()[0].innerText);
                this.targets()[0].innerText = val.toFixed(1);
            }
        });

        gsap.fromTo("#counter-target", { innerText: "0.0" }, {
            innerText: "2.0", duration: 2.0, ease: "power2.out",
            scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
            snap: { innerText: 0.1 },
            onUpdate: function() {
                const val = parseFloat(this.targets()[0].innerText);
                this.targets()[0].innerText = val.toFixed(1);
            }
        });

        gsap.fromTo("#counter-western", { innerText: "0.0" }, {
            innerText: "16.0", duration: 2.0, ease: "power2.out",
            scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
            snap: { innerText: 0.1 },
            onUpdate: function() {
                const val = parseFloat(this.targets()[0].innerText);
                this.targets()[0].innerText = val.toFixed(1);
            }
        });
    }
}

// 4. Custom cursor morphing follow
function setupCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.08,
            ease: "power2.out"
        });
    });

    const updateInteractives = () => {
        const targets = document.querySelectorAll('button, select, input, a, .option-btn, .nudge-opt-card, .filter-btn');
        targets.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('cursor-expand'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-expand'));
        });
    };

    updateInteractives();
    
    const observer = new MutationObserver(updateInteractives);
    observer.observe(document.body, { childList: true, subtree: true });
}

// 5. Landing Page Transition Triggers
function setupLandingTriggers() {
    const heroEnterBtn = document.getElementById('hero-enter-btn');
    const ctaEnterBtn = document.getElementById('cta-enter-btn');
    const landingPage = document.getElementById('landing-page');
    const appInterface = document.getElementById('app-interface');

    if (heroEnterBtn && lenis) {
        heroEnterBtn.addEventListener('click', () => {
            lenis.scrollTo('#story-section-1');
        });
    }

    const launchApp = () => {
        if (landingPage && appInterface) {
            gsap.to(landingPage, {
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: "power3.inOut",
                onComplete: () => {
                    landingPage.style.display = 'none';
                    appInterface.classList.remove('hidden');
                    
                    setTimeout(() => {
                        appInterface.classList.add('visible');
                        if (vantaInstance) {
                            vantaInstance.destroy();
                            vantaInstance = null;
                        }
                        if (lenis) {
                            lenis.scrollTo(0, { immediate: true });
                        }
                        initCharts();
                        triggerConfetti();
                    }, 50);
                }
            });
        }
    };

    if (ctaEnterBtn) {
        ctaEnterBtn.addEventListener('click', launchApp);
    }
}

// ----------------------------------------------------
// DYNAMIC TICKER COUNTER & PROGRESS BAR ANIMATIONS
// ----------------------------------------------------

// Custom numeric rolling counter animation
function animateStatCounter(el, start, end, decimals = 1) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.innerText = end.toFixed(decimals);
        return;
    }
    
    let current = start;
    const range = end - start;
    const duration = 1200; // 1.2s Eased counter transition
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // EaseOut cubic curve
        const ease = 1 - Math.pow(1 - progress, 3);
        current = start + range * ease;
        el.innerText = current.toFixed(decimals);
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.innerText = end.toFixed(decimals);
        }
    }
    requestAnimationFrame(step);
}

// Update level progress bar width based on XP
function updateXPProgressBar(points) {
    const bar = document.getElementById('xp-progress-bar');
    if (!bar) return;

    let tierMin = 0;
    let tierMax = 100;

    if (points > 1500) {
        bar.style.width = '100%';
        return;
    } else if (points > 700) {
        tierMin = 701;
        tierMax = 1500;
    } else if (points > 300) {
        tierMin = 301;
        tierMax = 700;
    } else if (points > 100) {
        tierMin = 101;
        tierMax = 300;
    }

    const range = tierMax - tierMin;
    const progress = points - tierMin;
    const percent = Math.min(100, Math.max(0, (progress / range) * 100));

    bar.style.width = `${percent}%`;
}

// Update the dynamic Eco-Island SVG visualization based on total carbon emissions using GSAP
function updateEcoIsland(score) {
    const sky = document.getElementById('island-sky');
    const smog = document.getElementById('island-smog');
    const sun = document.getElementById('island-sun');
    const birds = document.getElementById('birds-group');
    const grass = document.getElementById('island-grass');
    const t1 = document.getElementById('tree1-leaves');
    const t2 = document.getElementById('tree2-leaves');
    const t3 = document.getElementById('tree3-leaves');
    const statusText = document.getElementById('island-status-desc');
    const healthBadge = document.getElementById('island-health-badge');

    if (!sky || !smog || !sun || !birds || !grass || !t1 || !t2 || !t3 || !statusText || !healthBadge) return;

    let targetSkyColor = '#a4c6df';
    let targetSmogOpacity = 0;
    let targetSunColor = '#fde047';
    let targetBirdsOpacity = 1;
    let targetGrassColor = '#4ade80';
    let t1Radius = 20, t1Color = '#15803d';
    let t2Radius = 28, t2Color = '#166534';
    let t3Radius = 16, t3Color = '#15803d';

    const nonSystemLogs = state.logs.filter(l => !l.isSystem);
    const hasLogs = nonSystemLogs.length > 0;

    if (!hasLogs) {
        healthBadge.innerText = 'Dormant';
        healthBadge.style.color = 'var(--text-secondary)';
        healthBadge.style.borderColor = 'var(--border-color)';
        healthBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        statusText.innerText = 'No activities logged. Start logging your daily travel, food, or energy inputs to sprout trees and clear the skies!';
        
        targetSkyColor = '#475569';
        targetSmogOpacity = 0.2;
        targetSunColor = '#94a3b8';
        targetBirdsOpacity = 0;
        targetGrassColor = '#57534e'; // stone grey grass
        t1Radius = 0; t1Color = '#451a03';
        t2Radius = 0; t2Color = '#451a03';
        t3Radius = 0; t3Color = '#451a03';
    } else if (score < 4.0) {
        healthBadge.innerText = 'Healthy';
        healthBadge.style.color = 'var(--color-success)';
        healthBadge.style.borderColor = 'var(--color-success)';
        healthBadge.style.backgroundColor = 'rgba(154, 219, 165, 0.1)';
        statusText.innerText = 'Your atmosphere is fresh, and plants are thriving.';
    } else if (score <= 10.0) {
        targetSkyColor = '#94a3b8';
        targetSmogOpacity = 0.35;
        targetSunColor = '#e2e8f0';
        targetBirdsOpacity = 0;
        targetGrassColor = '#a3e635';
        t1Radius = 12; t1Color = '#854d0e';
        t2Radius = 20; t2Color = '#166534';
        t3Radius = 8; t3Color = '#854d0e';

        healthBadge.innerText = 'Moderate';
        healthBadge.style.color = 'var(--color-accent-terracotta)';
        healthBadge.style.borderColor = 'var(--color-accent-terracotta)';
        healthBadge.style.backgroundColor = 'rgba(223, 138, 96, 0.1)';
        statusText.innerText = 'Moderate emissions. Smog is forming, and smaller trees are starting to dry.';
    } else {
        targetSkyColor = '#334155';
        targetSmogOpacity = 0.75;
        targetSunColor = '#475569';
        targetBirdsOpacity = 0;
        targetGrassColor = '#78350f';
        t1Radius = 2; t1Color = '#451a03';
        t2Radius = 4; t2Color = '#451a03';
        t3Radius = 2; t3Color = '#451a03';

        healthBadge.innerText = 'Severe';
        healthBadge.style.color = 'var(--color-danger)';
        healthBadge.style.borderColor = 'var(--color-danger)';
        healthBadge.style.backgroundColor = 'rgba(226, 124, 124, 0.1)';
        statusText.innerText = 'High emissions warning! Acid rain and toxic smog have withered the island ecosystem.';
    }

    // GSAP-Eased Island Transitions
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof gsap === 'undefined') {
        sky.setAttribute('fill', targetSkyColor);
        smog.setAttribute('opacity', targetSmogOpacity);
        sun.setAttribute('fill', targetSunColor);
        birds.setAttribute('opacity', targetBirdsOpacity);
        grass.setAttribute('fill', targetGrassColor);
        t1.setAttribute('r', t1Radius); t1.setAttribute('fill', t1Color);
        t2.setAttribute('r', t2Radius); t2.setAttribute('fill', t2Color);
        t3.setAttribute('r', t3Radius); t3.setAttribute('fill', t3Color);
    } else {
        gsap.to(sky, { fill: targetSkyColor, duration: 1.2, ease: "power2.out" });
        gsap.to(smog, { opacity: targetSmogOpacity, duration: 1.2, ease: "power2.out" });
        gsap.to(sun, { fill: targetSunColor, duration: 1.2, ease: "power2.out" });
        gsap.to(birds, { opacity: targetBirdsOpacity, duration: 0.8 });
        gsap.to(grass, { fill: targetGrassColor, duration: 1.2 });
        gsap.to(t1, { r: t1Radius, fill: t1Color, duration: 1.2, ease: "back.out(1.5)" });
        gsap.to(t2, { r: t2Radius, fill: t2Color, duration: 1.2, ease: "back.out(1.5)" });
        gsap.to(t3, { r: t3Radius, fill: t3Color, duration: 1.2, ease: "back.out(1.5)" });
    }
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
    
    const activeBtn = document.querySelector('.nav-btn.active');
    const activeTabId = activeBtn ? activeBtn.dataset.tab : 'dashboard-tab';
    
    const tabEl = document.getElementById(activeTabId);
    if (tabEl) {
        tabEl.classList.remove('hidden');
    }

    // Detect level up
    const prevLevelIdx = getLevelIndex(prevStats.xpPoints);
    const currentLevelIdx = getLevelIndex(state.xp);
    if (currentLevelIdx > prevLevelIdx && state.isOnboarded) {
        triggerLevelUpModal(currentLevelIdx);
    }

    // Total Carbon Score Counter Ticker
    const totalFootprintVal = parseFloat((state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste).toFixed(1));
    const totalScoreEl = document.getElementById('total-carbon-score');
    if (totalScoreEl) {
        animateStatCounter(totalScoreEl, prevStats.totalFootprint, totalFootprintVal, 1);
        prevStats.totalFootprint = totalFootprintVal;
    }

    const simCurrentValEl = document.getElementById('sim-current-val');
    if (simCurrentValEl) {
        simCurrentValEl.innerText = totalFootprintVal.toFixed(1);
    }

    // Daily Log Total Ticker Calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedTodaySum = state.logs
        .filter(l => l.date === todayStr && !l.isSystem)
        .reduce((sum, l) => sum + l.value, 0);

    const loggedTodayEl = document.getElementById('logged-today-val');
    if (loggedTodayEl) {
        animateStatCounter(loggedTodayEl, prevStats.loggedToday || 0, Math.max(0, loggedTodaySum), 1);
        prevStats.loggedToday = Math.max(0, loggedTodaySum);
    }

    updateEcoIsland(totalFootprintVal);

    const avgRegional = 16.0;
    const percentDiff = Math.abs(((totalFootprintVal - avgRegional) / avgRegional) * 100).toFixed(0);
    const comparisonText = totalFootprintVal < avgRegional 
        ? `${percentDiff}% lower than regional average (${avgRegional}t)`
        : `${percentDiff}% higher than regional average (${avgRegional}t)`;
    document.getElementById('score-comparison-text').innerText = comparisonText;

    const barPercent = Math.min(100, (totalFootprintVal / 20.0) * 100);
    document.getElementById('carbon-bar-fill').style.width = `${barPercent}%`;

    const annualSavings = state.actions.filter(a => a.completed).reduce((sum, a) => sum + a.savings, 0);
    
    // Weekly Savings Ticker
    const weeklySavingsKg = parseFloat(((annualSavings * 1000) / 52).toFixed(1));
    const weeklySavingsEl = document.getElementById('weekly-savings-val');
    if (weeklySavingsEl) {
        animateStatCounter(weeklySavingsEl, prevStats.weeklySavings, weeklySavingsKg, 1);
        prevStats.weeklySavings = weeklySavingsKg;
    }

    // Tree Equivalent Ticker
    const treeEquiv = Math.round((annualSavings * 1000) / 22);
    const treeEquivalentEl = document.getElementById('tree-equivalent-val');
    if (treeEquivalentEl) {
        animateStatCounter(treeEquivalentEl, prevStats.treeEquivalent, treeEquiv, 0);
        prevStats.treeEquivalent = treeEquiv;
    }

    document.getElementById('streak-val').innerText = `${state.streak} days`;
    
    // XP Points Ticker
    const pointsValEl = document.getElementById('points-val');
    if (pointsValEl) {
        animateStatCounter(pointsValEl, prevStats.xpPoints, state.xp, 0);
        prevStats.xpPoints = state.xp;
    }

    // Update Visual progress bar
    updateXPProgressBar(state.xp);

    const userXpDisplay = document.getElementById('user-xp-display');
    if (userXpDisplay) {
        userXpDisplay.innerText = `${state.xp} XP`;
    }

    const leaderboardItems = [
        { name: 'Floor 3 (Forest Guardians)', xp: 3850, avatar: '🏢', currentUser: false },
        { name: 'Floor 2 (Your Floor)', xp: state.xp, avatar: '🏫', currentUser: true },
        { name: 'Floor 1 (Seedlings)', xp: 480, avatar: '🏢', currentUser: false },
        { name: 'Floor 4 (Sprouts)', xp: 150, avatar: '🏢', currentUser: false }
    ];

    const leaderboardList = document.querySelector('.leaderboard-list');
    const firstPositions = {};
    if (leaderboardList) {
        // FIRST step of FLIP: Record previous positions
        const currentItems = leaderboardList.querySelectorAll('.leaderboard-item');
        currentItems.forEach(el => {
            const nameEl = el.querySelector('.name');
            if (nameEl) {
                firstPositions[nameEl.innerText] = el.getBoundingClientRect().top;
            }
        });
    }

    leaderboardItems.sort((a, b) => b.xp - a.xp);
    
    if (leaderboardList) {
        leaderboardList.innerHTML = '';
        
        const newElements = [];
        leaderboardItems.forEach((item, index) => {
            let rankHtml = `#${index + 1}`;
            let medalClass = '';
            if (index === 0) { rankHtml = '👑 #1'; medalClass = 'rank-gold'; }
            else if (index === 1) { rankHtml = '🥈 #2'; medalClass = 'rank-silver'; }
            else if (index === 2) { rankHtml = '🥉 #3'; medalClass = 'rank-bronze'; }

            const itemDiv = document.createElement('div');
            itemDiv.className = `leaderboard-item ${medalClass} ${item.currentUser ? 'current-user' : ''}`;
            itemDiv.innerHTML = `
                <span class="rank">${rankHtml}</span>
                <span class="avatar">${item.avatar}</span>
                <span class="name">${item.name}</span>
                <span class="xp font-mono">${item.xp.toLocaleString()} XP</span>
            `;
            leaderboardList.appendChild(itemDiv);
            newElements.push({ el: itemDiv, name: item.name });
            
            if (item.currentUser) {
                const rankValEl = document.getElementById('user-rank-val');
                if (rankValEl) rankValEl.innerText = `#${index + 1}`;
            }
        });

        // LAST, INVERT, PLAY steps of FLIP
        if (Object.keys(firstPositions).length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            newElements.forEach(itemInfo => {
                const first = firstPositions[itemInfo.name];
                if (first !== undefined) {
                    const last = itemInfo.el.getBoundingClientRect().top;
                    const invert = first - last;
                    if (invert !== 0) {
                        itemInfo.el.style.transform = `translateY(${invert}px)`;
                        itemInfo.el.style.transition = 'none';
                        // Force reflow
                        itemInfo.el.offsetHeight;
                        
                        // Play transition
                        itemInfo.el.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
                        itemInfo.el.style.transform = '';
                    }
                }
            });
        }
    }

    let levelName = 'Level 1: Seedling';
    if (state.xp > 1500) levelName = 'Level 5: Forest Guardian';
    else if (state.xp > 700) levelName = 'Level 4: Oak Tree';
    else if (state.xp > 300) levelName = 'Level 3: Sapling';
    else if (state.xp > 100) levelName = 'Level 2: Sprout';
    
    document.getElementById('user-level').innerText = levelName;

    // Update achievements badges grid
    const badgeIds = ['badge-seedling', 'badge-sprout', 'badge-sapling', 'badge-oaktree', 'badge-forestguardian'];
    badgeIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
            const badgeLevel = idx + 1;
            if (badgeLevel <= currentLevelIdx) {
                el.classList.remove('locked');
                if (badgeLevel === currentLevelIdx) {
                    el.classList.add('active-current');
                } else {
                    el.classList.remove('active-current');
                }
            } else {
                el.classList.add('locked');
                el.classList.remove('active-current');
            }
        }
    });

    const claimBtn = document.getElementById('claim-challenge-btn');
    if (claimBtn) {
        if (state.challengeCompleted) {
            claimBtn.innerText = '✓ Challenge Completed!';
            claimBtn.style.backgroundColor = 'var(--color-success)';
            claimBtn.style.color = '#131412';
            claimBtn.setAttribute('disabled', 'true');
        } else {
            claimBtn.innerText = 'I did this today!';
            claimBtn.style.backgroundColor = 'var(--color-accent-sage)';
            claimBtn.style.color = 'var(--bg-main)';
            claimBtn.removeAttribute('disabled');
        }
    }

    const activeFilter = document.querySelector('.filter-btn.active');
    renderActions(activeFilter ? activeFilter.dataset.filter : 'all');
    renderLogHistory();

    initCharts();
}

// Chart.js Configuration
function initCharts() {
    if (typeof Chart === 'undefined') return;

    const compositionCanvas = document.getElementById('composition-chart');
    const trendCanvas = document.getElementById('trend-chart');
    if (!compositionCanvas || !trendCanvas) return;

    if (compositionChart) compositionChart.destroy();
    if (trendChart) trendChart.destroy();

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
                    '#c2d8b4', 
                    '#df8a60', 
                    '#e8ddc5', 
                    '#79a6d2'  
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

    const baseEmissions = state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste;
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

// ----------------------------------------------------
// ACHIEVEMENTS & LEVEL UP HELPERS
// ----------------------------------------------------

function getLevelIndex(xp) {
    if (xp > 1500) return 5;
    if (xp > 700) return 4;
    if (xp > 300) return 3;
    if (xp > 100) return 2;
    return 1;
}

function triggerLevelUpModal(levelIndex) {
    const overlay = document.getElementById('levelup-overlay');
    if (!overlay) return;
    
    const card = overlay.querySelector('.levelup-card');
    const badgeContainer = document.getElementById('levelup-badge-container');
    const titleEl = document.getElementById('levelup-title-el');
    const descEl = document.getElementById('levelup-desc-el');
    
    const levels = [
        { name: 'Level 1: Seedling', desc: 'You are a seedling, just beginning your environmental awareness journey.' },
        { name: 'Level 2: Sprout', desc: 'You have sprouted! Keep tracking and committing to daily actions.' },
        { name: 'Level 3: Sapling', desc: 'You are a sapling. Your green choices are growing and making a real difference!' },
        { name: 'Level 4: Oak Tree', desc: 'You are an Oak Tree! Strong, resilient, and carbon-conscious.' },
        { name: 'Level 5: Forest Guardian', desc: 'You are a Forest Guardian! You have achieved peak ecological harmony.' }
    ];
    
    const levelInfo = levels[levelIndex - 1];
    const badgeId = ['badge-seedling', 'badge-sprout', 'badge-sapling', 'badge-oaktree', 'badge-forestguardian'][levelIndex - 1];
    
    const badgeEl = document.getElementById(badgeId);
    if (badgeEl) {
        const badgeSvg = badgeEl.querySelector('svg').cloneNode(true);
        badgeContainer.innerHTML = '';
        badgeContainer.appendChild(badgeSvg);
    }
    
    if (titleEl) titleEl.innerText = levelInfo.name;
    if (descEl) descEl.innerText = levelInfo.desc;
    
    if (card) card.classList.remove('flipped');
    
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('visible'), 50);
    
    triggerConfetti();
}

function setupLevelUpModal() {
    const overlay = document.getElementById('levelup-overlay');
    if (!overlay) return;
    
    const card = overlay.querySelector('.levelup-card');
    const claimBtn = document.getElementById('levelup-claim-btn');
    
    if (card) {
        card.addEventListener('click', (e) => {
            if (e.target.id === 'levelup-claim-btn') return;
            card.classList.toggle('flipped');
        });
    }
    
    if (claimBtn) {
        claimBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.classList.add('hidden');
                const cardInner = card ? card.querySelector('.card-inner') : null;
                if (card) card.classList.remove('flipped');
            }, 500);
        });
    }
}

function updateSimEcoIsland(score) {
    const sky = document.getElementById('sim-island-sky');
    const smog = document.getElementById('sim-island-smog');
    const sun = document.getElementById('sim-island-sun');
    const birds = document.getElementById('sim-birds-group');
    const grass = document.getElementById('sim-island-grass');
    const t1 = document.getElementById('sim-tree1-leaves');
    const t2 = document.getElementById('sim-tree2-leaves');
    const t3 = document.getElementById('sim-tree3-leaves');

    if (!sky || !smog || !sun || !birds || !grass || !t1 || !t2 || !t3) return;

    let targetSkyColor = '#a4c6df';
    let targetSmogOpacity = 0;
    let targetSunColor = '#fde047';
    let targetBirdsOpacity = 1;
    let targetGrassColor = '#4ade80';
    let t1Radius = 20, t1Color = '#15803d';
    let t2Radius = 28, t2Color = '#166534';
    let t3Radius = 16, t3Color = '#15803d';

    if (score < 4.0) {
        // healthy (defaults)
    } else if (score <= 10.0) {
        targetSkyColor = '#94a3b8';
        targetSmogOpacity = 0.35;
        targetSunColor = '#e2e8f0';
        targetBirdsOpacity = 0;
        targetGrassColor = '#a3e635';
        t1Radius = 12; t1Color = '#854d0e';
        t2Radius = 20; t2Color = '#166534';
        t3Radius = 8; t3Color = '#854d0e';
    } else {
        targetSkyColor = '#334155';
        targetSmogOpacity = 0.75;
        targetSunColor = '#475569';
        targetBirdsOpacity = 0;
        targetGrassColor = '#78350f';
        t1Radius = 2; t1Color = '#451a03';
        t2Radius = 4; t2Color = '#451a03';
        t3Radius = 2; t3Color = '#451a03';
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof gsap === 'undefined') {
        sky.setAttribute('fill', targetSkyColor);
        smog.setAttribute('opacity', targetSmogOpacity);
        sun.setAttribute('fill', targetSunColor);
        birds.setAttribute('opacity', targetBirdsOpacity);
        grass.setAttribute('fill', targetGrassColor);
        t1.setAttribute('r', t1Radius); t1.setAttribute('fill', t1Color);
        t2.setAttribute('r', t2Radius); t2.setAttribute('fill', t2Color);
        t3.setAttribute('r', t3Radius); t3.setAttribute('fill', t3Color);
    } else {
        gsap.to(sky, { fill: targetSkyColor, duration: 0.8, ease: "power2.out" });
        gsap.to(smog, { opacity: targetSmogOpacity, duration: 0.8, ease: "power2.out" });
        gsap.to(sun, { fill: targetSunColor, duration: 0.8, ease: "power2.out" });
        gsap.to(birds, { opacity: targetBirdsOpacity, duration: 0.5 });
        gsap.to(grass, { fill: targetGrassColor, duration: 0.8 });
        gsap.to(t1, { r: t1Radius, fill: t1Color, duration: 0.8, ease: "back.out(1.5)" });
        gsap.to(t2, { r: t2Radius, fill: t2Color, duration: 0.8, ease: "back.out(1.5)" });
        gsap.to(t3, { r: t3Radius, fill: t3Color, duration: 0.8, ease: "back.out(1.5)" });
    }
}
