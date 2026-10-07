# Antigravity Adaptive Keyboard Lab (A2KL)

> **A Real-Time Actor-Critic Reinforcement Learning Virtual Keyboard with Laguerre-Voronoi Spatial Tessellation, Bayesian Touch Decoding, and Asynchronous Credit Assignment.**

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Vanilla CSS](https://img.shields.io/badge/CSS3-Vanilla_Design_Tokens-1572B6.svg?logo=css3)](src/index.css)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Architectural Highlights](#-architectural-highlights)
3. [Mathematical & RL Formulation](#-mathematical--rl-formulation)
   - [1. Markov Decision Process (MDP)](#1-markov-decision-process-mdp)
   - [2. Actor-Critic Policy Gradient Updates](#2-actor-critic-policy-gradient-updates)
   - [3. Asynchronous Credit Assignment (Backspace Anti-Gradient)](#3-asynchronous-credit-assignment-backspace-anti-gradient)
   - [4. Bayesian Touch Decoder](#4-bayesian-touch-decoder)
   - [5. Laguerre-Voronoi Power Diagrams](#5-laguerre-voronoi-power-diagrams)
4. [Hardware Layout Modes (Laptop, Tablet, Phone)](#-hardware-layout-modes)
5. [WhatsApp Messenger Simulator (Live Testbed Tab)](#-whatsapp-messenger-simulator-tab)
6. [Project Structure](#-project-structure)
7. [Multi-Algorithm RL Suite (A2C, DQN, PPO)](#-multi-algorithm-reinforcement-learning-suite)
8. [Empirical 3-Way Benchmark Results](#-empirical-3-way-algorithm-benchmark-600-keystroke-evaluation)
9. [Running on iPhone / Mobile](#-running-on-iphone--mobile)
10. [Setup & Installation](#-setup--installation)
11. [Running & Verification Suite](#-running--verification-suite)
12. [Hyperparameter Reference](#-hyperparameter-reference)
13. [License](#-license)

---

## 🌟 Overview

The **Antigravity Adaptive Keyboard Lab (A2KL)** is a client-side virtual keyboard engine powered by **Reinforcement Learning (RL)** and **Computational Geometry**. Standard virtual keyboards rely on rigid rectangular bounding boxes and intrusive post-hoc dictionary autocorrect, forcing users into frustrating backspace-and-retype cycles.

A2KL eliminates this friction:
- **Zero Label Warping**: Key labels stay fixed in their standard QWERTY positions to protect human visual and muscle memory.
- **Dynamic Voronoi Hitboxes**: The underlying geometric decision boundaries warp silently in response to how and where the user physically taps.
- **Actor-Critic Continuous Policy**: A neural/linear Actor samples spatial coordinate shifts and hitbox weight scaling, guided by a Critic estimating cumulative typing returns via Temporal Difference ($TD(0)$) learning.
- **Retroactive Backspace Penalty**: Pressing `Backspace` delivers an immediate negative reward to the previous state-action pair, contracting the wrong key's hitbox and pushing its centroid away via anti-gradient mechanics.
- **Assistive Accessibility**: Compensates for single-handed thumb drift, motor tremors, fatigue, and spatial variance without cloud latency.

---

## 🚀 Architectural Highlights

| Subsystem | Description |
|---|---|
| **Actor-Critic RL Engine** | Continuous 3-dimensional policy $\pi_\theta(\mathbf{a} \mid \mathbf{s})$ trained via Policy Gradient with Advantage estimation $\delta_t$. |
| **Critic Value Network** | Evaluates expected cumulative return $V_\phi(\mathbf{s})$ via semi-gradient Temporal Difference ($TD(0)$) learning. |
| **Bayesian Touch Decoder** | Combines Gaussian spatial touch likelihood with Laplace-smoothed bigram language priors: $\log P(\text{touch} \mid k) + \omega \log P(k \mid \text{prev})$. |
| **Backspace Anti-Gradient** | Asynchronous credit assignment with temporal decay ($e^{-\Delta t / 1500\text{ms}}$) that contracts mis-classified key boundaries. |
| **3 Hardware Layout Chassis** | Dedicated physical enclosures and calibrated hyperparameter profiles for **Laptop**, **Tablet**, and **Phone**. |
| **WhatsApp Chat Simulator** | Dedicated second tab with full WhatsApp Web/Mobile UI, real bot conversation, and docked adaptive smartphone keyboard. |
| **100% Client-Side Execution** | Zero cloud dependency, zero network latency, and persistent local storage user profiles. |

---

## 🔬 Mathematical & RL Formulation

### 1. Markov Decision Process (MDP)

Typing adaptation is formalized as a continuous state-action MDP $\langle \mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma \rangle$:

#### State Space $\mathbf{s}_t \in \mathbb{R}^7$
Extracted for every keystroke event:
1. **Normalized $\Delta x$**: $(x_{touch} - x_{target}) / 50$
2. **Normalized $\Delta y$**: $(y_{touch} - y_{target}) / 50$
3. **Adjacency Ratio**: Euclidean center distance to competitor normalized by threshold $\tau_{adj}$
4. **Hit/Miss Signal**: $+1.0$ for correct classification, $-1.0$ for typo
5. **Rolling Error Rate**: $e_t \in [0, 1]$ over the last 50 keystrokes
6. **Muscle Memory Drift**: Center deviation from default rest coordinate $\|\mathbf{p}_k - \mathbf{p}_k^0\| / 30$
7. **Linguistic Context Prior**: Normalized log-probability $\frac{1}{5} \log P(\text{char} \mid \text{prev})$

#### Action Space $\mathbf{a}_t \in [-1, 1]^3$
The Actor samples a continuous action vector $\mathbf{a}_t = [a_x, a_y, a_w]$:
- $a_x, a_y$: Horizontal and vertical centroid adaptation scale.
- $a_w$: Voronoi power weight expansion/contraction intensity.

#### Multi-Objective Reward $R_t$
$$R_t = R_{accuracy} - R_{drift} - R_{error}$$
- **Accurate Hit**: $+1.2$
- **Nearby Typo** ($d \le \tau_{adj}$): $-1.5$ (actionable calibration)
- **Distant Motor Slip** ($d > \tau_{adj}$): $-3.5$ (treated as cognitive slip, minimal movement)
- **Ergonomic Drift Penalty**: $-\lambda_{reg} \cdot \frac{\|\mathbf{p}_k - \mathbf{p}_k^0\|}{10}$

---

### 2. Actor-Critic Policy Gradient Updates

1. **Temporal Difference Error ($\delta_t$)**:
   $$\delta_t = R_t + \gamma V_\phi(\mathbf{s}_{t+1}) - V_\phi(\mathbf{s}_t)$$
2. **Critic Update (TD(0))**:
   $$\mathbf{w}_c \leftarrow \mathbf{w}_c + \alpha_c \cdot \delta_t \cdot \mathbf{s}_t, \quad b_c \leftarrow b_c + \alpha_c \cdot \delta_t$$
3. **Actor Update (Policy Gradient with Advantage $\delta_t$)**:
   $$\mathbf{W}_a \leftarrow \mathbf{W}_a + \alpha_a \cdot \delta_t \cdot (\mathbf{a}_t - \boldsymbol{\mu}_t) \mathbf{s}_t^\top, \quad \mathbf{b}_a \leftarrow \mathbf{b}_a + \alpha_a \cdot \delta_t \cdot (\mathbf{a}_t - \boldsymbol{\mu}_t)$$

---

### 3. Asynchronous Credit Assignment (Backspace Anti-Gradient)

When Backspace is pressed:
1. **Temporal Confidence Decay**:
   $$\text{confidence} = \exp\left(-\frac{\Delta t}{1500\text{ ms}}\right)$$
2. **Negative Reward**: Delivers delayed penalty $R = -3.5 \times \text{confidence}$.
3. **Centroid Anti-Gradient**:
   $$\mathbf{p}_{wrong} \leftarrow \mathbf{p}_{wrong} - (\alpha \cdot \text{confidence}) \cdot (\mathbf{x}_{touch} - \mathbf{p}_{wrong})$$
4. **Hitbox Contraction**:
   $$w_{wrong} \leftarrow w_{wrong} - \beta^- \cdot \text{confidence}$$
5. **Retroactive Policy Gradient**: Backpropagates retroactive error $\delta_{retro} = R - V(\mathbf{s}_{t-1})$ through stored transition $(\mathbf{s}_{t-1}, \mathbf{a}_{t-1})$.

---

### 4. Bayesian Touch Decoder

Touch classification on $(\mathbf{x}, \mathbf{y})$ evaluates maximum a posteriori (MAP) score over candidate keys:
$$\text{Score}(k) = -\frac{\|\mathbf{x} - \mathbf{p}_k\|^2 - w_k}{2\sigma^2} + \omega \log P(k \mid \text{prev})$$
Where:
- $\|\mathbf{x} - \mathbf{p}_k\|^2 - w_k$ is the **Laguerre Power Distance**.
- $\sigma = 30\text{px}$ is user touch standard deviation.
- $P(k \mid \text{prev})$ is the Laplace-smoothed English bigram probability ($V = 27$):
  $$P(c_2 \mid c_1) = \frac{\text{Count}(c_1, c_2) + 0.5}{\sum_c \text{Count}(c_1, c) + 27 \times 0.5}$$

---

### 5. Laguerre-Voronoi Power Diagrams

For keys with sites $\mathbf{p}_i$ and weights $w_i$, the decision cell $\text{Cell}(i)$ is defined as:
$$\text{Cell}(i) = \left\{ \mathbf{x} \in \mathbb{R}^2 \;\Big|\; \|\mathbf{x} - \mathbf{p}_i\|^2 - w_i \le \|\mathbf{x} - \mathbf{p}_j\|^2 - w_j \quad \forall j \ne i \right\}$$
Cells are computed using Sutherland-Hodgman polygon clipping against bounding half-planes only when visual wireframes are enabled.

---

## 💻 Hardware Layout Modes

A2KL provides **three distinct hardware layout modes**, each configured with dedicated physical enclosures, aspect ratios, and calibrated RL hyperparameter bounds:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYOUT MATRIX                          │
├─────────────────┬───────────────────┬──────────────────┬───────────────┤
│ Specification   │ 1. Laptop Deck    │ 2. Tablet        │ 3. Phone      │
├─────────────────┼───────────────────┼──────────────────┼───────────────┤
│ Viewport Width  │ 1000 px (960 max) │ 740 px           │ 410 px        │
│ Chassis Frame   │ Aluminum Unibody  │ Rounded Bezel    │ Smartphone    │
│ Hardware Accents│ Webcam + Trackpad │ Front Camera Dot │ Dynamic Island│
│ Key Spacing     │ 100 px (Wide)     │ 78 px (Balanced) │ 38 px (Dense) │
│ Actor Rate (α)  │ 0.20              │ 0.15             │ 0.08          │
│ Voronoi Bounds  │ [200, 8000]       │ [400, 4500]      │ [550, 2200]   │
│ Target Ergonomics│ Two-hand Typing   │ Thumb/Index Mix  │ Thumb Reach   │
└─────────────────┴───────────────────┴──────────────────┴───────────────┘
```

1. **Laptop Mode**:
   - **Chassis**: Full aluminum desktop deck with screen lid accent, blue webcam sensor dot, recessed keyboard tray, and precision multitouch trackpad outline.
   - **Interaction**: Wide key centers designed for ten-finger and desktop typing tests.
2. **Tablet Mode**:
   - **Chassis**: Symmetrical 14px dark bezel with front camera dot, landscape aspect ratio.
   - **Interaction**: Balanced key sizes for landscape two-thumb or single-finger tapping.
3. **Phone Mode**:
   - **Chassis**: Modern smartphone enclosure with Dynamic Island pill, speaker slit, metallic antenna borders, and bottom home indicator swipe bar.
   - **Interaction**: High-density touch targets tuned to single-handed thumb typing with tight Voronoi bounds.

---

## 💬 WhatsApp Messenger Simulator Tab

A dedicated top-level tab (**WhatsApp Simulator**) provides a true conversational testbed:
- **Default Smartphone Enclosure**: Boots directly in **Phone Keyboard Layout** ($410\text{px}$ viewport).
- **Authentic WhatsApp Messenger UI**:
  - Dark WhatsApp theme with `#111b21` background, `#1f2c34` header, and authentic doodle pattern wallpaper.
  - WhatsApp header with verified badge, contact status ("online / RL Active"), audio call, video call, and menu icons.
  - End-to-end on-device processing notification chip.
  - Sent bubbles in authentic WhatsApp green (`#005c4b`) with double blue read checkmarks (`✓✓`).
  - Received bubbles in slate (`#202c33`).
- **Interactive Conversational Bot**:
  - Typing a message on the docked keyboard sends it to the chat.
  - Simulated bot responds with realistic typing indicator (`...`) and provides dynamic feedback summarizing your current WPM, accuracy %, and RL adaptations.
- **Input Bar**: Smile emoji button, paperclip attachment, camera icon, active text pill with blinking green cursor, and circular Send/Mic button.
- **Docked Adaptive Phone Keyboard**:
  - Full real-time touch classification, Voronoi tessellation, and red flash on Backspace negative-reward triggers.
- **Live Telemetry Strip**: Displays live WPM, Accuracy %, Cumulative RL Return, and Backspace correction count above the chat.

---

## 📁 Project Structure

```
adaptiveRL_keyboard/
├── index.html                   # Entry point HTML5 with viewport meta
├── src/
│   ├── App.tsx                  # Root app, tab manager, chassis switcher
│   ├── index.css                # Hardware chassis styling & WhatsApp design
│   ├── main.tsx                 # React DOM bootstrapper
│   ├── components/
│   │   ├── Analytics.tsx        # Live sparkline charts (WPM, Error, RL Return, Drift)
│   │   ├── ConfigPanel.tsx      # RL hyperparameter tuning sliders
│   │   ├── Keyboard.tsx         # SVG virtual keyboard with Voronoi overlay
│   │   ├── SimulationControls.tsx # Typer profiles & phrase benchmark player
│   │   └── WhatsAppChat.tsx     # Dedicated WhatsApp messenger simulator
│   └── rl/
│       ├── KeyboardRLAgent.ts   # Core Multi-Algorithm RL Agent (A2C, DQN, PPO)
│       ├── LanguageModel.ts     # Laplace-smoothed English bigram prior lookup
│       ├── PowerDiagram.ts      # Sutherland-Hodgman Power Diagram clipping
│       ├── TyperSimulator.ts    # Synthetic motor noise, tremor, & fatigue simulator
│       ├── types.ts             # TypeScript definitions for RL parameters, algorithms & stats
│       ├── verify.ts            # Headless RL test suite & convergence tests
│       ├── benchmark.ts         # Multi-algorithm comparative benchmark runner
│       └── index.ts             # Modular package exports
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### Installation
```bash
git clone https://github.com/sanjjey/Adaptive_keyboard.git
cd Adaptive_keyboard
npm install
```

---

## 🏃 Running & Verification Suite

### Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Compiles TypeScript with zero errors and generates optimized client assets.

### Run Headless RL Verification Suite
```bash
npx tsx src/rl/verify.ts
```
Executes all 6 mathematical unit & convergence tests:
- `Test 1`: Power Diagram touch classification.
- `Test 2`: Actor-Critic spatial centroid and weight updates.
- `Test 3`: TD error convergence and Critic loss reduction over 50 transitions.
- `Test 4`: Bigram context prior lookup ratio.
- `Test 5`: Bayesian Decoder context bias resolution.
- `Test 6`: Asynchronous Backspace credit assignment (negative reward & weight contraction).

### Run Quantitative RL Benchmarks
```bash
npx tsx src/rl/benchmark.ts
```
Evaluates 400 simulated keystrokes across all 7 user profiles, reporting Character Error Rate (CER), accuracy improvement, TD error convergence, and mean spatial drift.

---

## 🧠 Multi-Algorithm Reinforcement Learning Suite

A2KL features a **runtime-selectable Multi-Algorithm Reinforcement Learning Engine**. Users and researchers can dynamically toggle between 3 RL algorithms directly from the UI dropdown in both the Lab Studio and WhatsApp testbed:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        A2KL REINFORCEMENT LEARNING ENGINES                             │
├──────────────────┬──────────────────────┬────────────────────────┬─────────────────────┤
│ Engine           │ Action Space         │ Update Strategy        │ Best Use Case       │
├──────────────────┼──────────────────────┼────────────────────────┼─────────────────────┤
│ 1. Actor-Critic  │ Continuous R^3       │ Online On-Policy TD(0) │ Real-time smooth    │
│    (A2C Advantage│ [dx, dy, dw]         │ O(1) single-step       │ physical continuous │
│    Policy Grad)  │ Gaussian policy      │ zero rollout latency   │ centroid tracking   │
├──────────────────┼──────────────────────┼────────────────────────┼─────────────────────┤
│ 2. Deep Q-Net    │ Discrete 9-Actions   │ Experience Replay      │ Quantized decision- │
│    (DQN Replay)  │ Directional &        │ Buffer (D=256),        │ making, off-policy  │
│                  │ Voronoi micro-steps  │ Bellman mini-batches   │ sample reuse        │
├──────────────────┼──────────────────────┼────────────────────────┼─────────────────────┤
│ 3. Proximal Opt  │ Continuous Gaussian  │ Trajectory Rollout     │ Monotonic bounded   │
│    (PPO Clipped) │ R^3 [dx, dy, dw]     │ Buffer (K=16), Clipped │ improvement, stops  │
│                  │ Probability Ratio r  │ Surrogate (eps=0.20)   │ layout deformation  │
└──────────────────┴──────────────────────┴────────────────────────┴─────────────────────┘
```

---

## 📊 Empirical 3-Way Algorithm Benchmark (600 Keystroke Evaluation)

Measured under identical test conditions on the **Right-Drift Typer** (severe horizontal motor bias):

| Algorithm Engine | Baseline Acc | Adapted Acc | Error Reduction | Cumulative Reward | Running TD Error (\|δ\|) | Mean Latency | Convergence Stability |
|---|---|---|---|---|---|---|---|
| **Option 1: Actor-Critic (A2C)** | 90.0% | **95.3%** | **+53.3%** | `+402.1 pts` | `0.257` | `675.7 µs` | High (Smooth O(1) tracking) |
| **Option 2: Deep Q-Network (DQN)** | 86.0% | **97.1%** | **+79.4%** | `+414.6 pts` | `0.311` | `579.4 µs` | Moderate (ε-greedy exploration) |
| **Option 3: Proximal Policy Opt (PPO)** | 89.3% | **97.6%** | **+77.1%** | `+457.7 pts` | `0.006` | `593.8 µs` | **Very High** (Clipped monotonic) |

### Cross-Profile Comparison Matrix (400 Keystroke Evaluation)

| Typer Profile | Baseline Acc | Option 1: Actor-Critic | Option 2: DQN Replay | Option 3: PPO Clipped |
|---|---|---|---|---|
| **Right-Drift Typer** | 88.7% | 95.6% (+61% error reduction) | 95.6% (+73% error reduction) | **96.4% (+74% error reduction)** |
| **Hybrid Profile (Impairs)** | 82.7% | **92.4% (+56% error reduction)** | 86.0% (+5% error reduction) | 90.4% (+10% error reduction) |
| **Numeric Power User** | 98.7% | **99.6% (+70% error reduction)** | 99.2% (stable) | 98.8% (stable) |
| **Tremor Typer (Parkinson's)**| 68.0% | **73.2% (+16% error reduction)** | 72.0% (stable) | 72.8% (+15% error reduction) |
| **Fat Fingers** | 82.7% | **86.0% (+19% error reduction)** | 85.2% (+11% error reduction) | 81.6% (stable) |
| **Standard Typer** | 99.3% | 98.8% (ceiling bound) | 99.6% (+40% error reduction) | **100.0% (ceiling bound)** |

---

## 📱 Running on iPhone / Mobile

A2KL is configured to listen across all network interfaces (`0.0.0.0:5173`), enabling real mobile testing on iPhones and iPads:

### Method 1: Local Wi-Fi Network (Zero Setup)
1. Ensure your iPhone and development PC are connected to the **same Wi-Fi network**.
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open **Safari** on your iPhone and navigate to your computer's local IP:
   ```
   http://192.168.1.40:5173
   ```
   *(If your IP changes, check with `ipconfig` on Windows or `ifconfig` on macOS/Linux).*

### Method 2: Instant Public Tunnel (Outside Home Wi-Fi)
If testing cellular or external networks:
```bash
npx localtunnel --port 5173
```
Open the generated `*.loca.lt` URL directly in iOS Safari.

### Method 3: Full-Screen PWA Mode on iOS
1. In Mobile Safari, tap the **Share** button (box with upward arrow).
2. Tap **"Add to Home Screen"**.
3. Launch **A2KL** from your iPhone home screen to experience the keyboard in distraction-free standalone fullscreen mode.

---

## 🛡️ Is It Truly Reinforcement Learning? & System Robustness

### Why A2KL is Genuine Reinforcement Learning
Unlike simple heuristic moving averages or hardcoded lookups, A2KL satisfies the formal requirements of an RL system:
1. **Markov Decision Process (MDP)**: Agent operates in a defined $\langle \mathcal{S}, \mathcal{A}, \mathcal{R}, \mathcal{P}, \gamma \rangle$ space.
2. **Actor-Critic Continuous Policy**:
   - **Policy $\pi_\theta(\mathbf{a} \mid \mathbf{s})$**: Samples continuous action vectors $\mathbf{a} \in [-1, 1]^3$ via Gaussian exploration $\mathcal{N}(\mu, \sigma^2)$ parameterized by Actor weights.
   - **Value Critic $V_\phi(\mathbf{s})$**: Bootstraps cumulative returns via semi-gradient Temporal Difference ($TD(0)$) updates.
3. **Policy Gradient with Advantage**:
   Updates follow $\nabla_\theta J(\theta) = \mathbb{E}[\nabla_\theta \log \pi_\theta(\mathbf{a} \mid \mathbf{s}) \cdot \delta_t]$, scaling weight and centroid steps directly by the TD advantage $\delta_t$.
4. **Delayed Credit Assignment (Anti-Gradient)**:
   Backspace events deliver an immediate delayed penalty $R = -3.5 \times e^{-\Delta t / 1500\text{ms}}$ to the stored prior state-action tuple $(\mathbf{s}_{t-1}, \mathbf{a}_{t-1})$, retroactively contracting the culprit key's Voronoi power weight and shifting its centroid away.

### Robustness & Stability Guarantees
- **Centroid Bounding**: Hard physical constraints $[8, 992] \times [8, 252]\text{px}$ prevent key centroids from drifting out of view.
- **Power Weight Clamping**: Voronoi weights are clamped strictly within $[\text{minWeight}, \text{maxWeight}]$ to prevent key starvation or explosion.
- **Elastic Regularization ($\lambda_{reg}$)**: Prevents permanent catastrophic drift by decaying unused keys back toward factory QWERTY centers.
- **Bayesian Prior Dampening**: Laplace-smoothed bigram probability prevents anomalous single-tap glitches from corrupting spatial policies.

---

## ⚙️ Hyperparameter Reference

| Hyperparameter | Symbol | Default | Range | Description |
|---|---|---|---|---|
| **Actor Learning Rate** | $\alpha_a$ | `0.15` | `0.01 – 0.50` | Policy gradient step size for centroid shifts. |
| **Critic Learning Rate** | $\alpha_c$ | `0.08` | `0.01 – 0.30` | Semi-gradient step size for value estimation. |
| **Discount Factor** | $\gamma$ | `0.85` | `0.50 – 0.99` | Temporal discount for future typing rewards. |
| **Regularization** | $\lambda_{reg}$ | `0.002` | `0.0001 – 0.02` | Elastic pull back to default rest coordinates. |
| **Weight Growth** | $\beta^+$ | `400` | `50 – 1000` | Voronoi power weight expansion on target key. |
| **Weight Shrink** | $\beta^-$ | `300` | `50 – 1000` | Voronoi power weight contraction on competitor. |
| **Adjacency Threshold** | $\tau_{adj}$ | `140 px` | `50 – 250 px` | Maximum distance to classify a typo as motor slip. |
| **Language Model Weight** | $\omega$ | `0.40` | `0.00 – 2.00` | Multiplier for bigram log-prior in Bayesian decoding. |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

