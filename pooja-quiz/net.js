/* ==========================================================
   POOJA QUIZ — transport
   Primary : Supabase Realtime Broadcast (plain WSS — works on
             guest wifi + cellular, unlike WebRTC without TURN)
   Fallback: BroadcastChannel (same browser, for rehearsal)
   ========================================================== */
const Net = (() => {
  let ch = null, bc = null, client = null;
  let room = "", handlers = {}, statusCb = () => {};
  let mode = "none", retry = 0, watchdog = null, closed = false;

  const configured = () =>
    !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY &&
       /^https:\/\/.+\.supabase\.(co|in)/.test(CONFIG.SUPABASE_URL.trim()));

  function emit(msg){
    if (!msg || !msg.t) return;
    (handlers[msg.t] || []).forEach(fn => { try { fn(msg.d || {}); } catch(e){ console.error(e); } });
  }

  function setStatus(s, detail){ statusCb(s, detail); }

  function subscribeChannel(){
    ch = client.channel("pooja-" + room, {
      config: { broadcast: { self: false, ack: false }, presence: { key: "" } }
    });
    ch.on("broadcast", { event: "m" }, ({ payload }) => emit(payload));
    ch.subscribe((status, err) => {
      if (status === "SUBSCRIBED"){
        retry = 0; setStatus("ok");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED"){
        if (closed) return;
        setStatus("reconnecting", err && err.message);
        clearTimeout(watchdog);
        const wait = Math.min(1000 * Math.pow(1.7, retry++), 12000);
        watchdog = setTimeout(() => {
          try { client.removeChannel(ch); } catch(e){}
          subscribeChannel();
        }, wait);
      }
    });
  }

  return {
    get mode(){ return mode; },
    get configured(){ return configured(); },
    get room(){ return room; },

    on(t, fn){ (handlers[t] = handlers[t] || []).push(fn); },

    connect(roomCode, onStatus){
      room = String(roomCode); statusCb = onStatus || (() => {}); closed = false;
      if (configured()){
        mode = "supabase";
        client = window.supabase.createClient(
          CONFIG.SUPABASE_URL.trim(), CONFIG.SUPABASE_ANON_KEY.trim(),
          { realtime: { params: { eventsPerSecond: 40 } },
            auth: { persistSession: false, autoRefreshToken: false } }
        );
        setStatus("connecting");
        subscribeChannel();
      } else {
        mode = "local";
        bc = new BroadcastChannel("pooja-" + room);
        bc.onmessage = e => emit(e.data);
        setStatus("local");
      }
      return mode;
    },

    send(t, d){
      const msg = { t, d: d || {} };
      if (mode === "supabase"){
        if (!ch) return false;
        ch.send({ type: "broadcast", event: "m", payload: msg })
          .catch(e => console.warn("send failed", e));
        return true;
      }
      if (mode === "local" && bc){ bc.postMessage(msg); return true; }
      return false;
    },

    close(){
      closed = true; clearTimeout(watchdog);
      try { if (ch && client) client.removeChannel(ch); } catch(e){}
      try { if (bc) bc.close(); } catch(e){}
      ch = null; bc = null;
    }
  };
})();
