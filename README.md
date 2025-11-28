# Token Trading Table

This is a **real-time token trading dashboard** built using **Next.js 14**, inspired by platforms like Axiom, DexScreener and Birdeye.  
The project includes live WebSocket updates, advanced filtering, per-column sorting, chain switching, and optimized virtualized rendering.

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

## 🚀 Getting Started

First, install dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```
---

## 🌐 Demo Video (Required Deliverable)

Public YouTube demo video (1–2 min):

➡️ [Demo Link](https://www.youtube.com/watch?v=biMHx_y_Zgo)

---
## 📦 Project Overview

This application displays token market data across three independent columns:

New Pairs
Final Stretch
Migrated

Each column supports:
Independent sorting
Virtualized rendering
Real-time updates
Filtering & pagination tabs
The UI layout mimics a professional trading dashboard.

---
## ✨ Features
🔄 Real-Time Updates

Live price, liquidity, market cap, and 24h volume
WebSocket simulation with batched updates using requestAnimationFrame
Auto-generated new tokens at random intervals

🔍 Advanced Filtering

Keyword search
Excluded keywords
Protocol filter
Quote-token filter
Liquidity min/max
Volume min/max
Fully controlled via a sidebar

↕️ Per-Column Sorting

Each column keeps its own sort state:
Sort by MarketCap, Volume, Liquidity, Time, Price, Holders
ASC/DESC toggle

⚡ High Performance Rendering

Virtualized lists using @tanstack/react-virtual
Memoized sorting and filtering
Only visible rows re-render

🎨 Modern UI

ShadCN + Radix UI
Fully responsive
Sticky header & footer
Dark trading terminal theme
Dynamic icon-based toolbar

---

## 🛠 Tech Stack

Category	Technology
Framework	Next.js 14 (App Router)
Language	TypeScript
Styling	TailwindCSS, ShadCN UI, Radix UI
State	Redux Toolkit
Real-Time	WebSocket mock service
Virtualization	@tanstack/react-virtual

---
## 📐 Architecture
src/
 ├── app/
 
 ├── components/
 
 │     ├── organisms/
 
 │     ├── molecules/
 
 │     ├── ui/
 
 ├── lib/
 
 │     ├── mockData.ts
 
 │     ├── store/
 
 │     ├── websocketMock.ts
 
 ├── types/

### Key Components:

TokenTable — main orchestrator

TokenColumn — virtualized list of tokens

TokenCard — individual token tile

FilterSidebar — filtering UI

PulseHeader — chain switcher + tabs

TickerSettingsModal — ticker configuration

DisplaySettingsModal — UI preferences

---

## 🧠 Design Decisions
1. Why Redux Toolkit?

To avoid prop-drilling across deeply nested components and maintain a global filter & sorting state.

2. WebSocket Batching

To avoid render spikes, updates are buffered:

requestAnimationFrame(() => flushUpdates());


This mirrors real trading UIs.

3. Memoized Sorting System

Sorting uses a comparator map to avoid repeated logic:

const comparator = {
  marketCap: (a, b) => b.marketCap - a.marketCap,
  volume: (a, b) => b.volume24h - a.volume24h,
  ...
}

4. Column Limiting

Each column is capped to MAX = 12 to maintain the intended UI layout.

5. Virtual Rendering

Huge token lists scroll smoothly due to virtual DOM rendering.



