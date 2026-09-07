# 💰 FinLit AI – Student Financial Assistant

> **SkillUp Hackathon · Problem Statement #6 — AI for Financial Literacy**  
> Built in collaboration with **IBM SkillsBuild**, powered by **IBM Bob**

---

## 📌 Overview

**FinLit AI** is a browser-based AI-assisted financial literacy tool designed specifically for college students. Many students begin managing money independently for the first time during college and lack the knowledge to budget effectively, understand loans, or find scholarships. FinLit AI bridges that gap with five practical, data-driven modules — all running locally in the browser with zero setup required.

---

## 🎯 Problem Statement

Most students lack formal financial education at the exact moment they need it most — when they first become financially independent. This leads to:

- Overspending and accumulating debt
- Missing out on scholarships and grants
- Making uninformed loan decisions
- Having no emergency savings buffer

---

## ✅ Solution

FinLit AI provides an all-in-one student financial assistant with five modules:

| Module | Description |
|---|---|
| 📊 **Dashboard** | Set monthly budget & savings goal; real-time spending health alerts |
| 💸 **Expense Tracker** | Log expenses by category; visual spending breakdown with pattern insights |
| 🤔 **Can I Afford This?** | AI-powered buy/wait analysis against your live budget and savings goal |
| 🎓 **Loan & Scholarship Advisor** | EMI loan calculator + personalized scholarship finder by GPA & major |
| 🤖 **AI Chat Advisor** | 24/7 conversational advisor on budgeting, loans, savings, credit cards & more |

---

## 🚀 Features

- **Zero dependencies** — pure HTML, CSS, and Vanilla JavaScript; no frameworks, no build step
- **Works offline** — loads once, runs entirely in the browser
- **Privacy-first** — all data stored in `localStorage`; nothing leaves your device
- **XSS-safe** — all user input sanitized before DOM insertion
- **Mobile responsive** — tested down to 360px viewport
- **Persistent state** — budget, savings goal, and expenses survive page refreshes

---

## 🖥️ Live Demo / Screenshots

### Dashboard
Set your monthly budget and savings goal. The dashboard immediately reflects your spending health with color-coded alerts.

### Expense Tracker
Add expenses with name, category, amount, and date. Category-wise progress bars reveal your top spending areas at a glance.

### Can I Afford This?
Enter an item, its cost, and whether it's a want, need, or investment. FinLit AI cross-checks it against your remaining budget and savings goal and gives a clear ✅ / ⚠️ / ❌ verdict.

### Loan & Scholarship Advisor
- **Loan Calculator**: Computes monthly EMI, total repayment, and total interest using the standard amortization formula.
- **Scholarship Finder**: Returns curated merit-based and need-based scholarships filtered by your GPA and field of study.

### AI Chat Advisor
Ask anything about student finances. Topics covered: 50/30/20 rule, compound interest, student loans, saving tips, credit cards, emergency funds, scholarships, and more.

---

## 📁 Project Structure

```
IBM_SkillsBuild_project/
├── index.html          # App shell – tab navigation + all section layouts
├── styles.css          # Complete styling (nav, cards, table, chat, responsive)
├── app.js              # All application logic (state, tabs, modules, AI chat KB)
├── README.md           # This file
```

---

## ⚙️ How to Run

No installation or server required.

1. Clone or download the repository:
   ```bash
   git clone https://github.com/Gowrilakshmir12/IBM_SkillsBuild_project.git
   ```
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. That's it — the app runs fully client-side.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (Grid, Flexbox, CSS custom properties) |
| Logic | Vanilla JavaScript (ES6+) |
| Persistence | Browser `localStorage` |
| AI Development | **IBM Bob** (pair programming assistant) |

---

## 🤖 IBM Bob – Role in This Project

IBM Bob was the primary AI-assisted development tool used throughout the entire project lifecycle:

- **Architecture & Planning** — Designed module structure and data flow in Plan mode
- **Code Generation** — Generated all HTML, CSS, and JavaScript with iterative refinement
- **AI Chat Knowledge Base** — Authored all 9 financial literacy KB entries and fallback responses
- **Debugging** — Diagnosed and fixed validation edge cases, scroll behavior, and tab state sync
- **Code Review** — Reviewed for XSS safety, performance, and code clarity
- **Documentation** — Assisted in writing this README and `IBM_BOB_USAGE.md`

See [`IBM_BOB_USAGE.md`](./IBM_BOB_USAGE.md) for the full detailed account.

---

## 📐 Key Algorithms

### EMI (Loan) Calculator
```
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n − 1]

Where:
  P = Principal loan amount
  r = Monthly interest rate (annual rate ÷ 12 ÷ 100)
  n = Total number of monthly payments (years × 12)
```
Edge case: 0% interest → `monthly = P / n` (simple division).

### Affordability Logic
```
remaining = budget − totalSpent
afterBuy  = remaining − cost

if afterBuy >= savingsGoal  →  ✅ Yes, you can afford it
if afterBuy >= 0            →  ⚠️ Possible but tight
if afterBuy < 0             →  ❌ Cannot afford right now
if budget not set           →  💭 Set a budget first (generic advice)
```

---

## 🎓 Hackathon Alignment

**Problem Statement #6 — AI for Financial Literacy**

| Suggested Project Idea | Implemented As |
|---|---|
| Student Expense Analyzer | ✅ Expense Tracker tab with category analytics |
| "Can I Afford This?" AI | ✅ Dedicated affordability analyzer tab |
| Scholarship & Loan Advisor | ✅ Loan EMI calculator + Scholarship Finder tab |

**Track:** FinTech + GenAI Advisory Tools

---

## 👥 Team

| Role | Details |
|---|---|
| Repository | [github.com/Gowrilakshmir12/IBM_SkillsBuild_project](https://github.com/Gowrilakshmir12/IBM_SkillsBuild_project) |
| Hackathon | SkillUp Hackathon in collaboration with IBM SkillsBuild |
| Problem Statement | #6 — AI for Financial Literacy |

---

## 📄 License

This project was created for the SkillUp Hackathon. All rights reserved by the team.
