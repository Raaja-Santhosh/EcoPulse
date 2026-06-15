# EcoPulse 🌱 — Personal Carbon Intelligence Dashboard

EcoPulse is a premium, lightweight personal carbon intelligence dashboard that empowers users to understand, track, and actively reduce their carbon footprint. By combining a multi-step baseline calculator, real-time interactive charts, gamified habit reduction commitments, and a simulated eco-intelligence assistant, EcoPulse makes carbon footprint reduction actionable, intuitive, and engaging.

---

## 🏆 Chosen Vertical & Problem Statement
*   **Vertical**: Personal Carbon Footprint Tracking & Reduction.
*   **Problem Statement**: Individuals want to act on climate change but lack immediate insight into their personal footprint size, how daily activities affect it, or which simple habits yield the highest emission reductions.

---

## 💡 Approach and Logic
EcoPulse utilizes a simplified, scientifically grounded carbon calculator to estimate emissions in four primary lifestyle categories: **Energy, Transportation, Diet, and Waste**. 

1.  **Onboarding Baseline**: Users complete a 4-step interactive onboarding questionnaire. Each response assigns a yearly metric tonnage score based on global/regional averages (e.g., standard EV vs. Petrol vehicle carbon intensity).
2.  **Daily Log Math**:
    *   **Transport**: Logged miles are multiplied by carbon coefficients: Petrol/Diesel Car (`0.411 kg CO2e/mile`), Electric Vehicle (`0.12 kg CO2e/mile`), and Public Transit (`0.08 kg CO2e/mile`).
    *   **Diet**: Meal categories calculate immediate carbon output: Red Meat meal (`7.2 kg CO2e`), Poultry/Fish (`2.4 kg CO2e`), Vegetarian (`1.1 kg CO2e`), and Vegan (`0.5 kg CO2e`).
    *   **Energy**: Utility usage multiplies kWh consumed by a grid intensity factor of `0.385 kg CO2e/kWh`.
    *   **Waste**: Composting and recycling calculate carbon credits (`-0.5 kg` and `-0.3 kg` respectively), reducing the overall footprint.
3.  **Real-Time Reductions & Gamification**:
    *   Checking a daily reduction action (e.g., "Commute via Public Transit") recalculates the user's category emissions and displays the savings immediately on the dashboard.
    *   Users earn XP (Experience Points) and progress through levels (from *Seedling* up to *Forest Guardian*) to reinforce positive climate habit loops.

---

## 🚀 How the Solution Works
EcoPulse is built as a highly responsive, modern Single Page Application (SPA).
*   **Aesthetic Styling**: Uses a custom **Nordic Minimalist / Editorial Organic** theme. Styled with a premium dark olive-charcoal background, soft sage green, terracotta highlights, and elegant serif typography. No generic blue/teal glassmorphism.
*   **Data Visualization**: Uses **Chart.js** via CDN to construct real-time doughnut composition charts and historic line-graphs.
*   **EcoPulse AI Assistant**: A keyword-responsive, rule-based chatbot providing personalized low-carbon recipes, transit impact calculations, and household efficiency guidelines.
*   **Privacy & Persistence**: Entirely self-contained. All progress, logged activities, and user levels persist using the browser's `localStorage` API. No database or API servers required.

---

## 🔬 Assumptions Made
*   **Average Coefficients**: Emissions coefficients for travel, food, and energy represent standardized averages across US and EU carbon index reports.
*   **Yearly vs. Daily Conversion**: Daily reduction habits (e.g., lowering the thermostat) are calculated as a monthly fractional equivalent subtracted from the yearly baseline to show immediate, readable changes.
*   **Grid Intensity**: Assumes a standard utility grid mixture with moderate renewable penetration (`0.385 kg CO2e/kWh`).
