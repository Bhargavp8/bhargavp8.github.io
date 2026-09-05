/* ==========================================================
   POOJA QUIZ — game engine
   ========================================================== */
(() => {
"use strict";

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2 = n => Math.round(n * 100) / 100;
const CIRC = 282.74;
const ORD = n => n + (["th","st","nd","rd"][(n%100>>3^1&&n%10)||0] || "th");

const params = new URLSearchParams(location.search);
const ROLE = (params.get("r") === "play") ? "play" : "screen";
document.body.classList.add(ROLE);

function show(id){
  const el = $(id);
  if (el && el.classList.contains("on")) return;   // already up — don't replay the entrance
  $$(".view").forEach(v => v.classList.remove("on"));
  if (el) el.classList.add("on");
}
function ls(k, v){
  try { if (v === undefined) return JSON.parse(localStorage.getItem("pq_"+k));
        localStorage.setItem("pq_"+k, JSON.stringify(v)); } catch(e){ return null; }
}
/* score with the sub-point precision made visible but quiet */
function fmt(n){
  const i = Math.floor(n), d = Math.round((n - i) * 100);
  return `${i.toLocaleString()}<span class="dec">.${String(d).padStart(2,"0")}</span>`;
}
const secs = ms => (ms / 1000).toFixed(3) + "s";

/* ================= atmosphere ================= */
function drawRangoli(){
  const g = [], C = 50;
  for (let i = 0; i < 48; i++){
    const a = (i/48) * Math.PI * 2;
    g.push(`<line x1="${C+Math.cos(a)*13}" y1="${C+Math.sin(a)*13}" x2="${C+Math.cos(a)*70}" y2="${C+Math.sin(a)*70}" stroke="#F6C445" stroke-width=".14"/>`);
  }
  [16,24,33,43,54,66].forEach((r,i) =>
    g.push(`<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="#F6C445" stroke-width="${i%2?.16:.3}" stroke-dasharray="${i%2?'1.6 2.4':'0'}"/>`));
  for (let i = 0; i < 16; i++){
    const a = (i/16)*Math.PI*2, r1 = 24, r2r = 43;
    const x1 = C+Math.cos(a)*r1, y1 = C+Math.sin(a)*r1;
    const x2 = C+Math.cos(a)*r2r, y2 = C+Math.sin(a)*r2r;
    const na = a + Math.PI/16;
    const cx = C+Math.cos(na)*((r1+r2r)/2+7), cy = C+Math.sin(na)*((r1+r2r)/2+7);
    g.push(`<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#12B5A6" stroke-width=".22"/>`);
  }
  $("#rangoli").innerHTML = g.join("");
}
function scatterFeathers(){
  const spots = ROLE === "screen"
    ? [[4,12,0],[88,20,-6],[10,68,-3],[80,72,-9],[46,88,-12]]
    : [[-2,14,0],[82,64,-5]];
  spots.forEach(([l,t,d]) => {
    const f = document.createElement("div");
    f.className = "feather";
    f.style.cssText = `left:${l}vw;top:${t}vh;animation-delay:${d}s`;
    document.body.appendChild(f);
  });
}

/* ==========================================================
   SCORING — speed + accuracy, resolved to the millisecond

   base  = MAX - (MAX-MIN) * (responseTime / questionTime)
           EVERY correct answer scores. Speed only decides how much:
           instant correct -> 1000, buzzer-beater -> 500, never less.
           Wrong or no answer -> 0.
   Points are kept to 2 decimals rather than whole numbers. Over a
   20s question the decay is 0.025 pts per millisecond, so two players
   1ms apart score 0.02-0.03 apart — they can never tie by rounding.
   Ranking uses the exact value, then cumulative response time.
   bonus = consecutive-correct streak, +100 each, capped at +500.
   ========================================================== */
function scoreAnswer(rtMs, timeMs, correct, double, newStreak){
  if (!correct) return { pts:0, base:0, bonus:0 };
  const frac = clamp(rtMs / timeMs, 0, 1);
  const base = CONFIG.MAX_POINTS - (CONFIG.MAX_POINTS - CONFIG.MIN_POINTS) * frac;
  const bonus = Math.min(Math.max(newStreak - 1, 0) * CONFIG.STREAK_STEP, CONFIG.STREAK_CAP);
  const mult = double ? 2 : 1;
  return { pts: r2((base + bonus) * mult), base: r2(base * mult), bonus: bonus * mult };
}

const GLYPH = i => `<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#g${i}"/></svg>`;
const STALE  = 45000;  // a phone is "present" if heard from within this window
const SETTLE = 1200;   // after time is up, keep accepting answers already in flight

/* ==========================================================
   HOST  (the big screen)
   ========================================================== */
function Host(){
  const S = {
    room:"", phase:"boot", qi:-1,
    players:{},        // pid -> {name, score, totalMs, streak, rank, prev, lastSeen}
    answers:{},        // pid -> {choice, rtMs, pts, ok, speedRank}
    tally:[0,0,0,0], sorted:[], fastest:null,
    tEnd:0, acceptUntil:0, timeMs:0, tick:null, leadIv:null, muted:false
  };

  const roster  = () => Object.entries(S.players);
  const present = () => roster().filter(([,p]) => Date.now() - p.lastSeen < STALE);

  function makeRoom(){
    if (CONFIG.FIXED_ROOM) return String(CONFIG.FIXED_ROOM);
    const saved = ls("room");
    if (saved && ls("qi") !== null) return saved;      // recover after an accidental reload
    return String(Math.floor(10000 + Math.random() * 90000));
  }
  function joinURL(){
    if (CONFIG.PUBLIC_URL){
      const b = CONFIG.PUBLIC_URL.replace(/\/+$/,"");
      return b + (b.endsWith(".html") ? "" : "/") + "?r=play";
    }
    return location.origin + location.pathname + "?r=play";
  }

  function paintLobby(){
    $("#lob-title").textContent = CONFIG.EVENT_TITLE;
    $("#lob-sub").textContent   = CONFIG.EVENT_SUBTITLE;
    $("#lob-pin").textContent   = S.room;
    const u = joinURL();
    $("#lob-url").textContent = u.replace(/^https?:\/\//,"");
    try {
      const qr = qrcode(0, "M"); qr.addData(u); qr.make();
      $("#qr").innerHTML = qr.createSvgTag({ cellSize:4, margin:0, scalable:true });
    } catch(e){ $("#qr").style.display = "none"; }
    paintPlayers();
  }
  function paintPlayers(){
    const list = roster();
    $("#lob-count").textContent = list.length;
    const CAP = 48;                                    // keeps a 50-person room on one screen
    $("#lob-players").innerHTML =
      list.slice(0, CAP).map(([,p]) => `<span class="chip">${esc(p.name)}</span>`).join("") +
      (list.length > CAP ? `<span class="more">+${list.length - CAP} more</span>` : "");
    $("#btn-start").disabled = list.length === 0;
  }

  /* ---------- lifecycle ---------- */
  function toLobby(){
    clearInterval(S.leadIv); clearInterval(S.tick);
    S.phase = "lobby"; S.qi = -1; S.sorted = [];
    Object.values(S.players).forEach(p => { p.score = 0; p.totalMs = 0; p.streak = 0; p.rank = 0; p.prev = 0; });
    persist(); paintLobby(); show("#s-lobby");
    Sound.music("lobby"); Sound.bansuri(0.4);
    Net.send("lobby", {});
  }

  function arm(){
    S.qi++;
    if (S.qi >= QUESTIONS.length) return finish();
    const q = QUESTIONS[S.qi];
    S.timeMs = (q.time || CONFIG.DEFAULT_TIME) * 1000;
    S.answers = {}; S.tally = [0,0,0,0]; S.fastest = null;
    S.phase = "ready";
    persist();

    // The payload travels NOW, during the lead-in, so that "go" is a tiny
    // message landing on every phone at roughly the same instant.
    Net.send("arm", {
      qi:S.qi, total:QUESTIONS.length, q:q.q, options:q.options,
      time:S.timeMs, double:!!q.double, showText:!!CONFIG.SHOW_OPTION_TEXT_ON_PHONE
    });

    // The question goes up NOW and stays put — reading it costs nobody any clock.
    // Options and the timer arrive together when go() fires.
    $("#q-num").textContent = `Question ${S.qi + 1} of ${QUESTIONS.length}` + (q.double ? "  ·  DOUBLE" : "");
    $("#q-text").textContent = q.q;
    $("#q-opts").innerHTML = "";
    $("#q-note").style.display = "none";
    $("#q-fastest").style.display = "none";
    $("#q-arc").style.strokeDashoffset = "0";
    $("#q-ring").classList.remove("warn");
    $("#q-ring").classList.add("lead");
    $("#q-meta").innerHTML = q.double ? "<b>Double points</b>" : "Read it \u2014 answers are coming";
    show("#s-q");

    Sound.music("question"); Sound.tension(0);

    let n = Math.max(1, Math.round(CONFIG.LEAD_IN / 1000));
    $("#q-secs").textContent = n;
    Sound.sfx("tap");
    clearInterval(S.leadIv);
    S.leadIv = setInterval(() => {
      if (S.phase !== "ready"){ clearInterval(S.leadIv); return; }   // reset/replay cancelled us
      n--;
      if (n <= 0){ clearInterval(S.leadIv); go(); return; }
      $("#q-secs").textContent = n;
      Sound.sfx("tap");
    }, 1000);
  }

  function go(){
    const q = QUESTIONS[S.qi];
    if (!q || S.phase !== "ready") return;      // stale timer after a reset
    S.phase = "q";
    S.tEnd = Date.now() + S.timeMs;
    S.acceptUntil = S.tEnd + SETTLE;        // packets already in flight still count
    persist();

    Net.send("go", { qi:S.qi });
    Sound.sfx("whoosh");

    $("#q-ring").classList.remove("lead", "warn");
    $("#q-meta").innerHTML = `Answered <b id="q-count">0</b> / <b id="q-total">${present().length}</b>`;
    $("#q-opts").innerHTML = q.options.map((o,i) =>
      `<div class="opt" data-c="${i}"><div class="gl">${GLYPH(i)}</div>
        <div class="tx">${esc(o)}</div><span class="tick">✓</span>
        <span class="cnt"></span><span class="bar"></span></div>`).join("");
    show("#s-q");

    clearInterval(S.tick);
    S.tick = setInterval(frame, 100);
    frame();
  }

  function frame(){
    const left = Math.max(0, S.tEnd - Date.now());
    const frac = left / S.timeMs;
    $("#q-secs").textContent = Math.ceil(left / 1000);
    $("#q-arc").style.strokeDashoffset = String(CIRC * (1 - frac));
    $("#q-ring").classList.toggle("warn", left <= 5000);
    Sound.tension(1 - frac);
    if (left <= 0) endQuestion();
  }

  function onAnswer(d){
    if (d.qi !== S.qi) return;
    if (S.phase !== "q" && S.phase !== "settle") return;
    if (Date.now() > S.acceptUntil) return;   // rtMs was measured on the phone,
                                              // so a slow packet never costs points
    const p = S.players[d.pid];
    if (!p || S.answers[d.pid]) return;                  // unknown player, or already answered
    const rt = clamp(Number(d.rtMs) || 0, 0, S.timeMs);  // clamp: no negatives, no overruns
    const choice = Number(d.choice);
    if (!(choice >= 0 && choice <= 3)) return;

    const q = QUESTIONS[S.qi];
    const ok = choice === q.answer;
    p.streak = ok ? (p.streak || 0) + 1 : 0;
    const sc = scoreAnswer(rt, S.timeMs, ok, !!q.double, p.streak);
    p.score   = r2((p.score || 0) + sc.pts);
    p.totalMs = (p.totalMs || 0) + rt;
    p.lastSeen = Date.now();
    S.answers[d.pid] = { choice, rtMs: rt, ok, pts: sc.pts, bonus: sc.bonus };
    S.tally[choice]++;

    $("#q-count").textContent = Object.keys(S.answers).length;
    persist();

    if (CONFIG.AUTO_ADVANCE && S.phase === "q"){
      const n = present().length;
      if (n > 0 && Object.keys(S.answers).length >= n)
        setTimeout(() => { if (S.phase === "q") endQuestion(); }, 600);
    }
  }

  // Time is up: stop the phones, but keep listening briefly so an answer
  // that was tapped in time still counts even if its packet is slow.
  function endQuestion(){
    if (S.phase !== "q") return;
    S.phase = "settle";
    clearInterval(S.tick);
    Sound.tension(0);
    S.acceptUntil = Date.now() + SETTLE;
    Net.send("close", { qi:S.qi });
    setTimeout(reveal, SETTLE);
  }

  function reveal(){
    if (S.phase !== "settle") return;
    const q = QUESTIONS[S.qi];
    if (!q) { toLobby(); return; }
    S.phase = "reveal";

    // not answering costs you the full question time on the tiebreak
    roster().forEach(([pid,p]) => { if (!S.answers[pid]) p.totalMs = (p.totalMs || 0) + S.timeMs; });

    // speed ranking among everyone who got it right
    const right = Object.entries(S.answers).filter(([,a]) => a.ok).sort((a,b) => a[1].rtMs - b[1].rtMs);
    right.forEach(([pid], i) => { S.answers[pid].speedRank = i + 1; });
    S.fastest = right.length ? { name: S.players[right[0][0]].name, ms: right[0][1].rtMs } : null;

    S.sorted = ranks();

    const answered = Object.keys(S.answers).length || 1;
    $$("#q-opts .opt").forEach((el, i) => {
      const n = S.tally[i], pct = Math.round((n / answered) * 100);
      el.querySelector(".cnt").textContent = n || "";
      el.querySelector(".bar").style.width = pct + "%";
      el.classList.add(i === q.answer ? "win" : "dim");
    });
    $("#q-secs").textContent = "✓";
    if (q.note){ $("#q-note").textContent = q.note; $("#q-note").style.display = "block"; }
    if (S.fastest){
      $("#q-fastest").innerHTML =
        `⚡ Fastest correct answer — <b>${esc(S.fastest.name)}</b> <span class="ms">in ${secs(S.fastest.ms)}</span>`;
      $("#q-fastest").style.display = "block";
    }

    Sound.duck(true); Sound.sfx("reveal");

    const top = topList(10);
    const per = {};
    roster().forEach(([pid, p]) => {
      const a = S.answers[pid];
      per[pid] = { ok:!!(a && a.ok), pts:a ? a.pts : 0, bonus:a ? a.bonus : 0, rt:a ? a.rtMs : null,
                   sr:a && a.ok ? a.speedRank : null, nc:right.length,
                   total:p.score, rank:p.rank, prev:p.prev, streak:p.streak, n:roster().length };
    });
    Net.send("result", { qi:S.qi, correct:q.answer, per, top,
                         fastest:S.fastest, last:S.qi >= QUESTIONS.length - 1 });

    setTimeout(() => { if (S.phase === "reveal") board(); }, CONFIG.REVEAL_HOLD);
  }

  /* exact score first, then cumulative speed — never an arbitrary tie */
  function ranks(){
    const sorted = roster().sort((a,b) =>
      (b[1].score - a[1].score) ||
      ((a[1].totalMs || 0) - (b[1].totalMs || 0)) ||
      String(a[1].name).localeCompare(String(b[1].name)));
    sorted.forEach(([,p], i) => { p.prev = p.rank || (i + 1); p.rank = i + 1; });
    return sorted;
  }
  const topList = n => (S.sorted.length ? S.sorted : ranks()).slice(0, n)
    .map(([pid,p]) => ({ id:pid, n:p.name, s:p.score }));

  function board(){
    S.phase = "board";
    Sound.duck(false);
    const sorted = S.sorted.length ? S.sorted : ranks();
    const last = S.qi >= QUESTIONS.length - 1;
    $("#bd-title").textContent = last ? "Final standings" : "Leaderboard";
    $("#btn-next").textContent = last ? "Reveal the winner" : "Next question";
    $("#bd-rows").innerHTML = sorted.slice(0, 10).map(([,p], i) => {
      const d = p.prev - p.rank;
      const dl = d > 0 ? `<span class="dl up">▲${d}</span>`
               : d < 0 ? `<span class="dl dn">▼${-d}</span>` : `<span class="dl"></span>`;
      return `<div class="row r${i+1}"><span class="rk">${i+1}</span>
        <span class="nm">${esc(p.name)}</span>${dl}<span class="sc">${fmt(p.score)}</span></div>`;
    }).join("") || `<p class="muted center">No players yet.</p>`;
    show("#s-board");
    persist();
  }

  function finish(){
    S.phase = "done";
    const sorted = ranks();
    Sound.music("off"); Sound.sfx("fanfare");
    const medal = ["🥇","🥈","🥉"], order = [1,0,2];        // 2nd · 1st · 3rd
    $("#pd-top").innerHTML = order.map(i => {
      const e = sorted[i]; if (!e) return `<div></div>`;
      return `<div class="pod p${i+1}"><div class="mdl">${medal[i]}</div>
        <div class="nm">${esc(e[1].name)}</div><div class="sc">${fmt(e[1].score)}</div></div>`;
    }).join("");
    $("#pd-rest").innerHTML = sorted.slice(3, 10).map(([,p], i) =>
      `<div class="row"><span class="rk">${i+4}</span><span class="nm">${esc(p.name)}</span>
       <span class="dl"></span><span class="sc">${fmt(p.score)}</span></div>`).join("");
    show("#s-podium");
    petals(110);
    const per = {};
    sorted.forEach(([pid,p]) => per[pid] = { rank:p.rank, score:p.score, n:sorted.length });
    Net.send("final", { top: sorted.slice(0,10).map(([pid,p]) => ({ id:pid, n:p.name, s:p.score })), per });
    persist();
  }

  function petals(n){
    const cols = ["#FF8A12","#F6C445","#E63B2E","#24A96B","#3D6FF5"];
    for (let i = 0; i < n; i++){
      const d = document.createElement("div");
      d.className = "petal";
      d.style.cssText = `left:${Math.random()*100}vw;background:${cols[i%cols.length]};
        animation-duration:${3.4+Math.random()*3.4}s;animation-delay:${Math.random()*2.5}s;
        width:${8+Math.random()*10}px;height:${8+Math.random()*10}px;opacity:${.55+Math.random()*.45}`;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 9500);
    }
  }

  function persist(){ ls("room", S.room); ls("qi", S.qi); ls("players", S.players); }
  function restore(){
    const p = ls("players");
    if (p && typeof p === "object"){
      S.players = p;
      Object.values(S.players).forEach(x => { x.lastSeen = 0; x.totalMs = x.totalMs || 0; });
    }
  }

  /* ---------- messages from phones ---------- */
  Net.on("join", d => {
    if (!d.pid || !d.name) return;
    const name = String(d.name).slice(0, 14);
    const key = n => String(n).trim().toLowerCase();
    let p = S.players[d.pid];
    if (p){ p.name = name; p.lastSeen = Date.now(); }
    else {
      // Someone whose tab was closed and reopened comes back with a new id.
      // If a player of the same name has gone quiet, hand them their score back.
      const prior = roster().find(([, q]) => key(q.name) === key(name) && Date.now() - q.lastSeen > 30000);
      if (prior){
        p = prior[1];
        delete S.players[prior[0]];
        S.players[d.pid] = p;
        if (S.answers[prior[0]]){ S.answers[d.pid] = S.answers[prior[0]]; delete S.answers[prior[0]]; }
        p.lastSeen = Date.now();
      } else {
        // genuinely new; if the name is already taken by someone active, number it
        let nm = name, i = 2;
        while (roster().some(([, q]) => key(q.name) === key(nm))) nm = name + " " + (i++);
        S.players[d.pid] = { name:nm, score:0, totalMs:0, streak:0, rank:0, prev:0, lastSeen:Date.now() };
        p = S.players[d.pid];
        Sound.sfx("join");
      }
    }
    const pay = { to:d.pid, name:p.name, score:p.score, rank:p.rank,
                  n:roster().length, phase:S.phase, title:CONFIG.EVENT_TITLE };
    if (S.phase === "q" && !S.answers[d.pid]){
      const q = QUESTIONS[S.qi];
      pay.q = { qi:S.qi, total:QUESTIONS.length, q:q.q, options:q.options, time:S.timeMs,
                double:!!q.double, showText:!!CONFIG.SHOW_OPTION_TEXT_ON_PHONE,
                elapsed: clamp(S.timeMs - (S.tEnd - Date.now()), 0, S.timeMs) };
    } else if (S.answers[d.pid]) pay.locked = true;
    Net.send("welcome", pay);
    if (S.phase === "lobby" || S.phase === "boot") paintPlayers();
    persist();
  });

  Net.on("ans", onAnswer);
  Net.on("hb", d => {
    const p = S.players[d.pid];
    if (p){ p.lastSeen = Date.now(); if (S.phase === "q") $("#q-total").textContent = present().length; }
  });

  /* ---------- controls ---------- */
  function advance(){
    if (S.phase === "lobby") arm();
    else if (S.phase === "board") (S.qi >= QUESTIONS.length - 1) ? finish() : arm();
    else if (S.phase === "reveal") board();
    else if (S.phase === "q") endQuestion();
    else if (S.phase === "done") toLobby();
  }
  $("#btn-start").onclick = advance;
  $("#btn-next").onclick  = advance;
  $("#hb-next").onclick   = advance;
  $("#btn-again").onclick = toLobby;
  $("#hb-skip").onclick   = () => { if (S.phase === "q") endQuestion(); else if (S.phase === "reveal") board(); };
  $("#hb-mute").onclick   = e => { S.muted = !S.muted; Sound.mute(S.muted); e.target.textContent = S.muted ? "Unmute" : "Mute"; };
  $("#hb-reset").onclick  = () => {
    if (!confirm("Reset the whole game? Scores and players will be cleared.")) return;
    clearInterval(S.leadIv); clearInterval(S.tick);
    S.players = {}; S.qi = -1; S.sorted = []; persist(); toLobby();
  };
  document.addEventListener("keydown", e => {
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if (e.code === "Space" || e.code === "Enter"){ e.preventDefault(); advance(); }
    if (e.key.toLowerCase() === "s") $("#hb-skip").click();
    if (e.key.toLowerCase() === "m") $("#hb-mute").click();
  });

  /* ---------- boot ---------- */
  $("#boot-title").textContent = CONFIG.EVENT_TITLE;
  $("#boot-sub").textContent   = CONFIG.EVENT_SUBTITLE;
  $("#boot-note").innerHTML = Net.configured
    ? `${QUESTIONS.length} questions loaded.`
    : `<b style="color:var(--gold)">Local test mode</b> — no Supabase keys in <code>config.js</code>, so phones
       cannot join yet. Open a second tab with <code>?r=play</code> to rehearse.`;

  $("#btn-boot").onclick = () => {
    Sound.unlock();
    restore();
    S.room = makeRoom();
    $("#status").style.display = "";
    $("#hostbar").style.display = "flex";
    Net.connect(S.room, (st, detail) => {
      const el = $("#status");
      if (st === "ok"){ el.className = "status ok"; el.textContent = "● connected"; }
      else if (st === "local"){ el.className = "status wait"; el.textContent = "● local test mode"; }
      else if (st === "connecting"){ el.className = "status wait"; el.textContent = "● connecting…"; }
      else { el.className = "status bad"; el.textContent = "● reconnecting…"; console.warn(detail); }
    });
    toLobby();
    setInterval(() => { if (S.phase === "lobby") paintPlayers(); }, 3000);
  };
  show("#s-boot");
}

/* ==========================================================
   PLAYER  (the phone)
   ========================================================== */
function Player(){
  // Per-TAB identity: two people sharing one phone in two tabs stay separate.
  // sessionStorage survives reloads and screen locks; if the tab is closed
  // entirely, the host re-adopts the score by name (see the join handler).
  const newId = () => Math.random().toString(36).slice(2, 10);
  let pid;
  try {
    pid = sessionStorage.getItem("pq_pid");
    if (!pid){ pid = newId(); sessionStorage.setItem("pq_pid", pid); }
  } catch(e){
    pid = ls("pid") || newId(); ls("pid", pid);
  }

  const P = { room:"", name:"", qi:-1, t0:0, timeMs:0, answered:false, joined:false, bar:null, tick:null };

  $("#ph-title").textContent = CONFIG.EVENT_TITLE;
  const savedName = ls("name"), savedRoom = ls("room");
  if (savedName) $("#in-name").value = savedName;
  if (params.get("pin")) $("#in-pin").value = params.get("pin");
  else if (savedRoom) $("#in-pin").value = savedRoom;

  function err(m){ $("#join-err").textContent = m; }
  function hello(){ Net.send("join", { pid, name: P.name }); }

  function doJoin(){
    const pin = $("#in-pin").value.replace(/\D/g,"").trim();
    const name = $("#in-name").value.trim();
    if (!/^\d{4,6}$/.test(pin)) return err("Enter the PIN shown on the big screen.");
    if (name.length < 2) return err("Please enter your name.");
    err(""); Sound.unlock();
    P.room = pin; P.name = name;
    ls("room", pin); ls("name", name);
    $("#pw-name").textContent = name;

    Net.connect(pin, st => {
      const el = $("#status"); el.style.display = "";
      if (st === "ok"){ el.className = "status ok"; el.textContent = "● live"; hello(); }
      else if (st === "local"){ el.className = "status wait"; el.textContent = "● local"; hello(); }
      else if (st === "connecting"){ el.className = "status wait"; el.textContent = "● joining…"; }
      else { el.className = "status bad"; el.textContent = "● reconnecting…"; }
    });
    show("#p-wait");
    $("#pw-msg").innerHTML = 'Connecting<span class="wait-dots"></span>';
    setTimeout(() => { if (!P.joined) $("#pw-msg").innerHTML =
      'Still trying &mdash; check the PIN and your signal<span class="wait-dots"></span>'; }, 6000);
  }
  $("#btn-join").onclick = doJoin;
  $("#in-name").addEventListener("keydown", e => { if (e.key === "Enter") doJoin(); });
  $("#in-pin").addEventListener("keydown", e => { if (e.key === "Enter") $("#in-name").focus(); });

  function pad(d){
    const showText = d.showText !== false;
    $("#pa-num").textContent = `Question ${d.qi + 1} of ${d.total}` + (d.double ? "  ·  DOUBLE POINTS" : "");
    $("#pa-pad").innerHTML =
      `<div class="pbar" id="pa-bar"><i></i></div>` +
      d.options.map((o,i) =>
        `<button class="pbtn" data-c="${i}" data-i="${i}">${GLYPH(i)}
          ${showText ? `<span class="cap">${esc(o)}</span>` : ""}</button>`).join("");
    $$("#pa-pad .pbtn").forEach(b => b.onclick = () => answer(Number(b.dataset.i), b));
    P.bar = $("#pa-bar i");
  }

  function runClock(elapsed){
    P.t0 = performance.now() - (elapsed || 0);
    P.answered = false;
    clearInterval(P.tick);
    P.tick = setInterval(() => {
      const left = Math.max(0, P.timeMs - (performance.now() - P.t0));
      if (P.bar) P.bar.style.width = (left / P.timeMs * 100) + "%";
      if (left <= 0) clearInterval(P.tick);
    }, 80);
  }

  function answer(i, btn){
    if (P.answered) return;
    P.answered = true;
    // Measured entirely on THIS device with a monotonic clock, so the two
    // devices' wall clocks never have to agree and network lag never counts
    // against you. Sub-millisecond resolution.
    const rtMs = clamp(performance.now() - P.t0, 0, P.timeMs);
    $$("#pa-pad .pbtn").forEach(b => { b.disabled = true; if (b !== btn) b.classList.add("faded"); });
    btn.classList.add("picked");
    Sound.sfx("tap");
    if (navigator.vibrate) navigator.vibrate(28);
    Net.send("ans", { pid, qi:P.qi, choice:i, rtMs });
    clearInterval(P.tick);
    setTimeout(() => {
      if (P.answered){
        show("#p-locked");
        $("#pl-msg").innerHTML = `Locked in at <b style="color:var(--gold)">${secs(rtMs)}</b><br>
          <span class="wait-dots">Watch the screen</span>`;
      }
    }, 420);
  }

  function mini(top, into){
    if (!top || !top.length){ $(into).innerHTML = ""; return; }
    $(into).innerHTML = top.map((t,i) =>
      `<div class="m${t.id === pid ? " me" : ""}"><span class="r">${i+1}</span>
        <span class="n">${esc(t.n)}</span><span class="s">${fmt(t.s)}</span></div>`).join("");
  }

  /* ---------- messages from the screen ---------- */
  Net.on("welcome", d => {
    if (d.to !== pid) return;
    P.joined = true;
    $("#pw-name").textContent = d.name || P.name;
    $("#pw-rank").textContent = d.score ? `${Math.round(d.score).toLocaleString()} pts` : "You're in";
    if (d.q && !d.locked){                                  // rejoined mid-question
      P.qi = d.q.qi; P.timeMs = d.q.time;
      pad(d.q); runClock(d.q.elapsed || 0);
      show("#p-ans");
    } else if (d.locked){
      show("#p-locked"); $("#pl-msg").innerHTML = 'Answer already in<span class="wait-dots"></span>';
    } else {
      show("#p-wait");
      $("#pw-msg").innerHTML = 'Look up at the screen. The quiz starts soon<span class="wait-dots"></span>';
    }
  });

  Net.on("lobby", () => { show("#p-wait");
    $("#pw-msg").innerHTML = 'Look up at the screen. The quiz starts soon<span class="wait-dots"></span>'; });

  Net.on("arm", d => {
    P.qi = d.qi; P.timeMs = d.time; P.answered = false;
    pad(d);                                                  // built now, revealed on "go"
    $("#pr-q").textContent = `Question ${d.qi + 1} of ${d.total}` + (d.double ? "  ·  DOUBLE" : "");
    $("#pr-text").textContent = d.q || "";
    show("#p-ready");
    let n = Math.max(1, Math.round(CONFIG.LEAD_IN / 1000));
    $("#pr-n").textContent = n;
    const iv = setInterval(() => { n--; if (n <= 0) return clearInterval(iv); $("#pr-n").textContent = n; }, 1000);
  });

  Net.on("go", d => {
    if (d.qi !== P.qi) return;
    runClock(0);
    show("#p-ans");
    if (navigator.vibrate) navigator.vibrate(15);
  });

  Net.on("close", () => {
    clearInterval(P.tick);
    if (!P.answered){
      P.answered = true;
      show("#p-locked");
      $("#pl-msg").textContent = "Time's up — no answer from you.";
    }
  });

  Net.on("result", d => {
    const r = d.per && d.per[pid];
    if (!r) return;
    const v = $("#pv");
    v.className = "verdict " + (r.ok ? "good" : "bad");
    $("#pv-mk").textContent = r.ok ? "✓" : "✕";
    $("#pv-h").textContent = r.ok
      ? (r.sr === 1 ? "Fastest in the room!" : r.sr <= 3 ? "Quick!" : "Correct")
      : "Not this time";
    $("#pv-pts").innerHTML = r.pts > 0 ? "+" + fmt(r.pts) : "+0";
    $("#pv-meta").innerHTML = r.ok
      ? `Answered in <b style="color:var(--gold)">${secs(r.rt)}</b>` +
        (r.bonus ? ` &nbsp;·&nbsp; +${r.bonus} streak bonus` : "")
      : (r.rt != null
          ? `You answered in ${secs(r.rt)} — but that was the wrong one.`
          : "No answer went in. The streak resets.");

    const pills = [];
    if (r.ok && r.sr) pills.push(`<span class="pill gold">⚡ ${ORD(r.sr)} fastest of ${r.nc} correct</span>`);
    if (r.streak > 1) pills.push(`<span class="pill gold">🔥 ${r.streak} in a row</span>`);
    const mv = (r.prev || r.rank) - r.rank;
    if (mv > 0) pills.push(`<span class="pill up">▲ up ${mv}</span>`);
    else if (mv < 0) pills.push(`<span class="pill dn">▼ down ${-mv}</span>`);
    if (d.fastest && r.sr !== 1) pills.push(`<span class="pill">Fastest: ${esc(d.fastest.name)} ${secs(d.fastest.ms)}</span>`);
    $("#pv-pills").innerHTML = pills.join("");
    $("#pv-streak").innerHTML = "";

    $("#pv-rank").textContent = r.rank ? `#${r.rank}` : "—";
    $("#pv-tot").innerHTML = `${fmt(r.total)} points &nbsp;·&nbsp; of ${r.n} players`;
    mini(d.top, "#pv-mini");

    show("#p-res");
    Sound.sfx(r.ok ? "correct" : "wrong");
    if (navigator.vibrate) navigator.vibrate(r.ok ? [22,50,22] : 130);
  });

  Net.on("final", d => {
    show("#p-final");
    mini(d.top, "#pf-mini");
    const r = d.per && d.per[pid];
    if (!r) return;
    $("#pf-rank").textContent = `#${r.rank}`;
    $("#pf-score").innerHTML = `${fmt(r.score)} points`;
    $("#pf-mk").textContent = r.rank === 1 ? "🏆" : r.rank <= 3 ? "🎉" : "🪔";
    $("#pf-msg").textContent = r.rank === 1
      ? "You topped the room. Jai Shri Krishna!"
      : `You finished ${ORD(r.rank)} of ${r.n}. Thanks for playing!`;
    Sound.sfx(r.rank <= 3 ? "fanfare" : "bell");
  });

  // low-frequency: 50 phones must not flood the channel
  setInterval(() => { if (P.joined) Net.send("hb", { pid }); }, 20000);
  window.addEventListener("pageshow", () => { if (P.room && P.joined) hello(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && P.joined) hello(); });

  show("#p-boot");
}

/* ================= boot ================= */
drawRangoli(); scatterFeathers();
document.addEventListener("click", () => Sound.unlock(), { once:true });
document.addEventListener("touchstart", () => Sound.unlock(), { once:true });
if (ROLE === "screen"){
  // The answer key stays on the screen. Phones never download questions.js,
  // so there is nothing to read out of devtools mid-question.
  const tag = document.createElement("script");
  tag.src = "questions.js" + (window.__V || "");
  tag.onload = () => Host();
  tag.onerror = () => {
    document.querySelector("#boot-note").innerHTML =
      '<b style="color:var(--no)">questions.js failed to load.</b> Check it sits next to index.html.';
  };
  document.head.appendChild(tag);
} else Player();

})();
