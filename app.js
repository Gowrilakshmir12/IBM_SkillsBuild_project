/* ===================================================
   FinLit AI – app.js
   Interactive Financial Assistant with 3D Money Vault
   and Physics Flying Cash & Coin Spending Animations
   =================================================== */

// ── 1. State & Persistence ────────────────────────
const STATE_KEY = 'finlit_state';
const SOUND_KEY = 'finlit_sound_enabled';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || {
      budget: 1500,
      savingsGoal: 300,
      expenses: [
        { name: 'Semester Textbooks', amount: 180, category: 'Education', date: '2026-09-01' },
        { name: 'Weekly Groceries', amount: 65, category: 'Food', date: '2026-09-02' },
        { name: 'Campus Bus Pass', amount: 45, category: 'Transport', date: '2026-09-03' }
      ]
    };
  } catch {
    return {
      budget: 1500,
      savingsGoal: 300,
      expenses: [
        { name: 'Semester Textbooks', amount: 180, category: 'Education', date: '2026-09-01' },
        { name: 'Weekly Groceries', amount: 65, category: 'Food', date: '2026-09-02' },
        { name: 'Campus Bus Pass', amount: 45, category: 'Transport', date: '2026-09-03' }
      ]
    };
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let state = loadState();
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false'; // default true
let currentDisplayedBalance = 0;

// ── 2. Procedural Web Audio FX ────────────────────
const audioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playCoinSound(frequency = 1200, decay = 0.25) {
  if (!soundEnabled || !audioCtx) return;
  try {
    resumeAudio();
    const now = audioCtx.currentTime;

    // Carrier oscillator (crisp metallic sine chime)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.8, now + decay);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + decay);
  } catch (e) {
    // Graceful fallback
  }
}

function playWhooshSound() {
  if (!soundEnabled || !audioCtx) return;
  try {
    resumeAudio();
    const now = audioCtx.currentTime;
    const duration = 0.35;

    // Aerodynamic white noise flutter for bills
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    filter.Q.setValueAtTime(3, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.15, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch (e) {}
}

function playChaChingSound() {
  if (!soundEnabled || !audioCtx) return;
  try {
    resumeAudio();
    // Upbeat ascending arpeggio chord
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => playCoinSound(freq, 0.4), idx * 60);
    });
  } catch (e) {}
}

// Sound toggle UI handler
const soundBtn = document.getElementById('vault-sound-btn');
function updateSoundBtnUI() {
  if (!soundBtn) return;
  if (soundEnabled) {
    soundBtn.textContent = '🔊 Sound ON';
    soundBtn.style.color = '#34d399';
  } else {
    soundBtn.textContent = '🔇 Sound OFF';
    soundBtn.style.color = '#94a3b8';
  }
}
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'true' : 'false');
    updateSoundBtnUI();
    if (soundEnabled) playCoinSound(1000, 0.2);
  });
  updateSoundBtnUI();
}

// ── 3. Tab Navigation ─────────────────────────────
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

// ── 4. Formatting Helpers ─────────────────────────
function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Smooth Number Counter Animation
function animateBalanceCounter(targetVal) {
  const numEl = document.getElementById('vault-balance-num');
  const miniEl = document.getElementById('mini-vault-balance');
  if (!numEl) return;

  const startVal = currentDisplayedBalance;
  const startTime = performance.now();
  const duration = 650; // ms

  function updateCount(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const curr = startVal + (targetVal - startVal) * ease;

    const formatted = (curr < 0 ? '-' : '') + fmt(curr);
    numEl.textContent = formatted;
    if (miniEl) miniEl.textContent = formatted;

    if (curr < 0) {
      numEl.classList.add('negative');
    } else {
      numEl.classList.remove('negative');
    }

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      currentDisplayedBalance = targetVal;
    }
  }

  requestAnimationFrame(updateCount);
}

// ── 5. Dynamic Money Vault & Coin Pile Engine ─────
function renderMoneyPile(remaining, budget) {
  const pileContainer = document.getElementById('money-pile');
  const emptyAlert = document.getElementById('vault-empty-alert');
  const statusBadge = document.getElementById('vault-status-badge');
  const pctBadge = document.getElementById('vault-balance-pct');
  const meterFill = document.getElementById('vault-meter-fill');
  const ambientGlow = document.getElementById('ambient-glow');

  if (!pileContainer) return;

  // Clear previous pile items
  pileContainer.innerHTML = '';

  const pct = budget > 0 ? (remaining / budget) * 100 : 0;
  animateBalanceCounter(remaining);

  // Meter Fill & Percentage Badge
  if (meterFill) {
    const displayPct = Math.max(0, Math.min(100, pct));
    meterFill.style.width = displayPct + '%';
    meterFill.className = 'vault-meter-fill' + (pct <= 20 ? ' danger' : pct <= 50 ? ' warning' : '');
  }

  if (pctBadge) {
    if (pct <= 0) {
      pctBadge.textContent = '0% (Overspent)';
      pctBadge.className = 'hud-pct-badge danger';
    } else {
      pctBadge.textContent = `${pct.toFixed(0)}% Left`;
      pctBadge.className = 'hud-pct-badge' + (pct <= 20 ? ' danger' : pct <= 50 ? ' warning' : '');
    }
  }

  // Status Badge & Ambient Glow
  if (statusBadge && ambientGlow) {
    if (remaining <= 0) {
      statusBadge.textContent = 'Vault Depleted 🔴';
      statusBadge.className = 'vault-badge danger';
      ambientGlow.className = 'ambient-glow danger';
    } else if (pct <= 25) {
      statusBadge.textContent = 'Low Reserves 🟠';
      statusBadge.className = 'vault-badge danger';
      ambientGlow.className = 'ambient-glow danger';
    } else if (pct <= 55) {
      statusBadge.textContent = 'Moderate Funds 🟡';
      statusBadge.className = 'vault-badge warning';
      ambientGlow.className = 'ambient-glow warning';
    } else {
      statusBadge.textContent = 'Loaded Reserves 🟢';
      statusBadge.className = 'vault-badge';
      ambientGlow.className = 'ambient-glow';
    }
  }

  // If completely depleted
  if (remaining <= 0) {
    if (emptyAlert) emptyAlert.style.display = 'block';
    return;
  } else {
    if (emptyAlert) emptyAlert.style.display = 'none';
  }

  // Calculate pile volume tiers based on remaining funds
  // Tier 1 (Small): 1 bundle, 8 coins
  // Tier 2 (Medium): 2-3 bundles, 16 coins
  // Tier 3 (Full): 4-5 bundles, 28 coins
  // Tier 4 (Overflowing): 6 bundles, 40+ coins
  let numBundles = 1;
  let numCoins = 10;

  if (remaining > 1500) {
    numBundles = 6;
    numCoins = 42;
  } else if (remaining > 900) {
    numBundles = 4;
    numCoins = 32;
  } else if (remaining > 400) {
    numBundles = 3;
    numCoins = 22;
  } else if (remaining > 150) {
    numBundles = 2;
    numCoins = 14;
  }

  // 1. Position Cash Bundles on the Pedestal
  const bundleConfigs = [
    { x: -50, y: 15, rotZ: -12, scale: 1 },
    { x: 35, y: 18, rotZ: 10, scale: 1 },
    { x: -10, y: 35, rotZ: 4, scale: 0.98 },
    { x: 55, y: 40, rotZ: -8, scale: 0.95 },
    { x: -65, y: 45, rotZ: 14, scale: 0.92 },
    { x: 10, y: 60, rotZ: -3, scale: 0.9 }
  ];

  for (let b = 0; b < Math.min(numBundles, bundleConfigs.length); b++) {
    const cfg = bundleConfigs[b];
    const bundle = document.createElement('div');
    bundle.className = 'cash-bundle';
    bundle.style.left = `calc(50% + ${cfg.x}px)`;
    bundle.style.bottom = `${cfg.y}px`;
    bundle.style.transform = `translateX(-50%) rotateZ(${cfg.rotZ}deg) scale(${cfg.scale})`;
    bundle.title = 'Crisp $100 Reserve Bundle';

    const band = document.createElement('span');
    band.className = 'bill-band';
    bundle.appendChild(band);

    bundle.addEventListener('click', (e) => {
      e.stopPropagation();
      playWhooshSound();
      playCoinSound(1400, 0.2);
      bundle.style.transform = `translateX(-50%) translateY(-10px) rotateZ(${cfg.rotZ + 5}deg) scale(1.15)`;
      setTimeout(() => {
        bundle.style.transform = `translateX(-50%) rotateZ(${cfg.rotZ}deg) scale(${cfg.scale})`;
      }, 300);
    });

    pileContainer.appendChild(bundle);
  }

  // 2. Position Golden Coins (staggered stacks and scattered gold)
  const coinSeeds = [
    // Center stack
    { x: -15, y: 6, rot: 5 }, { x: -15, y: 14, rot: -3 }, { x: -15, y: 22, rot: 4 }, { x: -15, y: 30, rot: -2 },
    // Left stack
    { x: -85, y: 4, rot: -10 }, { x: -85, y: 12, rot: 8 }, { x: -85, y: 20, rot: -5 },
    // Right stack
    { x: 75, y: 5, rot: 12 }, { x: 75, y: 13, rot: -8 }, { x: 75, y: 21, rot: 6 },
    // Foreground scattering
    { x: -55, y: -4, rot: 25 }, { x: -30, y: -2, rot: -15 }, { x: 5, y: -5, rot: 18 }, { x: 40, y: -3, rot: -20 }, { x: 95, y: -2, rot: 14 },
    // Mid-ground layers
    { x: -110, y: 8, rot: 30 }, { x: 110, y: 10, rot: -25 }, { x: -40, y: 28, rot: 12 }, { x: 25, y: 30, rot: -14 },
    { x: -70, y: 35, rot: -18 }, { x: 60, y: 38, rot: 15 }, { x: -5, y: 50, rot: 8 }, { x: 30, y: 52, rot: -6 },
    // Upper crests for large balances
    { x: -25, y: 68, rot: 10 }, { x: 15, y: 70, rot: -12 }, { x: -50, y: 60, rot: 20 }, { x: 45, y: 62, rot: -15 },
    { x: 0, y: 85, rot: 4 }, { x: -12, y: 95, rot: -8 }, { x: 10, y: 98, rot: 6 },
    { x: -75, y: 18, rot: -15 }, { x: 85, y: 19, rot: 12 }, { x: -100, y: 2, rot: 28 }, { x: 105, y: 3, rot: -22 },
    { x: -35, y: 45, rot: -5 }, { x: 40, y: 46, rot: 9 }, { x: -60, y: 52, rot: 14 }, { x: 65, y: 54, rot: -11 },
    { x: -2, y: 110, rot: 0 }
  ];

  for (let c = 0; c < Math.min(numCoins, coinSeeds.length); c++) {
    const s = coinSeeds[c];
    const coin = document.createElement('div');
    coin.className = 'gold-coin';
    coin.style.left = `calc(50% + ${s.x}px)`;
    coin.style.bottom = `${s.y}px`;
    coin.style.transform = `translateX(-50%) rotate(${s.rot}deg)`;
    coin.title = 'Shiny Golden Coin ($)';

    // Playful bounce & coin chime on click
    coin.addEventListener('click', (e) => {
      e.stopPropagation();
      playCoinSound(1300 + Math.random() * 400, 0.2);
      coin.style.transform = `translateX(-50%) translateY(-14px) scale(1.2) rotate(${s.rot + 25}deg)`;
      setTimeout(() => {
        coin.style.transform = `translateX(-50%) rotate(${s.rot}deg)`;
      }, 250);
    });

    pileContainer.appendChild(coin);
  }

  // 3. Shimmering Ambient Sparkles
  for (let sp = 0; sp < 4; sp++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'shimmer-sparkle';
    sparkle.style.left = `calc(50% + ${(Math.random() * 180 - 90)}px)`;
    sparkle.style.bottom = `${Math.random() * 90 + 20}px`;
    sparkle.style.animationDelay = `${(sp * 0.6)}s`;
    pileContainer.appendChild(sparkle);
  }
}

// ── 6. 3D Parallax Tilt Effect ────────────────────
function initVault3DTilt() {
  const stage = document.getElementById('vault-stage');
  const pedestal = document.getElementById('pedestal-container');
  if (!stage || !pedestal) return;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotY = (x / (rect.width / 2)) * 14;
    const rotX = -((y / (rect.height / 2)) * 10);

    pedestal.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });

  stage.addEventListener('mouseleave', () => {
    pedestal.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });

  // Stage click: coin clinks
  stage.addEventListener('click', (e) => {
    if (e.target === stage || e.target.classList.contains('ambient-glow') || e.target.classList.contains('pedestal-top')) {
      playCoinSound(1200 + Math.random() * 300, 0.25);
      pedestal.classList.add('shake');
      setTimeout(() => pedestal.classList.remove('shake'), 450);
    }
  });
}

// ── 7. FLYING AWAY SPENDING ANIMATION SYSTEM ──────
function triggerSpendFlyAway(amount, label = 'Spent') {
  const particlesLayer = document.getElementById('flying-particles-layer');
  const pedestal = document.getElementById('pedestal-container');
  if (!particlesLayer) return;

  // Shake the pedestal when money is extracted
  if (pedestal) {
    pedestal.classList.remove('shake');
    void pedestal.offsetWidth; // Force reflow
    pedestal.classList.add('shake');
    setTimeout(() => pedestal.classList.remove('shake'), 500);
  }

  // Play realistic sounds
  playWhooshSound();
  setTimeout(() => playCoinSound(1400, 0.3), 80);
  setTimeout(() => playCoinSound(1650, 0.25), 180);

  // Number of particles based on expense amount
  const billCount = Math.min(7, Math.max(3, Math.floor(amount / 20)));
  const coinCount = Math.min(12, Math.max(5, Math.floor(amount / 10)));

  // Center coordinates of the vault stage
  const originX = particlesLayer.offsetWidth / 2;
  const originY = particlesLayer.offsetHeight * 0.72;

  // 1. Spawn Fluttering 3D Bills
  for (let i = 0; i < billCount; i++) {
    const bill = document.createElement('div');
    bill.className = 'flying-bill';

    // Random trajectory: fly left, right, or upwards with aerodynamic wind drift
    const angle = (Math.PI * 0.65) + (Math.random() * Math.PI * 0.7); // upward fan
    const distance = 160 + Math.random() * 160;
    const dx = Math.cos(angle) * distance;
    const dy = -Math.abs(Math.sin(angle) * distance) - 40;

    bill.style.setProperty('--dx', `${dx}px`);
    bill.style.setProperty('--dy', `${dy}px`);
    bill.style.left = `${originX + (Math.random() * 60 - 30)}px`;
    bill.style.top = `${originY + (Math.random() * 30 - 15)}px`;
    bill.style.animationDelay = `${i * 0.08}s`;

    particlesLayer.appendChild(bill);
    setTimeout(() => bill.remove(), 1400);
  }

  // 2. Spawn Spinning Gold Coins
  for (let j = 0; j < coinCount; j++) {
    const coin = document.createElement('div');
    coin.className = 'flying-coin';

    const angle = (Math.random() * Math.PI); // full upper arc
    const distance = 130 + Math.random() * 150;
    const dx = Math.cos(angle) * distance;
    const dy = -Math.abs(Math.sin(angle) * distance) - 60;

    coin.style.setProperty('--dx', `${dx}px`);
    coin.style.setProperty('--dy', `${dy}px`);
    coin.style.left = `${originX + (Math.random() * 70 - 35)}px`;
    coin.style.top = `${originY + (Math.random() * 30 - 15)}px`;
    coin.style.animationDelay = `${j * 0.05 + 0.05}s`;

    particlesLayer.appendChild(coin);
    setTimeout(() => coin.remove(), 1300);
  }

  // 3. Floating Red Spend Badge (-$XX.XX 💸)
  const tag = document.createElement('div');
  tag.className = 'spend-fly-tag';
  tag.textContent = `-${fmt(amount)} 💸`;
  tag.style.setProperty('--start-x', `${(Math.random() * 60 - 30)}px`);
  tag.style.left = `${originX - 50}px`;
  tag.style.top = `${originY - 50}px`;

  particlesLayer.appendChild(tag);
  setTimeout(() => tag.remove(), 1500);

  // 4. Also trigger mini flyout if user is looking at Expense tab
  triggerMiniExpenseFlyout(amount);
}

// Reverse Celebratory Refund / Fund Deposit Animation
function triggerRefundRain(amount) {
  const particlesLayer = document.getElementById('flying-particles-layer');
  if (!particlesLayer) return;

  playChaChingSound();

  const originX = particlesLayer.offsetWidth / 2;
  const originY = particlesLayer.offsetHeight * 0.72;

  // Rain in green bills and gold coins
  for (let i = 0; i < 6; i++) {
    const bill = document.createElement('div');
    bill.className = 'flying-bill refund-rain-item';
    const dx = (Math.random() * 220 - 110);
    bill.style.setProperty('--dx', `${dx}px`);
    bill.style.left = `${originX + dx}px`;
    bill.style.top = `${originY - 40}px`;
    bill.style.animationDelay = `${i * 0.09}s`;

    particlesLayer.appendChild(bill);
    setTimeout(() => bill.remove(), 1300);
  }

  // Floating Green Refund Tag (+$XX.XX 💰)
  const tag = document.createElement('div');
  tag.className = 'refund-fly-tag';
  tag.textContent = `+${fmt(amount)} 💰`;
  tag.style.setProperty('--start-x', `${(Math.random() * 40 - 20)}px`);
  tag.style.left = `${originX - 50}px`;
  tag.style.top = `${originY - 50}px`;

  particlesLayer.appendChild(tag);
  setTimeout(() => tag.remove(), 1500);
}

// Mini flyout on Expense Tracker tab pill
function triggerMiniExpenseFlyout(amount) {
  const anchor = document.getElementById('mini-vault-flyer-anchor');
  if (!anchor) return;

  const miniTag = document.createElement('div');
  miniTag.className = 'spend-fly-tag';
  miniTag.style.position = 'absolute';
  miniTag.style.top = '-10px';
  miniTag.style.left = '50%';
  miniTag.style.fontSize = '0.78rem';
  miniTag.style.padding = '4px 10px';
  miniTag.textContent = `-${fmt(amount)} 💸`;

  anchor.appendChild(miniTag);
  setTimeout(() => miniTag.remove(), 1400);
}

// ── 8. Dashboard & Expense Logic ──────────────────
function refreshDashboard() {
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = state.budget - spent;

  document.getElementById('dash-budget').textContent    = fmt(state.budget);
  document.getElementById('dash-spent').textContent     = fmt(spent);
  document.getElementById('dash-remaining').textContent = fmt(remaining);
  document.getElementById('dash-savings').textContent   = fmt(state.savingsGoal);

  // Render the interactive 3D money pile & live HUD
  renderMoneyPile(remaining, state.budget);

  // Tip box
  const tip = document.getElementById('budget-tip');
  if (state.budget > 0) {
    const pct = (spent / state.budget) * 100;
    let msg = '';
    if (pct >= 100)      msg = `⚠️ You've exceeded your monthly budget by ${fmt(spent - state.budget)}. Review your expenses immediately to prevent further deficit.`;
    else if (pct >= 80)  msg = `🔶 You've used ${pct.toFixed(0)}% of your budget. Be cautious with discretionary spending.`;
    else if (pct >= 50)  msg = `✅ You've used ${pct.toFixed(0)}% of your budget. You're on track — keep maintaining this discipline!`;
    else                 msg = `🌟 Fantastic! You've only spent ${pct.toFixed(0)}% of your budget so far. Your vault is loaded.`;
    if (remaining < state.savingsGoal)
      msg += ` Note: Your remaining balance is below your target savings goal of ${fmt(state.savingsGoal)}.`;
    tip.textContent = msg;
    tip.className = 'tip-box show';
  } else {
    tip.className = 'tip-box';
  }
}

document.getElementById('set-budget-btn').addEventListener('click', () => {
  const b = parseFloat(document.getElementById('budget-input').value) || 0;
  const s = parseFloat(document.getElementById('savings-input').value) || 0;
  const oldBudget = state.budget;

  state.budget = b;
  state.savingsGoal = s;
  saveState(state);

  if (b > oldBudget) {
    triggerRefundRain(b - oldBudget);
  }
  refreshDashboard();
});

// ── 9. Interactive Sandbox Test Buttons ───────────
document.querySelectorAll('.test-spend-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = parseFloat(btn.dataset.amt);
    if (amt > 0) {
      // Add a quick demo expense
      const titles = { 15: 'Coffee & Snack ☕', 50: 'Campus Groceries 🛒', 100: 'Course Supplies 🎒' };
      const expName = titles[amt] || 'Quick Spend';
      state.expenses.unshift({
        name: expName,
        amount: amt,
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      });
      saveState(state);

      // Trigger spectacular flying-away animations
      triggerSpendFlyAway(amt, expName);
      refreshDashboard();
      renderExpenses();
    }
  });
});

document.querySelectorAll('.test-replenish-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = parseFloat(btn.dataset.amt);
    if (amt > 0) {
      // Deposit money to budget
      state.budget += amt;
      saveState(state);
      triggerRefundRain(amt);
      refreshDashboard();
    }
  });
});

// ── 10. Expense Tracker Handlers ──────────────────
function renderExpenses() {
  const tbody = document.getElementById('expense-tbody');
  tbody.innerHTML = '';
  if (state.expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:22px">No expenses added yet. Add an expense above to see money fly away!</td></tr>';
  } else {
    state.expenses.forEach((exp, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escHtml(exp.name)}</strong></td>
        <td><span class="cat-badge">${escHtml(exp.category)}</span></td>
        <td><strong style="color:#dc2626">${fmt(exp.amount)}</strong></td>
        <td>${exp.date || '—'}</td>
        <td><button class="del-btn" data-i="${i}" title="Remove and refund to vault">Remove</button></td>`;
      tbody.appendChild(tr);
    });
  }

  // Also update mini balance pill in Expense Tracker
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = state.budget - spent;
  const miniEl = document.getElementById('mini-vault-balance');
  if (miniEl) miniEl.textContent = (remaining < 0 ? '-' : '') + fmt(remaining);

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

  let html = '<h4>Spending Breakdown by Category</h4>';
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
  html += '<div style="margin-top:16px;font-size:0.88rem;color:#64748b;line-height:1.5;">';
  const topCat = Object.entries(totals).sort((a,b) => b[1]-a[1])[0];
  if (topCat) {
    html += `<strong>Top spending category:</strong> <span style="color:#0f2742">${topCat[0]}</span> (${fmt(topCat[1])} — ${((topCat[1]/grandTotal)*100).toFixed(0)}% of total)`;
  }
  if (state.budget > 0) {
    const remaining = state.budget - grandTotal;
    html += ` &nbsp;|&nbsp; <strong>Vault remaining:</strong> <span style="color:${remaining >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">${remaining >= 0 ? fmt(remaining) : '-'+fmt(Math.abs(remaining))}</span>`;
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
    alert('Please enter a valid expense name and positive amount.');
    return;
  }

  state.expenses.unshift({ name, amount, category: cat, date });
  saveState(state);

  // Trigger the fly-away animation
  triggerSpendFlyAway(amount, name);

  renderExpenses();
  refreshDashboard();

  document.getElementById('exp-name').value   = '';
  document.getElementById('exp-amount').value = '';
});

document.getElementById('expense-tbody').addEventListener('click', e => {
  if (e.target.classList.contains('del-btn')) {
    const i = parseInt(e.target.dataset.i);
    const removed = state.expenses.splice(i, 1)[0];
    saveState(state);

    if (removed && removed.amount > 0) {
      triggerRefundRain(removed.amount);
    }

    renderExpenses();
    refreshDashboard();
  }
});

// ── 11. Can I Afford This? ────────────────────────
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
      Vault balance before purchase: <strong>${fmt(remaining)}</strong><br>
      Vault balance after purchase: <strong>${fmt(afterBuy)}</strong><br>
      Your savings goal of ${fmt(state.savingsGoal)} will remain completely intact.`;
    cls = 'good';
  } else if (afterBuy >= 0) {
    msg = `⚠️ <strong>Possible, but tight.</strong><br>
      Item: <strong>${escHtml(item)}</strong> — ${fmt(cost)}<br>
      After buying, you'd only have <strong>${fmt(afterBuy)}</strong> left — dipping into your savings goal of ${fmt(state.savingsGoal)}.<br>
      ${urgency === 'want' ? 'Consider waiting until next month.' : urgency === 'investment' ? 'An investment — consider if it can be financed or deferred.' : 'It\'s a necessity — try trimming other expenses to compensate.'}`;
    cls = 'warn';
  } else {
    msg = `❌ <strong>You cannot afford this right now.</strong><br>
      Item: <strong>${escHtml(item)}</strong> — ${fmt(cost)}<br>
      You only have <strong>${fmt(remaining)}</strong> left in your vault this month.<br>
      Buying this would put your vault in deficit by <strong>${fmt(Math.abs(afterBuy))}</strong>.<br>
      ${urgency === 'want' ? 'Wait until next month or save up.' : urgency === 'investment' ? 'Look for student grants, scholarships, or payment plans.' : 'This is urgent — check the Loan & Scholarship Advisor tab for funding options.'}`;
    cls = 'bad';
  }

  result.innerHTML = msg;
  result.className = `result-box show ${cls}`;
});

// ── 12. Loan & Scholarship Advisor ────────────────
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
    <strong>Loan Repayment Summary</strong><br>
    Monthly Payment: <strong>${fmt(monthly)}</strong><br>
    Total Repaid (Principal + Interest): <strong>${fmt(totalPaid)}</strong><br>
    Total Interest Paid: <strong>${fmt(totalInterest)}</strong> (${((totalInterest / P) * 100).toFixed(0)}% of principal)<br>
    <small style="color:#64748b">Tip: Paying even $25 extra/month cuts significant interest over time!</small>`;
  res.className = `result-box show ${cls}`;
});

// Scholarships database
const SCHOLARSHIPS = [
  { name: 'IBM SkillsBuild Tech Scholarship', type: 'both', minGpa: 3.0, majors: ['cs', 'tech', 'engineering', 'it', 'software', 'data'], award: '$5,000' },
  { name: 'Future Innovators STEM Grant', type: 'merit', minGpa: 3.5, majors: ['stem', 'science', 'math', 'engineering', 'cs'], award: '$7,500' },
  { name: 'First-Generation Student Fund', type: 'need', minGpa: 2.5, majors: ['all'], award: '$3,000' },
  { name: 'Global Diversity in Business Award', type: 'both', minGpa: 3.0, majors: ['business', 'finance', 'economics', 'marketing'], award: '$4,000' },
  { name: 'Undergraduate Excellence Fellowship', type: 'merit', minGpa: 3.8, majors: ['all'], award: '$10,000' },
  { name: 'Community Leadership Scholarship', type: 'need', minGpa: 2.8, majors: ['all'], award: '$2,500' }
];

document.getElementById('scholar-btn').addEventListener('click', () => {
  const major = document.getElementById('scholar-major').value.trim().toLowerCase();
  const gpa   = parseFloat(document.getElementById('scholar-gpa').value);
  const need  = document.getElementById('scholar-need').value;
  const res   = document.getElementById('scholar-result');

  if (isNaN(gpa)) {
    alert('Please enter your GPA.');
    return;
  }

  const matches = SCHOLARSHIPS.filter(s => {
    if (gpa < s.minGpa) return false;
    if (need !== 'both' && s.type !== 'both' && s.type !== need) return false;
    if (s.majors.includes('all')) return true;
    if (major && s.majors.some(m => major.includes(m) || m.includes(major))) return true;
    return false;
  });

  if (matches.length === 0) {
    res.innerHTML = `No exact matches found for GPA ${gpa} in that field. Try general scholarships through <a href="https://www.fastweb.com" target="_blank" rel="noopener">Fastweb</a> or <a href="https://scholarships.com" target="_blank" rel="noopener">Scholarships.com</a>.`;
    res.className = 'result-box show info';
  } else {
    let html = `<strong>${matches.length} Scholarship(s) Found!</strong><ul style="margin-top:8px;padding-left:18px;">`;
    matches.forEach(m => {
      html += `<li><strong>${m.name}</strong> — ${m.award} (Min GPA: ${m.minGpa}, Type: ${m.type})</li>`;
    });
    html += '</ul>';
    res.innerHTML = html;
    res.className = 'result-box show good';
  }
});

// ── 13. AI Financial Advisor Chat ─────────────────
const CHAT_KNOWLEDGE = [
  { keywords: ['budget', 'budgeting', 'create a budget', 'how to budget', 'how do i create'], answer: `Here's how to create an effective student budget in 4 simple steps:<br>1. <strong>Calculate total income</strong>: allowance, part-time job, scholarships<br>2. <strong>List fixed expenses</strong>: rent, tuition, phone bill<br>3. <strong>Estimate variable expenses</strong>: food, transport, entertainment<br>4. <strong>Apply the 50/30/20 rule</strong>: 50% Needs, 30% Wants, 20% Savings/Debt.<br><br>You can set your budget right here in the <em>Dashboard</em> tab!` },
  { keywords: ['compound interest', 'compound', 'compounding'], answer: `<strong>Compound interest</strong> is "interest on interest" — the secret weapon of building wealth!<br><br>For example: If you invest <strong>$500</strong> at 8% annual return:<br>• After 10 years: ~$1,080<br>• After 20 years: ~$2,330<br>• After 30 years: ~$5,030<br><br>The key is <em>starting early</em>. Even $25/month in an index fund during college gives you a massive head start!` },
  { keywords: ['student loan', 'loans', 'repay', 'interest rate', 'federal loan'], answer: `Key tips for student loans:<br>• <strong>Prioritize federal loans</strong> over private (lower rates, income-driven repayment, forgiveness options)<br>• <strong>Understand subsidized vs unsubsidized</strong>: Subsidized loans don't accrue interest while you're in school<br>• <strong>Pay interest while enrolled</strong> if you can — it stops it from capitalizing into your principal<br>• Check the <em>Loan & Scholarship</em> tab to calculate your monthly payments!` },
  { keywords: ['saving tips', 'save money', 'cut costs', 'tips to save', 'spend less'], answer: `Top 5 money-saving hacks for students:<br>1. <strong>Buy used textbooks or rent</strong> (chegg, thriftbooks, campus library)<br>2. <strong>Meal prep</strong>: campus food adds up fast — cooking saves ~$250/month<br>3. <strong>Use student discounts</strong>: Spotify, GitHub, Amazon Prime, transit<br>4. <strong>Campus amenities</strong>: Use the campus gym, free printing, and event food<br>5. <strong>Automate savings</strong>: transfer $10/week to savings on payday before you can spend it.` },
  { keywords: ['50/30/20', 'rule', '50 30 20'], answer: `The <strong>50/30/20 Rule</strong> is the most popular budgeting guideline:<br>• <strong>50% Needs</strong>: Housing, groceries, essential transport, bills<br>• <strong>30% Wants</strong>: Dining out, hobbies, shopping, entertainment<br>• <strong>20% Savings & Debt</strong>: Emergency fund, paying off high-interest debt, investing<br><br>As a student, your split might look more like 60/25/15 — and that's okay! Consistency matters more than perfection.` },
  { keywords: ['credit card', 'credit score', 'build credit'], answer: `Building credit safely in college:<br>• Start with a <strong>student credit card</strong> or secured card (no annual fee)<br>• <strong>Pay off the full balance every month</strong> to never pay interest<br>• Keep your <strong>credit utilization below 30%</strong> (under $90 on a $300 limit)<br>• Never miss a payment — payment history is 35% of your credit score!` }
];

function getAIResponse(query) {
  const q = query.toLowerCase();
  for (const item of CHAT_KNOWLEDGE) {
    if (item.keywords.some(k => q.includes(k))) {
      return item.answer;
    }
  }
  return `That's a thoughtful question! Here is general financial guidance for students:<br>
  • Always track every expense — awareness is step #1<br>
  • Live below your means — maintain positive cash flow<br>
  • Treat your education and skills as your highest-ROI investment<br>
  • Watch out for lifestyle creep as your income expands<br><br>
  Try asking about: <em>budgeting, student loans, saving tips, scholarships, compound interest, or credit cards</em>.`;
}

function appendChatMsg(text, role) {
  const wrap = document.getElementById('chat-messages');
  if (!wrap) return;
  const div  = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <span class="chat-avatar">${role === 'bot' ? '🤖' : '🎓'}</span>
    <div class="chat-bubble">${text}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function sendChatMessage(text) {
  if (!text || !text.trim()) return;
  appendChatMsg(escHtml(text), 'user');
  const inputEl = document.getElementById('chat-input');
  if (inputEl) inputEl.value = '';
  setTimeout(() => {
    appendChatMsg(getAIResponse(text), 'bot');
  }, 400);
}

const chatSendBtn = document.getElementById('chat-send-btn');
const chatInput = document.getElementById('chat-input');
if (chatSendBtn && chatInput) {
  chatSendBtn.addEventListener('click', () => sendChatMessage(chatInput.value));
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendChatMessage(e.target.value);
  });
}

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => sendChatMessage(btn.dataset.q));
});

// ── 14. Initialization ────────────────────────────
initVault3DTilt();
refreshDashboard();
renderExpenses();
const expDateInput = document.getElementById('exp-date');
if (expDateInput) expDateInput.valueAsDate = new Date();
