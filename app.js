/* ===================================================
   FinLit AI – app.js
   Modules:
     1. State & Persistence
     2. Tab Navigation
     3. Dashboard
     4. Expense Tracker
     5. Can I Afford This?
     6. Loan & Scholarship Advisor
     7. AI Chat
=================================================== */

// ── 1. State & Persistence ────────────────────────
const STATE_KEY = 'finlit_state';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || {
      budget: 0,
      savingsGoal: 0,
      expenses: []
    };
  } catch { return { budget: 0, savingsGoal: 0, expenses: [] }; }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let state = loadState();

// ── 2. Tab Navigation ─────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') refreshDashboard();
    if (btn.dataset.tab === 'expenses') renderExpenses();
  });
});

// ── 3. Dashboard ──────────────────────────────────
function refreshDashboard() {
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = state.budget - spent;

  document.getElementById('dash-budget').textContent    = fmt(state.budget);
  document.getElementById('dash-spent').textContent     = fmt(spent);
  document.getElementById('dash-remaining').textContent = fmt(remaining);
  document.getElementById('dash-savings').textContent   = fmt(state.savingsGoal);

  const tip = document.getElementById('budget-tip');
  if (state.budget > 0) {
    const pct = (spent / state.budget) * 100;
    let msg = '';
    if (pct >= 100)      msg = `⚠️ You've exceeded your budget by ${fmt(spent - state.budget)}. Review your expenses immediately.`;
    else if (pct >= 80)  msg = `🔶 You've used ${pct.toFixed(0)}% of your budget. Be careful with remaining spending.`;
    else if (pct >= 50)  msg = `✅ You've used ${pct.toFixed(0)}% of your budget. You're on track — keep it up!`;
    else                 msg = `🌟 Great job! You've only spent ${pct.toFixed(0)}% of your budget so far.`;
    if (remaining < state.savingsGoal)
      msg += ` Note: your remaining balance is below your savings goal of ${fmt(state.savingsGoal)}.`;
    tip.textContent = msg;
    tip.className = 'tip-box show';
  } else {
    tip.className = 'tip-box';
  }
}

document.getElementById('set-budget-btn').addEventListener('click', () => {
  const b = parseFloat(document.getElementById('budget-input').value) || 0;
  const s = parseFloat(document.getElementById('savings-input').value) || 0;
  state.budget = b;
  state.savingsGoal = s;
  saveState(state);
  refreshDashboard();
});

// ── 4. Expense Tracker ────────────────────────────
function fmt(n) {
  return '$' + Math.abs(n).toFixed(2);
}

function renderExpenses() {
  const tbody = document.getElementById('expense-tbody');
  tbody.innerHTML = '';
  if (state.expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">No expenses added yet.</td></tr>';
  } else {
    state.expenses.forEach((exp, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escHtml(exp.name)}</td>
        <td><span class="cat-badge">${escHtml(exp.category)}</span></td>
        <td><strong>${fmt(exp.amount)}</strong></td>
        <td>${exp.date || '—'}</td>
        <td><button class="del-btn" data-i="${i}">Remove</button></td>`;
      tbody.appendChild(tr);
    });
  }
  renderSpendingAnalysis();
}

function renderSpendingAnalysis() {
  const wrap = document.getElementById('spending-analysis');
  if (state.expenses.length === 0) { wrap.innerHTML = ''; return; }

  const totals = {};
  state.expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  let html = '<h4>Spending by Category</h4>';
  Object.entries(totals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
    const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
    html += `
      <div class="cat-bar-row">
        <span class="cat-label">${cat}</span>
        <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
        <span class="cat-amount">${fmt(amt)}</span>
      </div>`;
  });

  // Pattern insights
  html += '<div style="margin-top:14px;font-size:0.85rem;color:#57606a;">';
  const topCat = Object.entries(totals).sort((a,b) => b[1]-a[1])[0];
  html += `<strong>Top spending category:</strong> ${topCat[0]} (${fmt(topCat[1])} — ${((topCat[1]/grandTotal)*100).toFixed(0)}% of total)`;
  if (state.budget > 0) {
    const remaining = state.budget - grandTotal;
    html += ` &nbsp;|&nbsp; <strong>Budget remaining:</strong> ${remaining >= 0 ? fmt(remaining) : '-'+fmt(Math.abs(remaining))}`;
  }
  html += '</div>';

  wrap.innerHTML = html;
}

document.getElementById('add-expense-btn').addEventListener('click', () => {
  const name   = document.getElementById('exp-name').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const cat    = document.getElementById('exp-category').value;
  const date   = document.getElementById('exp-date').value;

  if (!name || isNaN(amount) || amount <= 0) {
    alert('Please enter a valid expense name and amount.');
    return;
  }
  state.expenses.push({ name, amount, category: cat, date });
  saveState(state);
  renderExpenses();
  document.getElementById('exp-name').value   = '';
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-date').value   = '';
});

document.getElementById('expense-tbody').addEventListener('click', e => {
  if (e.target.classList.contains('del-btn')) {
    const i = parseInt(e.target.dataset.i);
    state.expenses.splice(i, 1);
    saveState(state);
    renderExpenses();
  }
});

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 5. Can I Afford This? ─────────────────────────
document.getElementById('afford-btn').addEventListener('click', () => {
  const item     = document.getElementById('afford-item').value.trim();
  const cost     = parseFloat(document.getElementById('afford-cost').value);
  const urgency  = document.getElementById('afford-urgency').value;
  const result   = document.getElementById('afford-result');

  if (!item || isNaN(cost) || cost <= 0) {
    alert('Please enter the item name and cost.');
    return;
  }

  const spent     = state.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = state.budget > 0 ? state.budget - spent : null;
  const afterBuy  = remaining !== null ? remaining - cost : null;

  let msg = '', cls = '';

  if (remaining === null) {
    // No budget set — generic advice
    if (urgency === 'need') {
      msg = `📋 <strong>${escHtml(item)}</strong> costs <strong>${fmt(cost)}</strong>. Since it's a necessity, prioritize it — but set a monthly budget first so you can track affordability over time.`;
      cls = 'warn';
    } else if (urgency === 'investment') {
      msg = `📚 <strong>${escHtml(item)}</strong> costs <strong>${fmt(cost)}</strong>. Education/career investments often pay off. If you don't have a budget set, try setting one first to see how this fits in.`;
      cls = 'info';
    } else {
      msg = `💭 <strong>${escHtml(item)}</strong> costs <strong>${fmt(cost)}</strong>. You haven't set a budget yet — set one on the Dashboard so I can give you a precise recommendation.`;
      cls = 'warn';
    }
  } else if (afterBuy >= state.savingsGoal) {
    msg = `✅ <strong>Yes, you can afford it!</strong><br>
      Item: <strong>${escHtml(item)}</strong> — ${fmt(cost)}<br>
      Budget remaining before purchase: <strong>${fmt(remaining)}</strong><br>
      Budget remaining after purchase: <strong>${fmt(afterBuy)}</strong><br>
      Your savings goal of ${fmt(state.savingsGoal)} is still safe. Go ahead!`;
    cls = 'good';
  } else if (afterBuy >= 0) {
    msg = `⚠️ <strong>Possible, but tight.</strong><br>
      Item: <strong>${escHtml(item)}</strong> — ${fmt(cost)}<br>
      After buying, you'd have <strong>${fmt(afterBuy)}</strong> left — below your savings goal of ${fmt(state.savingsGoal)}.<br>
      ${urgency === 'want' ? 'Consider waiting until next month.' : urgency === 'investment' ? 'An investment — consider if it can be financed or deferred.' : 'It\'s a need — try to cut other expenses to compensate.'}`;
    cls = 'warn';
  } else {
    msg = `❌ <strong>You cannot afford this right now.</strong><br>
      Item: <strong>${escHtml(item)}</strong> — ${fmt(cost)}<br>
      You only have <strong>${fmt(remaining)}</strong> left in your budget this month.<br>
      ${urgency === 'want' ? 'Wait until next month or save up.' : urgency === 'investment' ? 'Look for student loans, scholarships, or payment plans.' : 'This is urgent — check the Loan & Scholarship Advisor tab for funding options.'}`;
    cls = 'bad';
  }

  result.innerHTML = msg;
  result.className = `result-box show ${cls}`;
});

// ── 6. Loan & Scholarship Advisor ────────────────
document.getElementById('loan-calc-btn').addEventListener('click', () => {
  const P = parseFloat(document.getElementById('loan-amount').value);
  const r = parseFloat(document.getElementById('loan-rate').value) / 100 / 12;
  const n = parseFloat(document.getElementById('loan-years').value) * 12;
  const res = document.getElementById('loan-result');

  if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || n <= 0) {
    alert('Please fill in all loan fields correctly.');
    return;
  }

  let monthly, totalPaid, totalInterest;
  if (r === 0) {
    monthly = P / n;
    totalPaid = P;
    totalInterest = 0;
  } else {
    monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    totalPaid = monthly * n;
    totalInterest = totalPaid - P;
  }

  const cls = totalInterest / P > 0.5 ? 'warn' : 'good';
  res.innerHTML = `
    <strong>Loan Summary</strong><br>
    Principal: <strong>${fmt(P)}</strong><br>
    Monthly Payment: <strong>${fmt(monthly)}</strong><br>
    Total Paid over ${document.getElementById('loan-years').value} years: <strong>${fmt(totalPaid)}</strong><br>
    Total Interest: <strong>${fmt(totalInterest)}</strong> (${((totalInterest/P)*100).toFixed(1)}% of principal)<br><br>
    💡 <em>Tip: Paying an extra $${(monthly * 0.1).toFixed(0)}/month could save you significant interest over time.</em>`;
  res.className = `result-box show ${cls}`;
});

document.getElementById('scholar-btn').addEventListener('click', () => {
  const major = document.getElementById('scholar-major').value.trim();
  const gpa   = parseFloat(document.getElementById('scholar-gpa').value);
  const need  = document.getElementById('scholar-need').value;
  const res   = document.getElementById('scholar-result');

  if (!major) { alert('Please enter your field of study.'); return; }

  const meritScholarships = [
    { name: 'National Merit Scholarship', req: 'GPA 3.8+', link: 'https://www.nationalmerit.org' },
    { name: 'Gates Scholarship', req: 'GPA 3.3+ / STEM/Humanities', link: 'https://www.gatesfoundation.org' },
    { name: 'Coca-Cola Scholars Program', req: 'Leadership + academics', link: 'https://www.coca-colascholarsfoundation.org' },
    { name: 'Fulbright Program', req: 'Graduate students', link: 'https://www.fulbrightprogram.org' },
  ];
  const needScholarships = [
    { name: 'Federal Pell Grant', req: 'Need-based (FAFSA)', link: 'https://studentaid.gov/understand-aid/types/grants/pell' },
    { name: 'FSEOG Grant', req: 'Exceptional financial need', link: 'https://studentaid.gov/understand-aid/types/grants/fseog' },
    { name: 'Thurgood Marshall Fund', req: 'HBCU students in need', link: 'https://www.tmcfund.org' },
  ];

  let list = [];
  if (need === 'merit' || need === 'both') list = [...list, ...meritScholarships];
  if (need === 'need'  || need === 'both') list = [...list, ...needScholarships];

  let html = `<strong>Recommended scholarships for ${escHtml(major)}</strong><br>
    ${!isNaN(gpa) ? `GPA: ${gpa.toFixed(1)} — ${gpa >= 3.5 ? '✅ Strong academic profile' : gpa >= 3.0 ? '🔶 Good profile — target need-based options too' : '❗ Consider community college transfer programs'}<br>` : ''}
    <ul style="margin-top:10px;padding-left:18px;line-height:2">`;
  list.forEach(s => {
    html += `<li><a href="${s.link}" target="_blank" rel="noopener">${s.name}</a> — <em>${s.req}</em></li>`;
  });
  html += `</ul>
    <br>💡 <em>Always check your university's financial aid office for institution-specific scholarships in ${escHtml(major)}.</em>`;

  res.innerHTML = html;
  res.className = 'result-box show info';
});

// ── 7. AI Chat ────────────────────────────────────
const KB = [
  {
    keys: ['budget','50/30/20','rule'],
    answer: `The <strong>50/30/20 rule</strong> is a simple budgeting framework:<br>
    • <strong>50%</strong> of income → Needs (rent, food, utilities)<br>
    • <strong>30%</strong> → Wants (entertainment, dining out)<br>
    • <strong>20%</strong> → Savings & debt repayment<br><br>
    As a student, you might flip it: 60% needs, 10% wants, 30% savings if you're trying to build an emergency fund.`
  },
  {
    keys: ['create','make','start','budget','plan'],
    answer: `Here's how to create a student budget in 5 steps:<br>
    1. <strong>Track income</strong> — part-time job, allowance, financial aid<br>
    2. <strong>List fixed expenses</strong> — rent, tuition, subscriptions<br>
    3. <strong>Estimate variable expenses</strong> — food, transport, entertainment<br>
    4. <strong>Set a savings goal</strong> — even $50/month builds good habits<br>
    5. <strong>Review weekly</strong> — use the Expense Tracker tab here!`
  },
  {
    keys: ['compound','interest'],
    answer: `<strong>Compound interest</strong> means you earn (or owe) interest on interest.<br><br>
    Formula: <code>A = P(1 + r/n)^(nt)</code><br>
    Example: $1,000 at 5% for 10 years = <strong>$1,629</strong> with annual compounding.<br><br>
    For debt (like credit cards), compound interest works <em>against</em> you — pay more than the minimum whenever possible!`
  },
  {
    keys: ['student loan','loan','loans','borrow','debt'],
    answer: `Student loans 101:<br>
    • <strong>Federal loans</strong> have lower interest rates and flexible repayment options (income-driven repayment, deferment)<br>
    • <strong>Private loans</strong> may have higher rates — exhaust federal options first<br>
    • <strong>Subsidized loans</strong> — govt pays interest while you're in school<br>
    • <strong>Unsubsidized loans</strong> — interest accrues from day one<br><br>
    Use the <em>Loan Calculator</em> tab to see exactly how much you'll repay!`
  },
  {
    keys: ['save','saving','savings','tip','tips','money'],
    answer: `Top 7 ways to save money as a student:<br>
    1. Cook meals at home — dining out is your budget's biggest enemy<br>
    2. Use student discounts (Spotify, Adobe, Amazon Prime, transport)<br>
    3. Buy used textbooks or rent them<br>
    4. Walk or bike instead of rideshares<br>
    5. Cancel unused subscriptions<br>
    6. Build a $500 emergency fund before anything else<br>
    7. Automate a small transfer to savings on payday`
  },
  {
    keys: ['scholarship','grant','free money','financial aid'],
    answer: `Finding scholarships:<br>
    • <strong>FAFSA</strong> first — unlocks federal grants (free money!)<br>
    • Your university's financial aid portal — institution-specific awards<br>
    • <strong>Fastweb, Scholarships.com, Bold.org</strong> — large scholarship databases<br>
    • Local community foundations, professional associations in your field<br>
    • Employers of your parents may offer dependent scholarships<br><br>
    Use our <em>Scholarship Finder</em> tab for personalized suggestions!`
  },
  {
    keys: ['credit card','credit','credit score'],
    answer: `Credit cards for students:<br>
    • A student credit card is a great way to build credit history early<br>
    • <strong>Always pay the full balance</strong> — never just the minimum<br>
    • Keep utilization below <strong>30%</strong> of your credit limit<br>
    • A good credit score (700+) saves you thousands on future loans and rent<br>
    • Avoid cash advances — interest starts immediately`
  },
  {
    keys: ['emergency fund','emergency'],
    answer: `An emergency fund is money set aside for unexpected expenses (car repair, medical bill, job loss).<br><br>
    As a student, aim for <strong>$500–$1,000</strong> to start. Keep it in a high-yield savings account (not checking). Even saving $10/week adds up to $520 in a year!`
  },
  {
    keys: ['afford','can i','purchase','buy'],
    answer: `To check if you can afford something, go to the <strong>"Can I Afford This?"</strong> tab. Enter the item, cost, and whether it's a want, need, or investment — I'll analyze it against your current budget!`
  },
];

function getAIResponse(input) {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.keys.some(k => lower.includes(k))) {
      return entry.answer;
    }
  }
  // Fallback
  return `That's a great question! Here's general financial advice for students:<br>
  • Track every expense — awareness is step 1<br>
  • Live below your means — spend less than you earn<br>
  • Invest in your education — it's the highest-ROI investment<br>
  • Avoid lifestyle inflation as your income grows<br><br>
  Try asking about: <em>budgeting, student loans, saving tips, scholarships, compound interest, or credit cards</em>.`;
}

function appendChatMsg(text, role) {
  const wrap = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <span class="chat-avatar">${role === 'bot' ? '🤖' : '🎓'}</span>
    <div class="chat-bubble">${text}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function sendChatMessage(text) {
  if (!text.trim()) return;
  appendChatMsg(escHtml(text), 'user');
  document.getElementById('chat-input').value = '';
  setTimeout(() => {
    appendChatMsg(getAIResponse(text), 'bot');
  }, 400);
}

document.getElementById('chat-send-btn').addEventListener('click', () => {
  sendChatMessage(document.getElementById('chat-input').value);
});

document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChatMessage(e.target.value);
});

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => sendChatMessage(btn.dataset.q));
});

// ── Init ──────────────────────────────────────────
refreshDashboard();
renderExpenses();
document.getElementById('exp-date').valueAsDate = new Date();
