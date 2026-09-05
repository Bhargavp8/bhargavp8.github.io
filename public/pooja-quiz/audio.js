/* ==========================================================
   POOJA QUIZ — generated audio (Web Audio API, no files)
   tanpura drone · bansuri · tabla · temple bell · shehnai
   ========================================================== */
const Sound = (() => {
  let ctx = null, master, musicBus, sfxBus, ready = false;
  let mode = "off", tension = 0;
  let timer = null, nextTime = 0, step = 0, tanpuraStep = 0;
  const LOOKAHEAD = 0.12, TICK = 25;

  // C-based scale (Sa = C)
  const N = { Sa1:65.41, Pa1:98.00, Sa2:130.81, Ga2:164.81, Ma2:174.61, Pa2:196.00,
              Dh2:220.00, Ni2:246.94, Sa3:261.63, Ga3:329.63, Pa3:392.00, Sa4:523.25 };

  function init(){
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();   master.gain.value = 1;      master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0;     musicBus.connect(master);
    sfxBus = ctx.createGain();   sfxBus.gain.value = CONFIG.SFX_VOL; sfxBus.connect(master);
    buildDrone();
    ready = true;
  }

  /* ---------- persistent low drone ---------- */
  let droneGain;
  function buildDrone(){
    droneGain = ctx.createGain(); droneGain.gain.value = 0.10;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = 3;
    droneGain.connect(lp); lp.connect(musicBus);
    [[N.Sa1,0],[N.Sa1,4],[N.Sa2,-3]].forEach(([f,det])=>{
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.value = f; o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = 0.28;
      o.connect(g); g.connect(droneGain); o.start();
    });
    // slow breathing
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const la = ctx.createGain(); la.gain.value = 0.035;
    lfo.connect(la); la.connect(droneGain.gain); lfo.start();
  }

  /* ---------- plucked string (tanpura) ---------- */
  function pluck(freq, t, dur = 3.4, amp = 0.5){
    const out = ctx.createGain(); out.gain.value = amp; out.connect(musicBus);
    const HARM = [[1,1],[2,.5],[3,.32],[4,.2],[5,.14],[6,.1],[8,.07],[11,.045]];
    HARM.forEach(([h, a], i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * h;
      const g = ctx.createGain();
      const d = dur / (1 + i * 0.55);            // highs decay first
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a * 0.22, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
    });
  }

  /* ---------- tabla ---------- */
  function noiseBuf(len = 0.4){
    const n = Math.floor(ctx.sampleRate * len);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  let NB = null;
  function tabla(kind, t, amp = 1){
    if (!NB) NB = noiseBuf();
    const out = ctx.createGain(); out.connect(musicBus);
    if (kind === "dha"){                          // bass stroke
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(165, t);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.19);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.85 * amp, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
    } else {                                      // "tin" rim
      const o = ctx.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(640, t);
      o.frequency.exponentialRampToValueAtTime(500, t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.42 * amp, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.13);

      const s = ctx.createBufferSource(); s.buffer = NB;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100; bp.Q.value = 2.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.2 * amp, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      s.connect(bp); bp.connect(ng); ng.connect(out); s.start(t); s.stop(t + 0.08);
    }
  }

  /* ---------- bansuri (bamboo flute) ---------- */
  function flute(freq, t, dur = 0.5, amp = 0.3, bus = musicBus){
    const out = ctx.createGain(); out.connect(bus);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(amp, t + dur * 0.22);
    out.gain.setValueAtTime(amp, t + dur * 0.68);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(freq, t);
    const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.setValueAtTime(freq * 2, t);
    const g2 = ctx.createGain(); g2.gain.value = 0.1;

    const vib = ctx.createOscillator(); vib.frequency.setValueAtTime(4.8, t);
    const vg = ctx.createGain(); vg.gain.setValueAtTime(freq * 0.011, t);
    vib.connect(vg); vg.connect(o.frequency);

    if (!NB) NB = noiseBuf();
    const br = ctx.createBufferSource(); br.buffer = NB; br.loop = true;
    const bf = ctx.createBiquadFilter(); bf.type = "bandpass"; bf.frequency.value = freq * 2.4; bf.Q.value = 1.1;
    const bg = ctx.createGain(); bg.gain.value = 0.05;

    o.connect(out); o2.connect(g2); g2.connect(out);
    br.connect(bf); bf.connect(bg); bg.connect(out);
    [o, o2, vib, br].forEach(n => { n.start(t); n.stop(t + dur + 0.06); });
  }
  function bansuriPhrase(t0 = 0){
    if (!ready) return;
    const t = ctx.currentTime + t0;
    const ph = [[N.Pa2,0,.42],[N.Dh2,.36,.34],[N.Sa3,.68,.52],[N.Ni2,1.2,.3],[N.Dh2,1.46,.34],[N.Pa2,1.8,.9]];
    ph.forEach(([f, d, l]) => flute(f, t + d, l, 0.26));
  }

  /* ---------- temple bell ---------- */
  function bell(t0 = 0, amp = 0.5){
    if (!ready) return;
    const t = ctx.currentTime + t0;
    const out = ctx.createGain(); out.gain.value = amp; out.connect(sfxBus);
    [[1,1,3.4],[2.76,.6,2.6],[5.4,.36,1.9],[8.93,.22,1.3],[13.3,.12,.8]].forEach(([r, a, d]) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 262 * r;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a * 0.3, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
    });
  }

  /* ---------- scheduler ---------- */
  function bpm(){ return 88 + tension * 84; }
  function schedule(){
    const spb = 60 / bpm(), sixteenth = spb / 2;
    while (nextTime < ctx.currentTime + LOOKAHEAD){
      const t = nextTime, s = step % 8;
      if (mode === "question"){
        if (s === 0) tabla("dha", t, 1);
        else if (s === 2) tabla("tin", t, .8);
        else if (s === 4) tabla("dha", t, .85);
        else if (s === 6) tabla("tin", t, .7);
        else if (s === 7 && tension > .55) tabla("tin", t, .4);
        if (tension > .8 && s % 2 === 1) tabla("tin", t, .3);
      } else if (mode === "lobby" && step % 16 === 0){
        tabla("tin", t, .25);
      }
      // tanpura cycle: Pa - Sa - Sa - Sa(low)
      if (step % 8 === 0){
        const cyc = [N.Pa2, N.Sa3, N.Sa3, N.Sa2];
        pluck(cyc[tanpuraStep % 4], t, 3.6, mode === "question" ? 0.32 : 0.46);
        tanpuraStep++;
      }
      nextTime += sixteenth; step++;
    }
  }

  /* ---------- public ---------- */
  const api = {
    unlock(){
      init();
      if (ctx && ctx.state === "suspended") ctx.resume();
      return !!ctx;
    },
    get on(){ return ready; },
    music(m){
      if (!ready || !CONFIG.MUSIC_ON) return;
      mode = m;
      const g = musicBus.gain, now = ctx.currentTime;
      const target = m === "off" ? 0 : (m === "question" ? CONFIG.MUSIC_VOL : CONFIG.MUSIC_VOL * 0.85);
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(g.value, 0.0001), now);
      g.linearRampToValueAtTime(target, now + (m === "off" ? 0.9 : 1.4));
      if (m === "off"){ if (timer){ clearInterval(timer); timer = null; } return; }
      if (!timer){ nextTime = ctx.currentTime + 0.08; step = 0; timer = setInterval(schedule, TICK); }
    },
    tension(v){ tension = Math.max(0, Math.min(1, v)); },
    duck(on){
      if (!ready) return;
      const now = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(on ? CONFIG.MUSIC_VOL * 0.25 : CONFIG.MUSIC_VOL, now + 0.35);
    },
    mute(m){ if (ready) master.gain.linearRampToValueAtTime(m ? 0 : 1, ctx.currentTime + 0.25); },

    sfx(name){
      if (!ready) return;
      const t = ctx.currentTime;
      switch (name){
        case "join": flute(N.Sa3, t, .22, .3, sfxBus); flute(N.Pa3, t + .11, .28, .26, sfxBus); break;
        case "tap":  tabla("tin", t, .55); break;
        case "bell": bell(0, .55); break;
        case "reveal": bell(0, .5); break;
        case "correct":
          [N.Sa3, N.Ga3, N.Pa3, N.Sa4].forEach((f, i) => flute(f, t + i * .085, .3, .3, sfxBus));
          break;
        case "wrong": {
          const o = ctx.createOscillator(); o.type = "sawtooth";
          o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(72, t + .42);
          const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 720;
          const g = ctx.createGain();
          g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .48);
          o.connect(lp); lp.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .5);
          break; }
        case "whoosh": {
          if (!NB) NB = noiseBuf();
          const s = ctx.createBufferSource(); s.buffer = NB;
          const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
          bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.2, t + .12);
          g.gain.exponentialRampToValueAtTime(.0001, t + .36);
          s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + .4);
          break; }
        case "fanfare": {
          bell(0, .6);
          const mel = [[N.Sa3,0,.3],[N.Ga3,.16,.3],[N.Pa3,.32,.3],[N.Sa4,.5,.85],[N.Pa3,1.25,.3],[N.Sa4,1.45,1.3]];
          mel.forEach(([f, d, l]) => {           // shehnai: reedy saw through bandpass
            const tt = t + d;
            const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, tt);
            const bp2 = ctx.createBiquadFilter(); bp2.type = "bandpass"; bp2.frequency.value = f * 2.6; bp2.Q.value = 3.2;
            const vib = ctx.createOscillator(); vib.frequency.value = 5.6;
            const vg = ctx.createGain(); vg.gain.value = f * .016;
            vib.connect(vg); vg.connect(o.frequency);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, tt);
            g.gain.linearRampToValueAtTime(.26, tt + l * .16);
            g.gain.exponentialRampToValueAtTime(.0001, tt + l);
            o.connect(bp2); bp2.connect(g); g.connect(sfxBus);
            o.start(tt); o.stop(tt + l + .05); vib.start(tt); vib.stop(tt + l + .05);
          });
          bell(1.5, .45);
          break; }
      }
    },
    bansuri: bansuriPhrase
  };
  return api;
})();
