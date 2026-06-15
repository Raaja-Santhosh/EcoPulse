# EcoPulse 🌱 — Personal Carbon Intelligence & Behavior Awareness Platform

EcoPulse is a premium personal carbon intelligence platform designed to help users calculate, track, simulate, and actively reduce their daily carbon footprint. 

Unlike standard trackers, EcoPulse focuses on **behavioral change and emotional awareness** through custom dynamic elements: the **Eco-Island Living World** and real-time **Decision Sandbox Nudges**.

---

## 🏆 Chosen Vertical & Problem Statement
*   **Vertical**: Personal Carbon Footprint Tracking, Awareness, and Reduction.
*   **The Challenge**: Standard dashboards only track retrospectively, failing to drive real-time decision-point changes. EcoPulse addresses this by shifting focus from retrospect to **real-time decision awareness**.

---

## 💡 Core Innovations & Behavioral Mechanics

### 1. The Eco-Island (Emotional Visualization)
A living, floating island SVG ecosystem situated directly on the user's dashboard. In real-time, the island's health reflects the user's active emissions:
*   **Healthy (< 4.0t CO2e)**: Sunny clear skies, flying birds, green grass, and lush green leafy trees.
*   **Moderate (4.0t - 10.0t CO2e)**: Foggy cloudy skies, birds fly away, grass yellows, and smaller trees wither/turn brown.
*   **Severe (> 10.0t CO2e)**: Stormy dark grey acid-rain skies, toxic smog overlay, dead brown soil, and completely withered, bare leafless branches.

### 2. Decision Point Sandbox (Contextual Nudges)
Simulates in-the-moment decision points (e.g., ordering food delivery or choosing commuting modes) to inject carbon warnings *before* confirmation:
*   **Food Delivery**: Prompts warning if choosing Beef Burger (8.2 kg CO2e) over Vegan Bowl (0.6 kg CO2e), outlining the equivalent cost (driving 20 miles).
*   **Commute Route**: Compares Petrol SUV solo commute (6.2 kg CO2e) to shared Train transit (1.2 kg CO2e).
*   *Behavioral Loop*: Offers an instant "Switch to Eco-Friendly" button that corrects the choice, logs carbon savings, triggers confetti, and grants XP.

### 3. Pluggable GenAI Integration (Google Gemini API)
Enables evaluators to paste their own Google Gemini API Key locally. When configured, it swaps the simulated Eco-Assistant with actual, live generative conversation running on the `gemini-1.5-flash` model (incorporating the user's active footprint statistics into the model's prompt context).

---

## 🔌 Technical Design & Coefficients
*   **Visual Assets**: High-end custom SVG modules with CSS keyframe cloud drifts and smooth state transitions. 
*   **Persistence**: Completely serverless. Active data logs, streaks, and API keys are stored client-side via `localStorage`.
*   **Carbon Math Coefficients**:
    *   *Commute Modes*: Petrol (`0.411 kg CO2/mi`), EV (`0.12 kg CO2/mi`), Shared Transit (`0.08 kg CO2/mi`).
    *   *Diet Inputs*: Beef (`7.2 kg`), Poultry/Fish (`2.4 kg`), Veggie (`1.1 kg`), Vegan (`0.5 kg`).
    *   *Energy Grid Intensity*: Standard grid factor of `0.385 kg CO2e/kWh`.

---

## 🧪 Robustness Verification
Includes an automated test runner at `/tests.html` verifying calculation correctness alongside edge case safety bounds:
-   Null inputs.
-   Zero-value commits.
-   Negative distances and energy consumption limits.
