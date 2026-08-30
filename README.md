# 🏋️‍♂️ FITNESS — Master Plan 

An interactive, premium multi-lingual (Arabic, German, English) web dashboard built to track a progressive 11-month athletic transition: combining Gym Hypertrophy, Calisthenics progressions, and an optimized Marathon preparation chronology tailored for Bochum, Germany.

## 🚀 Live Demo
Check out the deployed production application here: **[https://your-project.vercel.app](https://your-project.vercel.app)** *(Replace with your actual Vercel URL)*

---

## 🗺️ System Architecture & Features

The platform shifts away from static fitness documentation into an interactive Client-Side Application built with vanilla web technologies, optimized for fluid performance and precise responsive state management.

### Key Features
### Fitness 2.0 additions
- **Training Tracker:** Sets, repetitions, weight (kg), RIR, completion state and per-exercise/per-date volume are persisted in `localStorage`.
- **Exercise Media:** Existing exercise cards can receive an image/video URL or a local image/video file.
- **Expanded Exercise Library:** Seeded library with additional arm, chest, back, shoulder, leg and core exercises plus custom exercises.
- **Rest Timer:** 30/60/90/120/180 second presets and custom countdown with vibration where supported.
- **Smartwatch / Fitness Band:** Web Bluetooth Heart Rate Service connection for compatible HR devices. This is browser/device dependent and is not a universal Garmin/Fitbit API.
- **Qwen3 Coach:** Chat UI connected to Ollama's `/api/chat` endpoint. Default model is `qwen3:8b`.

- **Dynamic Localization Engine:** Full native synchronization supporting Right-to-Left (RTL) layout flow for Arabic and Left-to-Right (LTR) structural flows for German and English.
- **Progressive Periodization Dashboard:** Clear structural view of the 4 athletic training phases from rehabilitation up to the final race day in April 2027.
- **Granular Matrix Cards:** Multi-language mapping of Gym movements and Calisthenics progressions with calibrated sets, repetitions, and rest cycles.
- **Aesthetic Accordion Meal Plan:** Dynamic day-type nutrition planner (Lifting days, Running days, Rest days) designed around local availability and optimized macro budgets.
- **Persistent Storage Module:** Client-side ledger allowing dynamic updates, real-time data input modification, and absolute state persistence across browser reloads using `localStorage`.

---

## 🛠️ Tech Stack & Architecture

- **Structure:** Semantic HTML5 (Custom data attributes for dynamic translation control)
- **Styling:** Vanilla CSS3 (Custom properties, grid systems, noise transparency layers, fluid typography)
- **Logic:** Native ECMAScript (Vanilla JavaScript DOM manipulation, state routing, storage engines)
- **Hosting & CI/CD:** Vercel Automated Deployment Pipeline

---

## 📦 Local Development Setup

To run this application locally on your system with live reload capabilities, ensure you have [Node.js](https://nodejs.org/) installed, then execute the following commands in your terminal:

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/Fitniss-Planner.git](https://github.com/YOUR_USERNAME/Fitniss-Planner.git)

# Navigate into the project folder
cd Fitniss-Planner

# Install development server dependencies
npm install

# Launch the interactive local development engine
npm start
## 🤖 Ollama / GLM-5.2 setup

The Coach uses Ollama's HTTP API at `http://localhost:11434/api/chat`. The UI lets you change the Ollama base URL and model. The current official Ollama library entry is `qwen3:8b`; cloud models require Ollama sign-in.

Example:

```bash
ollama signin
ollama run qwen3:8b
```

For browser access from a deployed/custom origin, configure Ollama's `OLLAMA_ORIGINS` as described in the official FAQ. Ollama binds to localhost by default, so a public Vercel deployment cannot directly reach an Ollama process running on your own PC unless you deliberately expose it through a network/proxy/tunnel.

Official references: [Ollama GLM-5.2](https://ollama.com/library/glm-5.2), [Ollama Chat API](https://docs.ollama.com/api/chat), [Ollama FAQ](https://docs.ollama.com/faq).
