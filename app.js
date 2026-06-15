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
    setupSimulator();
    setupChallenge();
    setupSandbox();
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
            
            triggerConfetti();
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
            state.footprint[act.category] = Math.max(0, state.footprint[act.category] - (act.savings / 12));
            state.streak = Math.min(30, state.streak + 1);
            triggerConfetti();
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

// Carbon Reduction Simulator Logic
function setupSimulator() {
    const commuteSlider = document.getElementById('slider-commute');
    const dietSlider = document.getElementById('slider-diet');
    const tempSlider = document.getElementById('slider-temp');

    const commuteVal = document.getElementById('slider-val-commute');
    const dietVal = document.getElementById('slider-val-diet');
    const tempVal = document.getElementById('slider-val-temp');

    const updateSimulatorOutput = () => {
        commuteVal.innerText = `${commuteSlider.value} miles/day`;
        dietVal.innerText = `${dietSlider.value}% plant-based`;
        tempVal.innerText = `${tempSlider.value}°C reduction`;

        const totalBase = state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste;
        
        const transportSavings = (15 - parseFloat(commuteSlider.value)) * 0.411 * 260 / 1000;
        const dietSavings = ((parseFloat(dietSlider.value) - 25) / 100) * 1.5;
        const tempSavings = parseFloat(tempSlider.value) * 0.45;

        const projectedScore = Math.max(0.5, totalBase - (transportSavings + dietSavings + tempSavings));
        document.getElementById('simulator-score-display').innerText = projectedScore.toFixed(1);
    };

    if (commuteSlider && dietSlider && tempSlider) {
        [commuteSlider, dietSlider, tempSlider].forEach(slider => {
            slider.addEventListener('input', updateSimulatorOutput);
        });
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

// Decision Sandbox Tab (Awareness click moments)
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

    // Select Meal Option
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

    // Select Commute Option
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

    // Nudge Modals Event Handlers
    const overlay = document.getElementById('nudge-alert-overlay');
    const cancelBtn = document.getElementById('nudge-alert-cancel');
    const changeBtn = document.getElementById('nudge-alert-change');

    let activeNudgeType = ''; // 'meal' or 'commute'

    if (orderBtn) {
        orderBtn.addEventListener('click', () => {
            if (sandboxSelection.meal === 'burger') {
                activeNudgeType = 'meal';
                showNudgeModal(
                    'Carbon Warning: High Footprint Dinner Choice!',
                    'Ordering a Beef Burger with 5-mile courier transit produces <strong>8.2 kg of CO₂e</strong>. Shifting to a local Vegan Buddha Bowl (1-mile walk transit) emits only <strong>0.6 kg</strong>—saving 7.6 kg of carbon (equivalent to charging your phone 950 times!).'
                );
            } else {
                // Confirm eco meal directly
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
                // Confirm eco commute directly
                confirmEcoDecision('commute');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            // Proceed with original choice
            overlay.classList.add('hidden');
            logCarbonDecision(activeNudgeType, false);
        });
    }

    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            // Nudged! Switch to eco-friendly option
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

    // Load API Key
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

    // Show indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant-msg typing-msg';
    typingIndicator.innerHTML = `<p>Thinking...</p>`;
    container.appendChild(typingIndicator);
    container.scrollTop = container.scrollHeight;

    const apiKey = localStorage.getItem('ecopulse_gemini_key');

    if (apiKey) {
        // Trigger live Gemini API call
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

// Update the dynamic Eco-Island SVG visualization based on total carbon emissions
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

    if (score < 4.0) {
        // HEALTHY STATE
        sky.setAttribute('fill', '#a4c6df'); // sky-blue
        smog.setAttribute('opacity', '0');
        sun.setAttribute('fill', '#fde047'); // bright yellow
        birds.setAttribute('opacity', '1');
        grass.setAttribute('fill', '#4ade80'); // bright green grass
        t1.setAttribute('r', '20'); t1.setAttribute('fill', '#15803d');
        t2.setAttribute('r', '28'); t2.setAttribute('fill', '#166534');
        t3.setAttribute('r', '16'); t3.setAttribute('fill', '#15803d');
        
        healthBadge.innerText = 'Healthy';
        healthBadge.style.color = 'var(--color-success)';
        healthBadge.style.borderColor = 'var(--color-success)';
        healthBadge.style.backgroundColor = 'rgba(154, 219, 165, 0.1)';
        statusText.innerText = 'Your atmosphere is fresh, and plants are thriving.';
    } else if (score <= 10.0) {
        // MODERATE STATE
        sky.setAttribute('fill', '#94a3b8'); // greyish slate
        smog.setAttribute('opacity', '0.35'); // slight smog
        sun.setAttribute('fill', '#e2e8f0'); // pale yellow sun
        birds.setAttribute('opacity', '0'); // birds flee
        grass.setAttribute('fill', '#a3e635'); // yellowish-green grass
        t1.setAttribute('r', '12'); t1.setAttribute('fill', '#854d0e'); // brownish
        t2.setAttribute('r', '20'); t2.setAttribute('fill', '#166534'); // moderate foliage
        t3.setAttribute('r', '8'); t3.setAttribute('fill', '#854d0e');
        
        healthBadge.innerText = 'Moderate';
        healthBadge.style.color = 'var(--color-accent-terracotta)';
        healthBadge.style.borderColor = 'var(--color-accent-terracotta)';
        healthBadge.style.backgroundColor = 'rgba(223, 138, 96, 0.1)';
        statusText.innerText = 'Moderate emissions. Smog is forming, and smaller trees are starting to dry.';
    } else {
        // CRITICAL STATE
        sky.setAttribute('fill', '#475569'); // dark slate stormy
        smog.setAttribute('opacity', '0.75'); // heavy smog overlay
        sun.setAttribute('fill', '#64748b'); // blocked sun
        birds.setAttribute('opacity', '0');
        grass.setAttribute('fill', '#78350f'); // dry brown dirt soil
        t1.setAttribute('r', '2'); t1.setAttribute('fill', '#451a03'); // withered branches
        t2.setAttribute('r', '4'); t2.setAttribute('fill', '#451a03');
        t3.setAttribute('r', '2'); t3.setAttribute('fill', '#451a03');
        
        healthBadge.innerText = 'Severe';
        healthBadge.style.color = 'var(--color-danger)';
        healthBadge.style.borderColor = 'var(--color-danger)';
        healthBadge.style.backgroundColor = 'rgba(226, 124, 124, 0.1)';
        statusText.innerText = 'High emissions warning! Acid rain and toxic smog have withered the island ecosystem.';
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
    document.getElementById(activeTabId).classList.remove('hidden');

    const totalFootprintVal = (state.footprint.energy + state.footprint.transport + state.footprint.diet + state.footprint.waste).toFixed(1);
    document.getElementById('total-carbon-score').innerText = totalFootprintVal;

    // Update Living World Eco-Island
    updateEcoIsland(parseFloat(totalFootprintVal));

    const avgRegional = 16.0;
    const percentDiff = Math.abs(((totalFootprintVal - avgRegional) / avgRegional) * 100).toFixed(0);
    const comparisonText = totalFootprintVal < avgRegional 
        ? `${percentDiff}% lower than regional average (${avgRegional}t)`
        : `${percentDiff}% higher than regional average (${avgRegional}t)`;
    document.getElementById('score-comparison-text').innerText = comparisonText;

    const barPercent = Math.min(100, (totalFootprintVal / 20.0) * 100);
    document.getElementById('carbon-bar-fill').style.width = `${barPercent}%`;

    const annualSavings = state.actions.filter(a => a.completed).reduce((sum, a) => sum + a.savings, 0);
    const weeklySavingsKg = ((annualSavings * 1000) / 52).toFixed(1);
    document.getElementById('weekly-savings-val').innerText = `${weeklySavingsKg} kg`;

    const treeEquiv = Math.round((annualSavings * 1000) / 22);
    document.getElementById('tree-equivalent-val').innerText = `${treeEquiv} trees`;

    document.getElementById('streak-val').innerText = `${state.streak} days`;
    document.getElementById('points-val').innerText = `${state.xp} XP`;

    // Leaderboard update
    const userXpDisplay = document.getElementById('user-xp-display');
    if (userXpDisplay) {
        userXpDisplay.innerText = `${state.xp} XP`;
    }

    // Dynamic Floor Challenge Leaderboard Sorting
    const leaderboardItems = [
        { name: 'Floor 3 (Forest Guardians)', xp: 3850, avatar: '🏢', currentUser: false },
        { name: 'Floor 2 (Your Floor)', xp: state.xp, avatar: '🏫', currentUser: true },
        { name: 'Floor 1 (Seedlings)', xp: 480, avatar: '🏢', currentUser: false },
        { name: 'Floor 4 (Sprouts)', xp: 150, avatar: '🏢', currentUser: false }
    ];

    leaderboardItems.sort((a, b) => b.xp - a.xp);
    const leaderboardList = document.querySelector('.leaderboard-list');
    if (leaderboardList) {
        leaderboardList.innerHTML = '';
        leaderboardItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `leaderboard-item ${item.currentUser ? 'current-user' : ''}`;
            itemDiv.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="avatar">${item.avatar}</span>
                <span class="name">${item.name}</span>
                <span class="xp">${item.xp.toLocaleString()} XP</span>
            `;
            leaderboardList.appendChild(itemDiv);
            
            if (item.currentUser) {
                const rankValEl = document.getElementById('user-rank-val');
                if (rankValEl) rankValEl.innerText = `#${index + 1}`;
            }
        });
    }

    // Level calculator
    let levelName = 'Level 1: Seedling';
    if (state.xp > 1500) levelName = 'Level 5: Forest Guardian';
    else if (state.xp > 700) levelName = 'Level 4: Oak Tree';
    else if (state.xp > 300) levelName = 'Level 3: Sapling';
    else if (state.xp > 100) levelName = 'Level 2: Sprout';
    
    document.getElementById('user-level').innerText = levelName;

    // Challenge Banner Completed Check
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
