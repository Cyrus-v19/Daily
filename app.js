const $ = s => document.querySelector(s);
const KEY = 'daily-v1';
let S = { tasks: [], habits: [], spend: [], theme: { mode: 'dark', ac: '#4cc3cc' } };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
S.theme = { mode: 'dark', ac: '#4cc3cc', ...S.theme };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const dstr = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const today = () => dstr(new Date());
const shift = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return dstr(x); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const birr = v => v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' Br';
S.tasks.forEach(t => { if (!t.d) t.d = today(); });
S.spend.forEach(x => { if (!x.k) x.k = 'out'; });

/* theme */
const THEMES = {
  dark: { bg: '#0b141d', card: '#142230', field: '#0f1b27', line: '#24394b', ink: '#e8f0f6', mut: '#8aa0b2', nav: 'rgba(11,20,29,.88)' },
  black: { bg: '#000000', card: '#111111', field: '#0a0a0a', line: '#262626', ink: '#ffffff', mut: '#9a9a9a', nav: 'rgba(0,0,0,.9)' },
  light: { bg: '#f2f5f8', card: '#ffffff', field: '#eef2f6', line: '#d8e0e8', ink: '#12263a', mut: '#5b6f82', nav: 'rgba(242,245,248,.9)' }
};
const SW = ['#4cc3cc', '#3dbe8b', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#ffffff'];
function applyTheme() {
  const t = THEMES[S.theme.mode] || THEMES.dark, r = document.documentElement.style, ac = S.theme.ac;
  Object.entries(t).forEach(([k, v]) => r.setProperty('--' + k, v));
  r.setProperty('--ac', ac);
  const n = parseInt(ac.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255;
  r.setProperty('--onac', (R * 299 + G * 587 + B * 114) / 1000 > 150 ? '#0b141d' : '#ffffff');
  r.setProperty('--glow', `rgba(${R},${G},${B},${S.theme.mode === 'light' ? .12 : .2})`);
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.content = t.bg;
}

/* habits */
function streak(h) {
  let n = 0, d = new Date();
  if (!h.days.includes(dstr(d))) d.setDate(d.getDate() - 1);
  while (h.days.includes(dstr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const flameColor = n => n === 0 ? '#5b6f82' : n < 3 ? '#f59e0b' : n < 7 ? '#f97316' : n < 14 ? '#ef4444' : n < 30 ? '#ec4899' : n < 100 ? '#a855f7' : '#38bdf8';
const flame = (n, live) => {
  const c = flameColor(n);
  return `<div class="fl ${live ? 'live' : ''}" style="--fc:${c}"><svg viewBox="0 0 24 24" width="58" height="58">
    <path d="M12 1.5c.4 3.2 2.3 5 4 7 1.7 2 2.8 3.8 2.8 6.3a6.8 6.8 0 0 1-13.6 0c0-2 .8-3.6 2-4.9.3 1.7 1 2.8 2.2 3.3C9 9.3 10.6 6 12 1.5z" fill="${c}"/>
    <path d="M12 22a3.4 3.4 0 0 0 3.4-3.4c0-1.8-1.4-2.9-3.4-5-2 2.1-3.4 3.2-3.4 5A3.4 3.4 0 0 0 12 22z" fill="#fff" opacity=".28"/></svg><b>${n}</b></div>`;
};

/* state */
let tab = 'tasks', sel = today(), kind = 'out';
const CATS = { out: ['Food', 'Transport', 'Bills', 'Shopping', 'Other'], in: ['Salary', 'Business', 'Gift', 'Other'] };
const CC = { Food: '#f59e0b', Transport: '#3b82f6', Bills: '#a855f7', Shopping: '#ec4899', Other: '#8aa0b2' };

const act = {
  addTask() { const v = $('#nt').value.trim(); if (v) S.tasks.unshift({ id: uid(), t: v, done: false, d: sel }); },
  togTask(id) { const t = S.tasks.find(x => x.id === id); t.done = !t.done; },
  delTask(id) { S.tasks = S.tasks.filter(x => x.id !== id); },
  clearDone() { S.tasks = S.tasks.filter(x => !(x.d === sel && x.done)); },
  prev() { sel = shift(sel, -1); },
  next() { sel = shift(sel, 1); },
  pick(id) { sel = id; },
  goToday() { sel = today(); },
  addHabit() { const v = $('#nh').value.trim(); if (v) S.habits.push({ id: uid(), n: v, days: [] }); },
  togHabit(id) {
    const h = S.habits.find(x => x.id === id), t = today();
    h.days = h.days.includes(t) ? h.days.filter(d => d !== t) : [...h.days, t];
  },
  delHabit(id) { if (confirm('Delete this habit?')) S.habits = S.habits.filter(x => x.id !== id); },
  kind(id) { kind = id; },
  addSpend() {
    const a = parseFloat($('#sa').value);
    if (!(a > 0)) return;
    S.spend.unshift({ id: uid(), a, k: kind, c: $('#sc').value, n: $('#sn').value.trim(), d: today() });
  },
  delSpend(id) { S.spend = S.spend.filter(x => x.id !== id); },
  mode(id) { S.theme.mode = id; applyTheme(); },
  ac(id) { S.theme.ac = id; applyTheme(); }
};

const label = d => d === today() ? 'Today' : d === shift(today(), -1) ? 'Yesterday' : d === shift(today(), 1) ? 'Tomorrow'
  : new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const dayCls = d => {
  const t = S.tasks.filter(x => x.d === d);
  if (!t.length) return '';
  const n = t.filter(x => x.done).length;
  return n === t.length ? 'full' : n ? 'part' : 'zero';
};
const short = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v));

function donut(items, total) {
  const C = 2 * Math.PI * 42;
  let off = 0;
  const arcs = items.map(([c, v]) => {
    const l = v / total * C;
    const s = `<circle cx="60" cy="60" r="42" fill="none" stroke="${CC[c] || '#8aa0b2'}" stroke-width="16" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}"/>`;
    off += l;
    return s;
  }).join('');
  return `<svg viewBox="0 0 120 120" width="140" height="140"><g transform="rotate(-90 60 60)"><circle cx="60" cy="60" r="42" fill="none" stroke="var(--field)" stroke-width="16"/>${arcs}</g>
    <text x="60" y="56" text-anchor="middle" font-size="9" fill="var(--mut)">Spent</text>
    <text x="60" y="72" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink)">${short(total)}</text></svg>`;
}

const views = {
  tasks() {
    const list = S.tasks.filter(t => t.d === sel), done = list.filter(t => t.done).length, tot = list.length;
    const chips = [-3, -2, -1, 0, 1, 2, 3].map(i => {
      const d = shift(sel, i), dt = new Date(d + 'T12:00:00');
      return `<button class="dc ${d === sel ? 'on' : ''}" data-a="pick" data-id="${d}"><small>${dt.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}</small><b>${dt.getDate()}</b><i class="${dayCls(d)}"></i></button>`;
    }).join('');
    return `<div class="week"><button class="ar" data-a="prev">‹</button><div class="days">${chips}</div><button class="ar" data-a="next">›</button></div>
      <div class="dl"><b>${label(sel)}</b>${sel !== today() ? '<button class="ghost sm" data-a="goToday">Back to today</button>' : ''}</div>
      ${tot ? `<div class="mini"><small>${done} of ${tot} done</small><div class="bar"><i style="width:${done / tot * 100}%"></i></div></div>` : ''}
      <div class="add"><input id="nt" placeholder="Add a task for ${label(sel).toLowerCase()}" maxlength="120"><button data-a="addTask">Add</button></div>
      ${tot ? list.map(t => `<div class="row ${t.done ? 'done' : ''}">
        <button class="chk" data-a="togTask" data-id="${t.id}">${t.done ? '✓' : ''}</button>
        <span>${esc(t.t)}</span>
        <button class="x" data-a="delTask" data-id="${t.id}">×</button></div>`).join('') : '<p class="empty">No tasks for this day.</p>'}
      ${done ? '<button class="ghost full" data-a="clearDone" style="margin-top:6px">Clear completed</button>' : ''}`;
  },
  habits() {
    const t = today();
    const dots = h => { let o = ''; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); o += `<i class="${h.days.includes(dstr(d)) ? 'on' : ''}"></i>`; } return o; };
    return `<div class="add"><input id="nh" placeholder="New habit, e.g. Read 20 min" maxlength="40"><button data-a="addHabit">Add</button></div>`
      + (S.habits.length ? S.habits.map(h => {
        const on = h.days.includes(t), n = streak(h);
        return `<div class="card"><div class="hh">${flame(n, on && n > 0)}
          <div class="hi"><b>${esc(h.n)}</b><div class="dots">${dots(h)}</div>
          ${!on && n > 0 ? `<small class="warn">Do it before midnight or lose your ${n}-day streak</small>` : ''}</div>
          <button class="x" data-a="delHabit" data-id="${h.id}">×</button></div>
          <button class="full ${on ? 'ghost' : ''}" data-a="togHabit" data-id="${h.id}">${on ? 'Done today ✓' : 'Mark done today'}</button></div>`;
      }).join('') : '<p class="empty">Start with one small habit. Streaks keep you honest.</p>');
  },
  spend() {
    const t = today(), m = t.slice(0, 7);
    const sum = f => S.spend.filter(f).reduce((a, x) => a + x.a, 0);
    const inc = sum(x => x.k === 'in' && x.d.startsWith(m)), exp = sum(x => x.k === 'out' && x.d.startsWith(m)), bal = inc - exp;
    const by = {};
    S.spend.filter(x => x.k === 'out' && x.d.startsWith(m)).forEach(x => by[x.c] = (by[x.c] || 0) + x.a);
    const items = Object.entries(by).sort((a, b) => b[1] - a[1]);
    return `<div class="tiles">
      <div class="card"><small>Income, this month</small><div class="big up">+${birr(inc)}</div></div>
      <div class="card"><small>Spent, this month</small><div class="big dn">-${birr(exp)}</div></div></div>
      <div class="card"><small>Balance</small><div class="big ${bal >= 0 ? 'up' : 'dn'}">${bal >= 0 ? '+' : '-'}${birr(Math.abs(bal))}</div></div>
      ${exp ? `<div class="card"><div class="dn-wrap">${donut(items, exp)}<div class="leg">${items.map(([c, v]) =>
        `<div><i style="background:${CC[c] || '#8aa0b2'}"></i><span>${esc(c)}</span><em>${Math.round(v / exp * 100)}%</em></div>`).join('')}</div></div></div>` : ''}
      <div class="card form">
        <div class="seg"><button class="${kind === 'out' ? 'on' : ''}" data-a="kind" data-id="out">Expense</button><button class="${kind === 'in' ? 'on' : ''}" data-a="kind" data-id="in">Income</button></div>
        <input id="sa" type="number" inputmode="decimal" placeholder="Amount in Birr">
        <select id="sc">${CATS[kind].map(c => `<option>${c}</option>`).join('')}</select>
        <input id="sn" placeholder="Note (optional)" maxlength="40">
        <button data-a="addSpend">Add ${kind === 'out' ? 'expense' : 'income'}</button></div>
      ${S.spend.length ? S.spend.slice(0, 20).map(x => `<div class="row">
        <span class="c" style="color:${x.k === 'in' ? 'var(--up)' : (CC[x.c] || 'var(--mut)')}">${esc(x.c)}</span>
        <span>${esc(x.n) || '&nbsp;'}<small>${x.d}</small></span>
        <b class="${x.k === 'in' ? 'up' : 'dn'}">${x.k === 'in' ? '+' : '-'}${birr(x.a)}</b>
        <button class="x" data-a="delSpend" data-id="${x.id}">×</button></div>`).join('') : '<p class="empty">Log what comes in and what goes out.</p>'}`;
  },
  style() {
    const th = S.theme;
    return `<div class="card"><b>Mode</b><div class="seg" style="margin-top:10px">${['dark', 'black', 'light'].map(m =>
      `<button class="${th.mode === m ? 'on' : ''}" data-a="mode" data-id="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div></div>
      <div class="card"><b>Accent color</b><div class="sws">${SW.map(c =>
        `<button class="sw ${th.ac.toLowerCase() === c ? 'on' : ''}" style="background:${c}" data-a="ac" data-id="${c}" aria-label="${c}"></button>`).join('')}</div>
        <label class="pick"><small>Or pick any color you want</small><input id="cc" type="color" value="${th.ac}"></label></div>`;
  }
};

const tabNames = { tasks: 'Tasks', habits: 'Habits', spend: 'Money', style: 'Style' };

function render() {
  $('#app').innerHTML = views[tab]();
  [...$('#tabs').children].forEach(b => b.classList.toggle('on', b.dataset.t === tab));
}

$('#app').onclick = e => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const fn = act[b.dataset.a];
  if (fn) { fn(b.dataset.id); save(); render(); }
};
$('#app').oninput = e => {
  if (e.target.id === 'cc') { S.theme.ac = e.target.value; applyTheme(); save(); }
};
$('#app').onkeydown = e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    const box = e.target.closest('.add,.form');
    if (box) box.querySelector('button:last-child').click();
  }
};

Object.keys(tabNames).forEach(k => {
  const b = document.createElement('button');
  b.textContent = tabNames[k];
  b.dataset.t = k;
  b.onclick = () => { tab = k; render(); };
  $('#tabs').appendChild(b);
});

const now = new Date(), hr = now.getHours();
$('#hi').textContent = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
$('#date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

applyTheme();
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
