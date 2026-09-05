/* ============================================================
   POOJA QUIZ — CONFIG
   The only file you must edit before the event.
   ============================================================ */

const CONFIG = {

  /* ---- 1. SUPABASE (required for multi-device play) ----------
     Supabase Dashboard -> your project -> Settings -> API
       SUPABASE_URL      = "Project URL"
       SUPABASE_ANON_KEY = "anon / public" key   (safe in a browser)
     Leave blank to run in LOCAL TEST MODE (two tabs, one browser).
  ------------------------------------------------------------ */
  SUPABASE_URL:      "https://wjfbnobjtdhtqopukgpn.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZmJub2JqdGRodHFvcHVrZ3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NzIzNDAsImV4cCI6MjEwNDE0ODM0MH0.Hj2DfsObXl9QS_cFa1QPXyHIOVFE5d_51yDry-kAw8E",

  /* ---- 2. EVENT ---- */
  EVENT_TITLE:    "Krishnashtami",
  EVENT_SUBTITLE: "Quiz Night",

  /* Public URL players type/scan to join.
     "" = auto-detect from the screen's own address (fine for most cases).
     Set it explicitly if the screen is on localhost but phones are not. */
  PUBLIC_URL: "",

  /* ---- 3. GAMEPLAY ---- */
  DEFAULT_TIME:  20,    // seconds per question (override per question)
  LEAD_IN:     3000,    // ms of "Get ready" before the clock starts
  REVEAL_HOLD: 6000,    // ms the answer breakdown stays up
  MAX_POINTS:  1000,    // points for an instant correct answer
  MIN_POINTS:   500,    // points for a correct answer at the buzzer
  STREAK_STEP:  100,    // bonus per consecutive correct answer
  STREAK_CAP:   500,    // max streak bonus
  SHOW_OPTION_TEXT_ON_PHONE: true,  // false = shapes only, Kahoot-style
  /* Reveal only when the clock runs out, so nobody who answers early can
     see the answer and pass it on. true = close as soon as everyone has
     answered (faster, but the reveal can land while a slow phone is
     still thinking). Leave false for a fair room. */
  AUTO_ADVANCE: false,

  /* ---- 4. ROOM ----
     "" = a new random 5-digit PIN each time the screen loads.
     Set e.g. "10108" to keep the same PIN across reloads. */
  FIXED_ROOM: "",

  /* ---- 5. AUDIO ---- */
  MUSIC_ON:  true,
  MUSIC_VOL: 0.34,      // 0 - 1
  SFX_VOL:   0.55,
};
