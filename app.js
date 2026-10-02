const $ = s => document.querySelector(s);
const KEY = 'daily-v1';
let S = { tasks: [], habits: [], spend: [], theme: { mode: 'dark', ac: '#4cc3cc' } };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
S.theme = { mode: 'dark', ac: '#4cc3cc', ...S.theme };
const save = () => { S.ts = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} queuePush(); };
const dstr = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const today = () => dstr(new Date());
const shift = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return dstr(x); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const birr = v => v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' Br';
const ic = (p, s = 22) => '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  notes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  report: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  style: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
};
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

/* money helpers */
const mk = d => d.slice(0, 7);
const mShift = (m, n) => { const [y, mo] = m.split('-').map(Number); const x = new Date(y, mo - 1 + n, 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); };
const mName = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
const mTot = (m, k) => S.spend.filter(x => x.k === k && x.d.startsWith(m)).reduce((a, x) => a + x.a, 0);
function carry(m) {
  if (!S.spend.length) return 0;
  let cur = S.spend.reduce((a, x) => x.d < a ? x.d : a, '9999-99-99').slice(0, 7), c = 0;
  while (cur < m) { c = Math.max(0, c + mTot(cur, 'in') - mTot(cur, 'out')); cur = mShift(cur, 1); }
  return c;
}
const CC = { Food: '#f59e0b', Transport: '#3b82f6', Bills: '#a855f7', Shopping: '#ec4899', Other: '#8aa0b2', Salary: '#14b8a6', Business: '#6366f1', Gift: '#f43f5e' };
const keyOf = x => x.c === 'Other' && x.n ? x.n.trim().toLowerCase().replace(/^./, c => c.toUpperCase()) : x.c;
const colorOf = k => { if (CC[k]) return CC[k]; let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 70% 58%)`; };
const CATS = { out: ['Food', 'Transport', 'Bills', 'Shopping', 'Other'], in: ['Salary', 'Business', 'Gift', 'Other'] };
const short = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v));

/* state */
let tab = 'tasks', sel = today(), kind = 'out', vm = mk(today());

/* reminders */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.onclick = () => t.remove();
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 9000);
}
async function notify(t) {
  toast('⏰ ' + t.tm + ' · ' + t.t);
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Task reminder', { body: t.t + ' · ' + t.tm, icon: 'icon.svg', tag: t.id });
    } catch (e) { try { new Notification('Task reminder', { body: t.t }); } catch (_) {} }
  }
}
function checkReminders() {
  const n = new Date(), d = today(), hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  let ch = false;
  S.tasks.forEach(t => {
    if (t.tm && !t.done && !t.fired && t.d <= d && (t.d < d || t.tm <= hm)) { t.fired = true; ch = true; notify(t); }
  });
  if (ch) { save(); if (tab === 'tasks' && document.activeElement.tagName !== 'INPUT') render(); }
}

/* native notifications (APK only) */
const LN = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;
const nid = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2000000000 + 1; };
async function schedNative(t) {
  const ln = LN();
  if (!ln || !t || !t.tm || t.done) return;
  const at = new Date(t.d + 'T' + t.tm + ':00');
  if (at.getTime() <= Date.now()) return;
  try {
    const p = await ln.requestPermissions();
    if (p.display !== 'granted') return;
    await ln.schedule({ notifications: [{ id: nid(t.id), title: 'Task reminder', body: t.t, schedule: { at, allowWhileIdle: true } }] });
  } catch (e) {}
}
async function cancelNative(t) {
  const ln = LN();
  if (!ln || !t) return;
  try { await ln.cancel({ notifications: [{ id: nid(t.id) }] }); } catch (e) {}
}

/* habit reminder */
async function schedHabits() {
  const ln = LN();
  if (!ln) return;
  try {
    const ids = [1, 2, 3, 4, 5, 6, 7].map(i => ({ id: 2100000000 + i }));
    await ln.cancel({ notifications: ids });
    if (S.hrOn === false || !S.habits.length) return;
    const p = await ln.requestPermissions();
    if (p.display !== 'granted') return;
    const [h, mi] = (S.hrt || '20:00').split(':').map(Number);
    const t = today(), left = S.habits.filter(x => !x.days.includes(t)).length;
    const list = [];
    for (let i = 0; i < 7; i++) {
      const at = new Date();
      at.setDate(at.getDate() + i);
      at.setHours(h, mi, 0, 0);
      if (at.getTime() <= Date.now()) continue;
      if (i === 0 && !left) continue;
      list.push({
        id: 2100000000 + i + 1,
        title: '🔥 Keep your streak alive',
        body: i === 0 ? left + ' habit' + (left > 1 ? 's' : '') + ' still open today. Do it before midnight.' : 'Mark your habits done before midnight.',
        schedule: { at, allowWhileIdle: true }
      });
    }
    if (list.length) await ln.schedule({ notifications: list });
  } catch (e) {}
}
let ht;
const habSoon = () => { clearTimeout(ht); ht = setTimeout(schedHabits, 800); };
function habitNudge() {
  if (LN() || S.hrOn === false || !S.habits.length) return;
  const n = new Date(), t = today(), hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  if (hm < (S.hrt || '20:00') || S.hnd === t) return;
  const left = S.habits.filter(h => !h.days.includes(t)).length;
  S.hnd = t;
  save();
  if (left) toast('🔥 ' + left + ' habit' + (left > 1 ? 's' : '') + ' still open today');
}

const act = {
  addTask() {
    const v = $('#nt').value.trim();
    if (!v) return;
    const tm = $('#nm').value;
    S.tasks.unshift({ id: uid(), t: v, done: false, d: sel, tm: tm || '' });
    schedNative(S.tasks[0]);
    if (tm && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  },
  togTask(id) { const t = S.tasks.find(x => x.id === id); t.done = !t.done; if (t.done) cancelNative(t); else schedNative(t); },
  delTask(id) { const t = S.tasks.find(x => x.id === id); if (t) cancelNative(t); S.tasks = S.tasks.filter(x => x.id !== id); },
  clearDone() { S.tasks = S.tasks.filter(x => !(x.d === sel && x.done)); },
  ics(id) {
    const t = S.tasks.find(x => x.id === id);
    if (!t || !t.tm) return;
    const clean = t.t.replace(/[,;\n]/g, ' ');
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daily//EN', 'BEGIN:VEVENT', 'UID:' + t.id + '@daily',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART:' + t.d.replace(/-/g, '') + 'T' + t.tm.replace(':', '') + '00', 'SUMMARY:' + clean,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + clean, 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
    a.download = 'task.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  perm() { if ('Notification' in window) Notification.requestPermission().then(() => render()); },
  hrtog() { S.hrOn = S.hrOn === false; },
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
  mprev() { vm = mShift(vm, -1); },
  mnext() { if (vm < mk(today())) vm = mShift(vm, 1); },
  addSpend() {
    const a = parseFloat($('#sa').value);
    if (!(a > 0)) return;
    S.spend.unshift({ id: uid(), a, k: kind, c: $('#sc').value, n: $('#sn').value.trim(), d: today() });
    vm = mk(today());
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

function donut(inc, out, total, left) {
  const ring = (items, r, w) => {
    const C = 2 * Math.PI * r;
    let off = 0;
    return `<circle cx="60" cy="60" r="${r}" fill="none" style="stroke:var(--field)" stroke-width="${w}"/>`
      + items.map(([, v, col]) => {
        const l = v / total * C;
        const s = `<circle cx="60" cy="60" r="${r}" fill="none" style="stroke:${col}" stroke-width="${w}" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}"/>`;
        off += l;
        return s;
      }).join('');
  };
  return `<svg viewBox="0 0 120 120" width="150" height="150"><g transform="rotate(-90 60 60)">${ring(inc, 52, 9)}${ring(out, 38, 9)}</g>
    <text x="60" y="56" text-anchor="middle" font-size="9" style="fill:var(--mut)">${left >= 0 ? 'Left' : 'Over'}</text>
    <text x="60" y="72" text-anchor="middle" font-size="14" font-weight="700" style="fill:${left >= 0 ? 'var(--up)' : 'var(--dn)'}">${short(Math.abs(left))}</text></svg>`;
}

/* cloud sync */
let SY = { key: '', on: false };
try { SY = { ...SY, ...JSON.parse(localStorage.getItem('daily-sync') || '{}') }; } catch (e) {}
const saveSY = () => { try { localStorage.setItem('daily-sync', JSON.stringify(SY)); } catch (e) {} };
let syMsg = SY.on ? 'Sync is on.' : '', pt;
const hasData = d => d && ((d.tasks && d.tasks.length) || (d.habits && d.habits.length) || (d.spend && d.spend.length) || (d.notes && d.notes.length));
const stamp = () => 'Synced ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const setMsg = m => { syMsg = m; const el = $('#symsg'); if (el) el.textContent = m; };

async function api(method, data) {
  const r = await fetch('https://daily-zxc-04e9.vercel.app/api/sync', { method, headers: { 'Content-Type': 'application/json', 'x-sync-key': SY.key }, body: data ? JSON.stringify({ data }) : undefined });
  const txt = await r.text();
  let j = {};
  try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) throw new Error('Error ' + r.status + ': ' + txt.slice(0, 150));
  return j;
}
function queuePush() { if (!SY.on) return; clearTimeout(pt); pt = setTimeout(push, 1500); }
async function push() {
  try { await api('POST', S); setMsg(stamp()); } catch (e) { setMsg('Offline. Will sync on the next change.'); }
}
function adopt(d) {
  S = { tasks: [], habits: [], spend: [], ...d, theme: { mode: 'dark', ac: '#4cc3cc', ...(d.theme || {}) } };
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  applyTheme();
  render();
}
async function pull() {
  const { data } = await api('GET');
  if (!data) return push();
  if ((data.ts || 0) > (S.ts || 0)) { adopt(data); setMsg(stamp()); }
  else if ((S.ts || 0) > (data.ts || 0)) return push();
}
async function syncOn() {
  const k = $('#sk').value.trim();
  if (!k) return;
  SY.key = k;
  try {
    const { data } = await api('GET');
    if (!data || (!hasData(data) && hasData(S))) await push();
    else if (hasData(data) && hasData(S)) {
      if (confirm('There is already data in the cloud. OK = load it onto this phone (replaces what is here). Cancel = overwrite the cloud with this phone.')) adopt(data); else await push();
    } else adopt(data);
    SY.on = true; saveSY(); syMsg = stamp(); render();
  } catch (e) { SY.on = false; syMsg = e.message; render(); }
}
function syncOff() { SY = { key: '', on: false }; saveSY(); syMsg = ''; render(); }
async function syncNow() {
  try { await pull(); setMsg(stamp()); } catch (e) { setMsg(e.message); }
}
function syncCard() {
  return `<div class="card"><b>Cloud sync</b><p><small id="symsg">${esc(syMsg) || 'Back up your data and keep your devices in step.'}</small></p>
    ${SY.on ? '<button class="full" data-a="syncnow">Sync now</button><button class="ghost full" data-a="syncoff" style="margin-top:8px">Turn off</button>'
      : '<input id="sk" type="password" placeholder="Your sync passphrase"><button class="full" data-a="syncon" style="margin-top:8px">Turn on sync</button>'}</div>`;
}
function hrCard() {
  const on = S.hrOn !== false;
  return `<div class="card"><b>Habit reminder</b>
    <p><small>${on ? 'A nudge each evening if a habit is still open.' : 'The evening nudge is off.'}${LN() ? '' : ' It shows while the app is open.'}</small></p>
    <label><small>Time</small><input id="hrt" type="time" value="${S.hrt || '20:00'}"></label>
    <button class="${on ? 'ghost ' : ''}full" data-a="hrtog" style="margin-top:10px">${on ? 'Turn off' : 'Turn on'}</button></div>`;
}

const views = {
  tasks() {
    const list = S.tasks.filter(t => t.d === sel).sort((a, b) => (a.tm || '99:99').localeCompare(b.tm || '99:99'));
    const done = list.filter(t => t.done).length, tot = list.length;
    const chips = [-3, -2, -1, 0, 1, 2, 3].map(i => {
      const d = shift(sel, i), dt = new Date(d + 'T12:00:00');
      return `<button class="dc ${d === sel ? 'on' : ''}" data-a="pick" data-id="${d}"><small>${dt.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}</small><b>${dt.getDate()}</b><i class="${dayCls(d)}"></i></button>`;
    }).join('');
    return `<div class="week"><button class="ar" data-a="prev">‹</button><div class="days">${chips}</div><button class="ar" data-a="next">›</button></div>
      <div class="dl"><b>${label(sel)}</b>${sel !== today() ? '<button class="ghost sm" data-a="goToday">Back to today</button>' : ''}</div>
      ${tot ? `<div class="mini"><small>${done} of ${tot} done</small><div class="bar"><i style="width:${done / tot * 100}%"></i></div></div>` : ''}
      <div class="add"><input id="nt" placeholder="Add a task" maxlength="120"><input id="nm" type="time" aria-label="Reminder time"><button data-a="addTask">Add</button></div>
      ${tot ? list.map(t => `<div class="row ${t.done ? 'done' : ''}">
        <button class="chk" data-a="togTask" data-id="${t.id}">${t.done ? '✓' : ''}</button>
        <span>${esc(t.t)}${t.tm ? `<small>⏰ ${t.tm}</small>` : ''}</span>
        ${t.tm ? `<button class="x" data-a="ics" data-id="${t.id}" aria-label="Add to calendar">📅</button>` : ''}
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
    const m = vm, cur = mk(today());
    const car = carry(m), inc = mTot(m, 'in'), exp = mTot(m, 'out'), avail = car + inc, left = avail - exp;
    const by = {}, byIn = {};
    S.spend.filter(x => x.d.startsWith(m)).forEach(x => {
      const k = keyOf(x), t = x.k === 'out' ? by : byIn;
      t[k] = (t[k] || 0) + x.a;
    });
    const outItems = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, colorOf(k)]);
    if (left > 0) outItems.push(['Left', left, 'var(--up)']);
    const inItems = [];
    if (car > 0) inItems.push(['Carried over', car, '#64748b']);
    Object.entries(byIn).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => inItems.push([k, v, colorOf(k)]));
    const total = Math.max(avail, exp);
    const entries = S.spend.filter(x => x.d.startsWith(m));
    const lg = ([k, v, col]) => `<div><i style="background:${col}"></i><span>${esc(k)}</span><em>${Math.round(v / total * 100)}%</em></div>`;
    return `<div class="week"><button class="ar" data-a="mprev">‹</button>
      <div class="mt"><b>${mName(m)}</b><small>${m === cur ? 'This month' : 'Past month'}</small></div>
      <button class="ar" data-a="mnext" ${m >= cur ? 'disabled' : ''}>›</button></div>
      <div class="tiles">
        <div class="card"><small>Carried over</small><div class="big">${birr(car)}</div></div>
        <div class="card"><small>Income</small><div class="big up">+${birr(inc)}</div></div>
        <div class="card"><small>Spent</small><div class="big dn">-${birr(exp)}</div></div>
        <div class="card"><small>Balance</small><div class="big ${left >= 0 ? 'up' : 'dn'}">${left >= 0 ? '' : '-'}${birr(Math.abs(left))}</div></div></div>
      ${total > 0 ? `<div class="card"><div class="dn-wrap">${donut(inItems, outItems, total, left)}<div class="leg">
        ${inItems.length ? '<small>Income</small>' + inItems.map(lg).join('') : ''}
        ${outItems.length ? '<small>Spent</small>' + outItems.map(lg).join('') : ''}</div></div></div>` : ''}
      ${m === cur ? `<div class="card form">
        <div class="seg"><button class="${kind === 'out' ? 'on' : ''}" data-a="kind" data-id="out">Expense</button><button class="${kind === 'in' ? 'on' : ''}" data-a="kind" data-id="in">Income</button></div>
        <input id="sa" type="number" inputmode="decimal" placeholder="Amount in Birr">
        <select id="sc">${CATS[kind].map(c => `<option>${c}</option>`).join('')}</select>
        <input id="sn" placeholder="Note (optional)" maxlength="40">
        <button data-a="addSpend">Add ${kind === 'out' ? 'expense' : 'income'}</button></div>` : ''}
      ${entries.length ? entries.map(x => `<div class="row">
        <span class="c" style="color:${colorOf(keyOf(x))}">${esc(x.c)}</span>
        <span>${esc(x.n) || '&nbsp;'}<small>${x.d}</small></span>
        <b class="${x.k === 'in' ? 'up' : 'dn'}">${x.k === 'in' ? '+' : '-'}${birr(x.a)}</b>
        <button class="x" data-a="delSpend" data-id="${x.id}">×</button></div>`).join('') : '<p class="empty">Nothing logged for this month.</p>'}`;
  },
  style() {
    const th = S.theme, perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const msg = perm === 'granted' ? 'Notifications are on. Timed tasks alert you while the app is open or in the background.'
      : perm === 'denied' ? 'Notifications are blocked. Allow them for this site in your browser settings.'
      : perm === 'default' ? 'Turn on notifications to get an alert when a task time arrives.'
      : 'This browser does not support notifications.';
    return `<div class="card"><b>Mode</b><div class="seg" style="margin-top:10px">${['dark', 'black', 'light'].map(m =>
      `<button class="${th.mode === m ? 'on' : ''}" data-a="mode" data-id="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div></div>
      <div class="card"><b>Accent color</b><div class="sws">${SW.map(c =>
        `<button class="sw ${th.ac.toLowerCase() === c ? 'on' : ''}" style="background:${c}" data-a="ac" data-id="${c}" aria-label="${c}"></button>`).join('')}</div>
        <label class="pick"><small>Or pick any color you want</small><input id="cc" type="color" value="${th.ac}"></label></div>
      <div class="card"><b>Reminders</b><p><small>${msg}</small></p>${perm === 'default' ? '<button class="full" data-a="perm">Enable notifications</button>' : ''}</div>`;
  }
};
views.report = function () {
  const m = vm, cur = mk(today()), pm = mShift(m, -1);
  const inc = mTot(m, 'in'), exp = mTot(m, 'out'), net = inc - exp, pexp = mTot(pm, 'out');
  const catsOf = mm => { const o = {}; S.spend.filter(x => x.k === 'out' && x.d.startsWith(mm)).forEach(x => { const k = keyOf(x); o[k] = (o[k] || 0) + x.a; }); return o; };
  const a = catsOf(m), b = catsOf(pm);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => (a[y] || 0) - (a[x] || 0) || (b[y] || 0) - (b[x] || 0));
  const mx = Math.max(1, ...keys.map(k => Math.max(a[k] || 0, b[k] || 0)));
  const [yy, mo] = m.split('-').map(Number);
  const days = m === cur ? new Date().getDate() : new Date(yy, mo, 0).getDate();
  const chg = pexp > 0 ? Math.round((exp - pexp) / pexp * 100) : null;
  const rate = inc > 0 ? Math.round(net / inc * 100) : null;
  const top = Object.entries(a).sort((x, y) => y[1] - x[1])[0];
  const big = S.spend.filter(x => x.k === 'out' && x.d.startsWith(m)).sort((x, y) => y.a - x.a)[0];
  const tk = S.tasks.filter(t => t.d.startsWith(m)), td = tk.filter(t => t.done).length;
  const hb = S.habits.map(h => [h.n, h.days.filter(d => d.startsWith(m)).length]);
  const pn = mName(pm).split(' ')[0], mn = mName(m).split(' ')[0];
  const lines = [];
  if (top && exp) lines.push(`Most of your spending went to <b>${esc(top[0])}</b> (${Math.round(top[1] / exp * 100)}%).`);
  if (big) lines.push(`Biggest expense: <b>${birr(big.a)}</b>${big.n ? ' on ' + esc(big.n) : ' in ' + esc(big.c)}.`);
  if (exp) lines.push(`You spent about <b>${birr(exp / days)}</b> a day.`);
  return `<div class="week"><button class="ar" data-a="mprev">‹</button>
    <div class="mt"><b>${mName(m)}</b><small>${m === cur ? 'So far this month' : 'Past month'}</small></div>
    <button class="ar" data-a="mnext" ${m >= cur ? 'disabled' : ''}>›</button></div>
    <div class="card"><small>Saved this month</small>
      <div class="big ${net >= 0 ? 'up' : 'dn'}">${net >= 0 ? '+' : '-'}${birr(Math.abs(net))}</div>
      <small>${rate === null ? 'No income logged yet.' : (net >= 0 ? 'You kept ' + rate + '% of your income.' : 'You spent more than you earned.')}</small></div>
    <div class="tiles">
      <div class="card"><small>Income</small><div class="big up">+${birr(inc)}</div></div>
      <div class="card"><small>Spent</small><div class="big dn">-${birr(exp)}</div>
        ${chg === null ? '' : `<span class="pill ${chg <= 0 ? 'up' : 'dn'}">${chg > 0 ? '+' : ''}${chg}% vs ${pn}</span>`}</div></div>
    ${lines.length ? `<div class="card ins">${lines.map(l => `<p>${l}</p>`).join('')}</div>` : ''}
    <div class="card"><b>Spending by category</b>
      <p><small>Colored bar: ${mn}. Grey bar: ${pn}.</small></p>
      ${keys.length ? keys.map(k => `<div class="rb"><div class="rl"><span>${esc(k)}</span><b>${birr(a[k] || 0)}</b></div>
        <div class="rt"><i style="width:${(a[k] || 0) / mx * 100}%;background:${colorOf(k)}"></i></div>
        <div class="rt p"><i style="width:${(b[k] || 0) / mx * 100}%"></i></div></div>`).join('') : '<p class="empty">No spending logged.</p>'}</div>
    <div class="card"><b>Tasks and habits</b>
      <p>${tk.length ? 'Tasks done: <b>' + td + ' of ' + tk.length + '</b>' : 'No tasks this month.'}</p>
      ${hb.map(([n, c]) => `<p>${esc(n)}: <b>${c}</b> day${c === 1 ? '' : 's'} done</p>`).join('')}</div>`;
};
/* notes */
let noteId = null, nq = '', ntag = '';
const NT = () => (S.notes = S.notes || []);
const ntags = n => n.g || [];
const NCOL = ['', '#ef4444', '#f59e0b', '#3dbe8b', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899'];
function noteCard(n) {
  const c = n.c || '';
  const st = c ? ` style="background:${c}22;border-color:${c}66"` : '';
  return `<div class="note" data-a="openNote" data-id="${n.id}"${st}>
    ${n.t ? `<b>${esc(n.t)}</b>` : ''}
    ${n.b ? `<p>${esc(n.b.slice(0, 240))}</p>` : (n.t ? '' : '<p>Empty note</p>')}
    ${ntags(n).length ? `<div class="ng">${ntags(n).map(g => `<i>#${esc(g)}</i>`).join('')}</div>` : ''}</div>`;
}
function noteListHtml() {
  const q = nq.trim().toLowerCase();
  const list = NT().filter(n => (!ntag || ntags(n).includes(ntag)) && (!q || ((n.t || '') + ' ' + (n.b || '') + ' ' + ntags(n).join(' ')).toLowerCase().includes(q)));
  list.sort((a, b) => b.u - a.u);
  if (!list.length) return `<div class="nempty">${ic(ICON.notes, 46)}<p>${NT().length ? 'No notes match your search.' : 'Notes you add will appear here.'}</p></div>`;
  const pins = list.filter(n => n.p), rest = list.filter(n => !n.p);
  const wall = a => `<div class="wall">${a.map(noteCard).join('')}</div>`;
  return (pins.length ? '<div class="nsec">Pinned</div>' + wall(pins) : '')
    + (rest.length ? (pins.length ? '<div class="nsec">Others</div>' : '') + wall(rest) : '');
}
views.notes = function () {
  if (noteId) {
    const n = NT().find(x => x.id === noteId);
    if (!n) { noteId = null; return views.notes(); }
    const c = n.c || '';
    return `<div class="ed" style="${c ? 'background:' + c + '22;border-color:' + c + '66' : ''}">
      <div class="eb"><button class="ib" data-a="backNote" aria-label="Back">${ic(ICON.back)}</button><span class="sp"></span>
        <button class="ib ${n.p ? 'on' : ''}" data-a="pinNote" aria-label="Pin">${ic(ICON.pin)}</button>
        <button class="ib" data-a="delNote" aria-label="Delete">${ic(ICON.trash)}</button></div>
      <input id="nti" class="et" placeholder="Title" maxlength="80" value="${esc(n.t || '')}">
      <textarea id="nbd" class="eta" placeholder="Start writing...">${esc(n.b || '')}</textarea>
      <input id="ntg" class="etg" placeholder="Add tags, separated by commas" maxlength="60" value="${esc(ntags(n).join(', '))}">
      <div class="cols">${NCOL.map(k => `<button class="cd ${(n.c || '') === k ? 'on' : ''}" style="background:${k || 'var(--field)'}" data-a="colNote" data-id="${k}" aria-label="Color"></button>`).join('')}</div>
      <small class="edt">Edited ${new Date(n.u).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div>`;
  }
  const all = [...new Set(NT().flatMap(ntags))];
  return `<label class="sb">${ic(ICON.search, 20)}<input id="nsq" type="search" placeholder="Search your notes" value="${esc(nq)}"></label>
    ${all.length ? `<div class="chips"><button class="${ntag ? '' : 'on'}" data-a="tagNote" data-id="">All</button>${all.map(g => `<button class="${ntag === g ? 'on' : ''}" data-a="tagNote" data-id="${esc(g)}">#${esc(g)}</button>`).join('')}</div>` : ''}
    <div id="nlist">${noteListHtml()}</div>`;
};
Object.assign(act, {
  newNote() { const n = { id: uid(), t: '', b: '', g: [], p: false, c: '', u: Date.now() }; NT().unshift(n); noteId = n.id; },
  openNote(id) { noteId = id; },
  backNote() {
    const n = NT().find(x => x.id === noteId);
    if (n && !n.t && !n.b && !ntags(n).length) S.notes = NT().filter(x => x !== n);
    noteId = null;
  },
  pinNote() { const n = NT().find(x => x.id === noteId); if (n) { n.p = !n.p; n.u = Date.now(); } },
  colNote(id) { const n = NT().find(x => x.id === noteId); if (n) { n.c = id; n.u = Date.now(); } },
  delNote() { if (confirm('Delete this note?')) { S.notes = NT().filter(x => x.id !== noteId); noteId = null; } },
  tagNote(id) { ntag = id; }
});
$('#app').addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'nsq') { nq = e.target.value; const el = $('#nlist'); if (el) el.innerHTML = noteListHtml(); return; }
  const n = noteId && NT().find(x => x.id === noteId);
  if (!n) return;
  if (id === 'nti') n.t = e.target.value;
  else if (id === 'nbd') n.b = e.target.value;
  else if (id === 'ntg') n.g = e.target.value.split(',').map(s => s.trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
  else return;
  n.u = Date.now();
  save();
});
$('#app').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.target.id === 'nsq' || e.target.id === 'nti' || e.target.id === 'ntg')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    e.target.blur();
  }
}, true);
/* tabs and menu */
const tabNames = { tasks: 'Tasks', habits: 'Habits', spend: 'Money' };
const MENU = { notes: ['Notes', ICON.notes], report: ['Report', ICON.report], style: ['Style', ICON.style] };

Object.keys(tabNames).forEach(k => {
  const b = document.createElement('button');
  b.textContent = tabNames[k];
  b.dataset.t = k;
  b.onclick = () => { tab = k; render(); };
  $('#tabs').appendChild(b);
});

const mb = document.createElement('button');
mb.id = 'mb';
mb.setAttribute('aria-label', 'Menu');
mb.innerHTML = ic(ICON.menu, 24);
document.querySelector('header').appendChild(mb);
const mn = document.createElement('div');
mn.id = 'menu';
mn.innerHTML = Object.keys(MENU).map(k => `<button data-m="${k}">${ic(MENU[k][1], 20)}<span>${MENU[k][0]}</span></button>`).join('');
document.body.appendChild(mn);
const mv = document.createElement('div');
mv.id = 'mv';
document.body.appendChild(mv);
const menuOpen = o => { mn.classList.toggle('open', o); mv.classList.toggle('open', o); };
mb.onclick = () => menuOpen(!mn.classList.contains('open'));
mv.onclick = () => menuOpen(false);
mn.onclick = e => {
  const b = e.target.closest('[data-m]');
  if (!b) return;
  tab = b.dataset.m;
  menuOpen(false);
  render();
};

function render() {
  $('#app').innerHTML = views[tab]()
    + (tab === 'style' ? hrCard() + syncCard() : '')
    + (tab === 'notes' && !noteId ? `<button class="fab" data-a="newNote" aria-label="New note">${ic(ICON.plus, 26)}</button>` : '');
  [...$('#tabs').children].forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  [...mn.children].forEach(b => b.classList.toggle('on', b.dataset.m === tab));
  mb.classList.toggle('on', !!MENU[tab]);
  if (tab === 'notes' && noteId) { const el = $('#nti'); if (el && !el.value) el.focus(); }
}

$('#app').onclick = e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  if (b.dataset.a === 'syncon') return syncOn();
  if (b.dataset.a === 'syncoff') return syncOff();
  if (b.dataset.a === 'syncnow') return syncNow();
  const fn = act[b.dataset.a];
  if (fn) { fn(b.dataset.id); save(); render(); habSoon(); }
};
$('#app').oninput = e => {
  if (e.target.id === 'cc') { S.theme.ac = e.target.value; applyTheme(); save(); }
  if (e.target.id === 'hrt' && e.target.value) { S.hrt = e.target.value; save(); habSoon(); }
};
$('#app').onkeydown = e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    const box = e.target.closest('.add,.form');
    if (box) box.querySelector('button:last-child').click();
  }
};

const now = new Date(), hr = now.getHours();
$('#hi').textContent = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
$('#date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

applyTheme();
render();
checkReminders();
setInterval(checkReminders, 15000);
setInterval(habitNudge, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); habSoon(); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if (SY.on) pull().catch(() => {});
document.addEventListener('visibilitychange', () => { if (!document.hidden && SY.on) pull().catch(() => {}); });
habSoon();
