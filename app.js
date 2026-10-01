const $ = s => document.querySelector(s);
const KEY = 'daily-v1';
let S = { tasks: [], habits: [], spend: [] };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const dstr = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const today = () => dstr(new Date());
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const birr = v => v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' Br';

function streak(h) {
  let n = 0, d = new Date();
  if (!h.days.includes(dstr(d))) d.setDate(d.getDate() - 1);
  while (h.days.includes(dstr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

const act = {
  addTask() { const v = $('#nt').value.trim(); if (v) S.tasks.unshift({ id: uid(), t: v, done: false }); },
  togTask(id) { const t = S.tasks.find(x => x.id === id); t.done = !t.done; },
  delTask(id) { S.tasks = S.tasks.filter(x => x.id !== id); },
  clearDone() { S.tasks = S.tasks.filter(x => !x.done); },
  addHabit() { const v = $('#nh').value.trim(); if (v) S.habits.push({ id: uid(), n: v, days: [] }); },
  togHabit(id) {
    const h = S.habits.find(x => x.id === id), t = today();
    h.days = h.days.includes(t) ? h.days.filter(d => d !== t) : [...h.days, t];
  },
  delHabit(id) { if (confirm('Delete this habit?')) S.habits = S.habits.filter(x => x.id !== id); },
  addSpend() {
    const a = parseFloat($('#sa').value);
    if (!(a > 0)) return;
    S.spend.unshift({ id: uid(), a, c: $('#sc').value, n: $('#sn').value.trim(), d: today() });
  },
  delSpend(id) { S.spend = S.spend.filter(x => x.id !== id); }
};

const views = {
  tasks() {
    const done = S.tasks.filter(t => t.done).length, tot = S.tasks.length, pct = tot ? done / tot * 100 : 0;
    return `<div class="card"><small>Progress</small>
      <div class="big">${done}<span> / ${tot} done</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="add"><input id="nt" placeholder="Add a task" maxlength="120"><button data-a="addTask">Add</button></div>
      ${tot ? S.tasks.map(t => `<div class="row ${t.done ? 'done' : ''}">
        <button class="chk" data-a="togTask" data-id="${t.id}">${t.done ? '✓' : ''}</button>
        <span>${esc(t.t)}</span>
        <button class="x" data-a="delTask" data-id="${t.id}">×</button></div>`).join('') : '<p class="empty">Nothing here yet. Add your first task.</p>'}
      ${done ? '<button class="ghost" data-a="clearDone" style="width:100%;margin-top:6px">Clear completed</button>' : ''}`;
  },
  habits() {
    const t = today();
    const dots = h => { let o = ''; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); o += `<i class="${h.days.includes(dstr(d)) ? 'on' : ''}"></i>`; } return o; };
    return `<div class="add"><input id="nh" placeholder="New habit, e.g. Read 20 min" maxlength="40"><button data-a="addHabit">Add</button></div>`
      + (S.habits.length ? S.habits.map(h => {
        const on = h.days.includes(t);
        return `<div class="card"><div class="hh">
          <div><b>${esc(h.n)}</b><div class="dots">${dots(h)}</div></div>
          <div class="st"><b>${streak(h)}</b><small>day streak</small></div></div>
          <div class="two"><button class="${on ? 'ghost' : ''}" data-a="togHabit" data-id="${h.id}">${on ? 'Done today ✓' : 'Mark done today'}</button>
          <button class="x" data-a="delHabit" data-id="${h.id}">×</button></div></div>`;
      }).join('') : '<p class="empty">Start with one small habit. Streaks keep you honest.</p>');
  },
  spend() {
    const t = today(), m = t.slice(0, 7);
    const sum = f => S.spend.filter(f).reduce((a, x) => a + x.a, 0);
    const cats = ['Food', 'Transport', 'Bills', 'Shopping', 'Other'];
    return `<div class="tiles">
      <div class="card"><small>Today</small><div class="big sm">${birr(sum(x => x.d === t))}</div></div>
      <div class="card"><small>This month</small><div class="big sm">${birr(sum(x => x.d.startsWith(m)))}</div></div></div>
      <div class="card form">
        <input id="sa" type="number" inputmode="decimal" placeholder="Amount in Birr">
        <select id="sc">${cats.map(c => `<option>${c}</option>`).join('')}</select>
        <input id="sn" placeholder="Note (optional)" maxlength="40">
        <button data-a="addSpend">Add expense</button></div>
      ${S.spend.length ? S.spend.slice(0, 20).map(x => `<div class="row">
        <span class="c">${esc(x.c)}</span>
        <span>${esc(x.n) || '&nbsp;'}<small>${x.d}</small></span>
        <b>${birr(x.a)}</b>
        <button class="x" data-a="delSpend" data-id="${x.id}">×</button></div>`).join('') : '<p class="empty">Log what you spend. You will see where it goes.</p>'}`;
  }
};

let tab = 'tasks';
const tabNames = { tasks: 'Tasks', habits: 'Habits', spend: 'Spend' };

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
$('#app').onkeydown = e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    const box = e.target.closest('.add,.form');
    if (box) box.querySelector('button').click();
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

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
