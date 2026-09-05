# Krishnashtami Pooja Quiz

A Kahoot-style live quiz. The **big screen** shows the question; everyone plays
from their **own phone**. Speed and accuracy both decide the score.

---

## 1. Before the event — the one thing you must do

Open `config.js` and paste two values:

```js
SUPABASE_URL:      "https://xxxxxxxxxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

Get them from **supabase.com → your project → Settings → API**
(`Project URL` and the `anon` / `public` key — that key is designed to sit in a
browser, it is not a secret).

You do **not** need any tables, SQL, or schema changes. The quiz uses Supabase
Realtime *Broadcast*, which works on a brand-new project out of the box.

> Leave the keys blank and the app runs in **local test mode** — two tabs in one
> browser can play, so you can rehearse without touching Supabase.

Then set the event name at the top of the same file, and put your own questions
in `questions.js` (format is documented at the top of that file).

---

## 2. Running it

It is plain static files — no build step.

**Locally**
```bash
cd pooja-quiz
python3 -m http.server 8777
```
- Big screen → `http://localhost:8777/`
- Phones     → `http://localhost:8777/?r=play`

**On bharcode.com** — copy the folder into your Astro site's `public/`:
```bash
cp -R ~/pooja-quiz ~/Documents/BharCode/public/pooja-quiz
```
Then build and deploy as usual. It serves at `https://bharcode.com/pooja-quiz/`
and the screen generates the QR code for `.../pooja-quiz/?r=play` automatically.

> If the screen is on `localhost` but phones are not, set `PUBLIC_URL` in
> `config.js` to the address the phones should use — otherwise leave it blank.

---

## 3. Running the night

1. Open the screen and press **Light the lamp · Begin** (this also unlocks audio —
   browsers require one click before any sound).
2. Guests scan the QR or type the PIN, enter a name, and land in the lobby.
3. Press **Start the quiz**.

**Host controls** (bottom bar, faint until you hover):

| Key / button | Does |
|---|---|
| `Space` / **Next** | Start, or advance to the next question |
| `S` / **Skip** | End the current question early |
| `M` / **Mute** | Mute everything |
| **Reset** | Wipe scores and players, back to the lobby |

The screen survives an accidental refresh — scores and the PIN are saved locally.
A guest whose phone locks or whose tab reloads keeps their score; if they close
the tab entirely and rejoin **with the same name**, the screen hands their score
back automatically.

---

## 4. How scoring works

```
correct answer  →  1000 − 500 × (your time ÷ question time)      + streak bonus
wrong answer    →  0
```

- **Every correct answer scores.** Speed only decides how much: instant is 1000,
  answering on the buzzer is still 500. Never zero for a right answer.
- Points carry **two decimals**. Over a 20-second question the value drops
  0.025 points per millisecond, so two people a **single millisecond** apart get
  different scores — they can never tie by rounding.
- **Streak bonus:** 2nd correct in a row +100, 3rd +200 … capped at +500.
- Questions marked `double: true` are worth 2×.
- Ties break on exact score, then on cumulative response time (faster wins).

**Your time is measured on your own phone**, from the moment the question goes
live to the moment you tap, using a monotonic clock. So a slow connection never
costs you points, and the two devices' clocks never have to agree. Answers that
were tapped in time but arrive late are still counted (there is a 1.2 s settling
window after the buzzer).

**No one can see the answer early.** `questions.js` is loaded by the screen only —
phones never download it, so there is nothing to read out of devtools. Answering
early just locks your answer in; the result appears for everyone at once when the
timer ends. `AUTO_ADVANCE` is off for this reason; turn it on in `config.js` only
if you want the question to close as soon as everyone has answered.

---

## 5. Fifty people

Comfortable. A 50-phone room uses about 50 of Supabase's 200 free concurrent
connections, and a full 16-question game sends roughly 200–300k realtime
messages against a 2M/month free allowance. Heartbeats are deliberately slow
(20 s) to keep that number down.

The lobby shows up to 48 names then "+N more"; the leaderboard shows the top 10
between every question, and each player sees their own rank, their exact
response time, and the top 10 on their phone after every question.

---

## 6. Files

| File | What it is |
|---|---|
| `config.js` | **Edit this** — Supabase keys, event name, timings |
| `questions.js` | **Edit this** — your questions (screen-side only) |
| `index.html` | Both screens; `?r=play` selects the phone view |
| `style.css` | All styling |
| `game.js` | Game logic, scoring, host + player state machines |
| `net.js` | Supabase Realtime transport (+ local test fallback) |
| `audio.js` | Tanpura, bansuri, tabla, bells — synthesized, no audio files |
| `fonts/`, `fonts.css` | Yatra One + Baloo 2, self-hosted |
| `vendor/` | supabase-js and the QR generator, vendored locally |

Everything is self-hosted, so a flaky venue connection cannot break the page.
