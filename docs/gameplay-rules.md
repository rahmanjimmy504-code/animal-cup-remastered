# Animal Cup — FC 26/27-Style Gameplay Rules

The complete gameplay spec for the remaster: match rules, the two playstyle
presets (Arcade / Authentic), the control layer (PC + mobile touch + LAN pad),
the player attribute model, the reference resolution algorithms, AI behaviour,
set pieces, keepers, physicality, UI feedback — and an honest engine-side
roadmap for what still needs the match engine source.

> **Honesty note.** The match engine ships as a closed bundle
> (`public/match-runtime-min/`, minified). This spec separates, for every
> feature, what is **live today**, what the **React seam** drives, and what is
> **roadmap** (needs the engine source). Nothing in this doc silently pretends
> a reference parameter is wired into the engine when it is not.

---

## 1. Match rules (what the engine actually plays)

| Rule | Value / behaviour |
|---|---|
| Sides | 7v7 — 1 goalkeeper + 6 outfield per team (formation: 2 defenders, 3 mid, 1 attacker default, randomised per match from `[433, 442, 343, 424, 352, 532]` shapes) |
| Match length | `time` (full-match minutes) from the URL: 4 / 6 / 10 — split into two halves of `30·time` seconds each |
| Draw | Allowed |
| Outfield attributes | Every outfield player of a team is instantiated with the **same role archetype** (one accuracy value per player at creation) — so per-team, per-role attributes are the truest stat model the engine can represent |
| AI levels | 0–3 (`?ai=`; 0 easiest, 3 hardest). Watch mode defaults to 3, play mode to 0; the landing screen's **AI assistance** setting shifts this by ±1 (see §6) |
| AI shooting | `shootingTime = ai ≥ 2 ? 0.19 + dist/70 : 0.125 + rand(0, 0.175)` — higher AI shoots sooner and from range |
| Player switching | **Auto-switch** to the nearest outfield player is always on (by design — the switch button was deliberately removed); manual switch has a 1.2 s cooldown |
| Restarts | Kick-off, corner, goal kick, throw-in (engine state machine: `Kickoff / Corner / GoalKick / ThrowIn / HalfEnded / EndMatch`) |
| Free kicks / penalties / cards / referee | **Not modelled** by the engine — fouls do not produce card or set-piece states. Roadmap (§13) |
| Aiming | Holding **Shoot** for >0.12 s drops game time to 0.4× (slow-mo) while aiming (P1) |
| Human keeper | In play mode the engine nerfs the human's keeper (catch ×0.5, force ×0.65, sprint ×0.78, run ×0.8, intercept ×0.6) so a human can still get beaten — see §10 |

The `__acRules` payload the React side installs (`GameClient.installGameplayLayer`)
declares the intended state/shot/pass enumerations; the engine currently
implements the restart states listed above.

---

## 2. Playstyle presets — Arcade vs Authentic

Source of truth: `app/game/gameplay.js` (`PRESETS`).

**What the engine applies at match start** (`setupMatch`, via
`window.__acGameplay.config`):

| Field | Effect in the engine |
|---|---|
| `playerSpeedMultiplier` | multiplies every player's `sprintSpeed` and `runSpeed` |
| `accelerationMultiplier` | multiplies every player's `maxForce` and `acceleration` |

Everything else is a **reference parameter**: persisted with the preset,
consumed by the resolution functions in `gameplay.js` (the deterministic
reference implementations below), and documented here — the contract a future
engine build (with source access) or a server-side referee implements 1:1.

### Tuning table

| Parameter | 🎮 Arcade | 🧠 Authentic | Applies to |
|---|---|---|---|
| playerSpeedMultiplier | **1.14** | **1.00** | engine (live) |
| accelerationMultiplier | **1.16** | **0.94** | engine (live) |
| passSpeedMultiplier | 1.12 | 0.96 | pass resolution |
| passAccuracyBase | 0.92 | 0.78 | pass resolution |
| shotAccuracyBase | 0.90 | 0.78 | shot resolution |
| shotSpeedMultiplier | 1.08 | 0.98 | shot resolution |
| dribbleControl | 1.12 | 0.94 | reference (tightness feel) |
| skillMoveMultiplier | 1.10 | 0.96 | shot-after-skill bonus |
| weakFootPenalty | 0.25 | 0.55 | shot resolution (weak foot) |
| aiDefendAggression | 0.38 | 0.50 | reference (AI press) |
| aiAssist | 0.20 | 0.55 | reference (AI cooperation) |
| aiJockeyRatio | 0.25 | 0.60 | reference (AI jockey usage) |
| foulFrequency | 0.28 | 0.45 | tackle resolution (foul odds) |
| physicality | 0.90 | 1.08 | duel resolution scale |
| keeperReaction | 0.92 | 1.04 | reference (GK saves) |
| offsideTolerance | 0.22 | 0.08 | reference (offside line) |
| staminaDrain | 0.90 | 1.08 | reference (stamina model) |
| jockeySpeed | 0.60 | 0.55 | **live — touch/LAN jockey button velocity scale** |
| tackleCooldown | 0.9 s | 1.4 s | reference (slide-tackle lockout) |

The UI shows the user two plain-language summaries (see Settings):

- **Arcade** — "Fast, snappy and forgiving — quick players, easy passes and
  shots, gentle tackles."
- **Authentic** — "Slower, tighter, more physical — real pass and shot risk,
  strong pressing, hard duels."

---

## 3. Controls

All three input surfaces expose the **same action set**, so every gameplay
feature is equally reachable on PC keyboard, mobile touch, and the LAN pad.

### 3.1 PC keyboard — the engine's actual default layout

(From the engine `profiles` module `keyboardLayout` — this is what really
works, and what the in-match legend and Settings now display. The old
"Advanced controls" text on Settings described unbound keys — removed.)

| Key | Action |
|---|---|
| ↑ ↓ ← → | Move |
| **A** | Pass (assisted or manual per §4) |
| **W** | Lob / cross |
| **D** | Shoot / header |
| **S** | Slide tackle |
| **Q** | Manually switch player (1.2 s cooldown) |
| **Ctrl** | **Jockey** (walk — tight tracking/close-downs) |
| **T** | Trap (steal the loose ball) |
| **Shift** | Sprint — and the pass/lob **assist modifier** (§4) |
| Hold **D** | Slow-mo aiming (time 0.4×) |
| Space / Esc / [ ] | Toggle team / pause·back / alternate camera |

### 3.2 Mobile touch (`TouchControls`)

| Control | Action |
|---|---|
| Left stick | Move (dead zone 0.18) |
| Bottom-right diamond | Pass · Lob · Tackle · **Shoot (hold to aim)** |
| Centre of diamond | Sprint (hold) |
| **Jockey button** (above the stick, left thumb) | Jockey — hold; stick output is scaled to the preset `jockeySpeed` (0.60 arcade / 0.55 authentic). The touch contract has no walk field, so this scales `vx/vy` — `acApplyInput` derives controller speed from the magnitude, so the player walks instead of runs |
| Pinch (two fingers) | Camera zoom |
| Auto-switch | Always on |

### 3.3 LAN pad (second phone, `/pad`)

Identical action set: stick + Pass/Lob/Tackle/Shoot diamond + centre Sprint +
**Jockey button above the stick**. The pad streams raw input at ~30 Hz; the
host (`LanHostBridge`) folds it into `__touchInput`/`__touchInput2` and applies
the **host's** preset `jockeySpeed` (the phone's own localStorage is not
authoritative).

---

## 4. Assisted / manual passing (live)

The engine exposes `user.passing` (0–3) on every user; pass **and** lob both
honour it, with **Shift (sprint) as the modifier**:

| Mode | Default | Hold sprint |
|---|---|---|
| 0 | assisted | assisted |
| **1** | assisted | manual |
| **2** | manual | assisted |
| 3 | manual | manual |

The Settings toggle **Passing: Assisted/Manual** maps to mode **1 / 2** so the
sprint key always gives the *other* behaviour (FC-style hybrid). It is applied
at match time by `app/game/userAssist.js` (`useUserAssist`, mounted in
`MatchChrome`): it polls `window.require("users").list` and writes
`user.passing` on every human user until the stored preference matches — a
no-op once applied, and safe across the seam.

## 5. AI assistance (live)

Settings **AI assistance: low / medium / high** is applied on top of the chosen
match difficulty when a match is launched from the landing screen
(`effectiveAiLevel` in `gameplay.js`):

```
effectiveAi = clamp(0, 2, difficulty + (high → +1, medium → 0, low → −1))
```

i.e. *high assist* plays the match a notch easier, *low assist* a notch
harder. Watch/Quick/Cup/Season entries that hard-code `ai=1` are unaffected.

---

## 6. Player attribute model

Source of truth: `app/data/players.js`.

**Why (team, role) and not per-squad-player:** the engine creates all six
outfield players of a team with the same archetype (see §1), so a per-squad
stat sheet would be fiction. The attribute sheet is therefore keyed exactly
like the engine's data model: `attrForRole(teamId, role)`.

**Scale:** 55–92 (inside the engine's own ~0–100 stat range, so a future
engine hook can consume values 1:1). Team OVR is derived from the engine's own
team rating (`team.json` `rating`, e.g. GER 2044): `ovr = round((rating−1500)/55)`
→ GER 84 · ESP 83 · BRA 82 · ARG 81 · ENG 79 · FRA 78 · POR 74 · USA 68.

**Stars (FC-style, 1–5):**
- **weakFoot ★** — how bad the non-dominant foot is (5 = no penalty). Used by
  `shotOutcome` (live in the reference; roadmap for the engine).
- **skillMoves ✦** — flair rating. Gates the post-skill-move shot bonus and is
  displayed on landing cards + the in-match player chip.

### Schema

```ts
type Role = "gk" | "d" | "m" | "a";
type TeamId = "england" | "france" | "germany" | "spain" |
              "portugal" | "brazil" | "argentina" | "usa";

interface PlayerAttributes {
  pace: number;        // 55–92
  shooting: number;    // 55–92
  passing: number;     // 55–92
  dribbling: number;   // 55–92
  defending: number;   // 55–92
  physical: number;    // 55–92
  heading: number;     // 55–92
  weakFoot: 1 | 2 | 3 | 4 | 5;    // 4 for keepers (trained both feet)
  skillMoves: 1 | 2 | 3 | 4 | 5;
}

interface TeamSheet {
  teamId: TeamId;
  ovr: number;                 // 68–84 (from engine rating)
  style: PlayerAttributes;     // nation style vector (team-level)
  byRole: Record<Role, PlayerAttributes>;
}
```

### Nation style vectors (team level)

| Team | PAC | SHO | PAS | DRI | DEF | PHY | HEA | weakFoot ✦ | skill ✦ |
|---|---|---|---|---|---|---|---|---|---|
| 🦁 England | 78 | 79 | 78 | 77 | 82 | 84 | 80 | 3 | 3 |
| 🐓 France | 80 | 76 | 78 | 79 | 83 | 80 | 78 | 3 | 4 |
| 🦅 Germany | 79 | 80 | 86 | 80 | 85 | 82 | 82 | 4 | 3 |
| 🐂 Spain | 77 | 80 | 87 | 82 | 79 | 76 | 77 | 3 | 4 |
| 🐺 Portugal | 81 | 78 | 81 | 84 | 76 | 75 | 75 | 2 | 5 |
| 🐆 Brazil | 84 | 80 | 83 | 88 | 76 | 75 | 74 | 3 | 5 |
| 🐆 Argentina | 83 | 84 | 84 | 88 | 78 | 76 | 77 | 3 | 5 |
| 🦅 USA | 82 | 72 | 74 | 76 | 74 | 80 | 78 | 3 | 3 |

Role offsets (applied to the team style, clamped 55–92):

| Role | PAC | SHO | PAS | DRI | DEF | PHY | HEA | skill ✦ |
|---|---|---|---|---|---|---|---|---|
| GK (absolute) | ~66 | 42 | ~72 | 58 | 86 | ~72 | ~82 | weakFoot 4 · skill 1 |
| D | −2 | −12 | −4 | −6 | +4 | +2 | +1 | −0.75 |
| M | −1 | −4 | +2 | −2 | −2 | 0 | 0 | team |
| A | +2 | +4 | 0 | +3 | −10 | −2 | −1 | −0.5 (weak foot) |

**Where the sheet is used (live, React-side):**
- Landing team cards — OVR badge, top stat, skill stars (hover: full sheet)
- In-match **PlayerInfo chip** — the controlled player's role + stars + the
  role's two identity stats (GK: DEF/HEA · D: DEF/PAC · M: PAS/DRI · A: SHO/PAC)
- Settings & squad screens
- This document

---

## 7. Resolution algorithms (reference implementations)

All in `app/game/gameplay.js`. Deterministic (no RNG) — a future engine hook or
server-side referee supplies a roll in [0,1) and compares against the returned
probability. Stats are the §6 scale; `c` is the active preset.

### 7.1 Pass

```js
passOutcome({ passing = 70, pressure = 0.2, distance = 1, through, lofted }, c)
  risk      = pressure·0.45 + min(1, distance/30)·0.2 + (lofted ? 0.16 : 0)
  accuracy  = clamp01( c.passAccuracyBase + (passing−70)/500 − risk + (through ? 0.02 : 0) )
  speed     = c.passSpeedMultiplier · (through ? 1.06 : lofted ? 0.92 : 1)
  curve     = through ? max(0, (passing−55)/100) : 0
```

### 7.2 Shot — `SHOT_TYPES = normal | finesse | chip | power`

```js
shotOutcome({ shooting, weakFoot, skillMoves, pressure, distance,
              type, offWeakFoot, afterSkillMove }, c)
  penalty  = pressure·0.42 + min(1, distance/35)·0.16 + (power ? 0.12 : 0)
  accuracy = c.shotAccuracyBase + (shooting−70)/450 − penalty
           − (finesse ? 0.025 : 0) − (chip ? 0.04 : 0)
           − (offWeakFoot ? (5−weakFoot)·0.045·c.weakFootPenalty·2 : 0)
           + (afterSkillMove ? (skillMoves−1)·0.012·c.skillMoveMultiplier : 0)
  speed    = c.shotSpeedMultiplier · (power 1.22 · finesse 0.94 · chip 0.78 · else 1)
  curve    = finesse ? max(0.12, shooting/100) : 0
```

- **Weak foot:** shooting with the non-dominant foot loses accuracy in
  proportion to the star deficit, scaled by the preset (`arcade 0.25` is
  forgiving, `authentic 0.55` punishes).
- **Skill move:** a shot right after a successful skill move gains a small
  skill-rated bonus — the FC "trick unlocks the finish" loop.
- Live today: the engine's own physical shot; the resolver is the contract for
  the four shot types (roadmap §13 — the engine's shoot button is a single
  type today, plus the slow-mo aim).

### 7.3 Tackle

```js
tackleOutcome({ defending, physical, attackerPhysical, position, timing,
                fromBehind, jockeyed }, c)
  jockeyBonus = jockeyed ? 0.15 : 0
  foulDamp    = jockeyed ? 0.4 : 1
  success = clamp(0.08, 0.92, 0.42 + (defending−70)/260
            + (physical−attackerPhysical)/500 + (position−0.5)·0.28
            + (timing−0.5)·0.3 + jockeyBonus)
  foul    = clamp(0.02, 0.55, ((fromBehind ? 0.18 : 0) + (timing < 0.25 ? 0.12 : 0)
            + c.foulFrequency·0.1) · foulDamp)
  card    = foul > 0.42 ? "red" : foul > 0.24 ? "yellow" : null   // reference — no cards in engine
```

`timing` 0–1: early → late. **Jockeying before the tackle** (walking in tight,
Ctrl / the jockey button) is rewarded: +15% success, −60% foul odds — this is
what makes jockeying a strategy instead of a speed penalty.

### 7.4 Physical duel

```js
physicalOutcome(a, b, c)
  power(x) = x.physical·c.physicality + x.pace·0.12
  winner = power(a) >= power(b) ? "a" : "b"     (margin = |power(a)−power(b)|)
```

### 7.5 Header (corners / free kicks)

```js
headerOutcome({ heading, physical, pace, timing, position, reach }, c)
  win        = clamp(0.12, 0.95, 0.5 + (heading−70)/300
                 + (timing−0.5)·0.34 + (0.5−|position−0.55|)·0.2 − (contested ? 0.12 : 0))
  shotQuality = clamp(0.2, 0.95, (heading−60)/40 · (0.8 + (physical·0.6+pace·0.4)/100 · 0.3))
```

`timing` = jump vs ball flight; `position` 0 (far post) → 1 (near keeper),
central ~0.55 is best; `reach < 0` = uncontested.

---

## 8. AI

**Live (engine):** AI level 0–3 scales shot decision speed (§1) and defensive
tightness; both users' teams run the same AI controller; auto-switch applies to
humans. Corners/goal kicks/throw-ins are played by built-in AI takers.

**Reference (preset-driven, for the engine source build):**

| Parameter | Meaning |
|---|---|
| `aiDefendAggression` | share of possession the AI spends pressing vs holding shape (arcade 0.38 → authentic 0.50) |
| `aiAssist` | how much the AI cooperates with the human (lures, walls, through-ball timing) |
| `aiJockeyRatio` | share of close-downs the AI does with jockey instead of all-out sprints (arcade 0.25 → authentic 0.60) — less AI auto-tackle in arcade, so the human's tackles matter more |

**AI assistance setting** shifts the match AI level (±1, clamped 0–2) — §5.

Target behaviour the tuning table encodes: *Authentic* AI presses harder,
jockeys more, and commits to tackles; *Arcade* AI parks deeper and leaves space
for the human to run through.

---

## 9. Set pieces

**Live (engine):** the state machine models `Kickoff / Corner / GoalKick /
ThrowIn` (+ `HalfEnded / EndMatch`). The ball is placed at the correct spot,
camera frames the action, and the AI takes the delivery. The UI shows a
**phase chip** ("Corner kick" / "Goal kick" / …) while the state is active
(`MatchEvents` polls `pitch.states.name`).

**Target contract (two-stage, FC-style):**

```js
SETPIECE_DELIVERIES = {
  corner:   ["nearPost", "farPost", "short", "cutBack"],
  freeKick: ["driven", "bentNear", "bentFar", "lowThrough"],
  penalty:  ["left", "centre", "right", "topLeft", "topRight"],
}
```

Stage 1 — choose the taker's delivery kind (button/hold). Stage 2 — pick the
target (aim ring). Resolution: `headerOutcome` for the receiver, `shotOutcome`
for the taker (free kicks), `shotOutcome(type=power)` for penalties vs the GK
(`keeperReaction`). Requires the engine's set-piece state machine extension —
roadmap §13 (free kicks and penalties are not modelled by the engine yet).

---

## 10. Goalkeeper

**Live (engine):** full GK state set (tend goal, catch, dive, goal kick,
corner defend…). In **play mode** the engine applies a human-friendly nerf so
the keeper stays beatable:

| Stat | Play-mode scale |
|---|---|
| catchSpeed | ×0.50 |
| maxForce | ×0.65 |
| sprintSpeed | ×0.78 |
| runSpeed | ×0.80 |
| interceptRange | ×0.60 |

**Reference:** `keeperReaction` (arcade 0.92 / authentic 1.04) scales AI keeper
dive/save probability in the `headerOutcome`/penalty resolutions — needs the
engine source to apply to real keeper saves.

**Sheet:** GK row is absolute (§6) — slow feet, strong hands: e.g. England GK
PAC 66 · SHO 42 · PAS 72 · DRI 58 · DEF 86 · PHY 73 · HEA 83, weakFoot 4★,
skill 1✦.

---

## 11. Physicality

**Live (engine):** physical ball contest via the player force model
(`maxForce`/`acceleration`, preset-scaled); slide tackles (S) are the only
tackle type; the stats panel counts slides.

**Reference (preset + resolver):** `physicality` scales duels (§7.4);
`tackleCooldown` (0.9 s arcade / 1.4 s authentic) is the slide-tackle lockout
after a miss; `staminaDrain` gates sprint availability in a future stamina
model. Jockey (walk) is the controlled, low-risk close-down (§3, §7.3).

---

## 12. UI feedback

| Feature | Status |
|---|---|
| **PlayerInfo chip** (in match, play mode) — role, weak-foot ★, skill ✦, two key stats of the controlled player; follows auto-switch | **Live** (`app/match/PlayerInfo.jsx`, polls `users.list[0].player`) |
| **Phase chip** — Kick-off / Corner kick / Goal kick / Throw-in banner during set pieces | **Live** (`MatchEvents`, polls `pitch.states.name`) |
| **Pass aim line** — the engine draws the user's trajectory line in play mode | Live (engine `stadium.trajectory`) |
| **Slow-mo aiming** — hold shoot > 0.12 s → 0.4× time | Live (engine) |
| **Scoreboard + stats** — score, clock, possession bar, expandable full stats | Live |
| **Landing team cards** — OVR badge, top stat, skill stars (hover = full sheet) | **Live** |
| **Controls legend** — in-match card with the real keymap + sprint-modifier note | **Live** (fixed: the old text listed unbound keys) |
| Name bars with stars in the engine view | Roadmap (engine renders names, not stat bars) |
| Shot-quality hint / aim indicator toggle | Roadmap (`settings.aimGuide` field retained for a future engine hook) |

---

## 13. Engine-side roadmap (needs the match engine source)

Ordered by value:

1. **Shot types** — wire `SHOT_TYPES` (finesse/chip/power) to the shoot button
   (hold-modifier or long-press menu), resolved by `shotOutcome`.
2. **Two-stage set pieces** — manual corner/free-kick/penalty taking with
   `SETPIECE_DELIVERIES` + aim ring; free kicks & a PK shootout state machine.
3. **Per-player attributes in the AI** — feed the §6 sheet into the AI's
   decision speed/press radii instead of one accuracy value per player.
4. **Cards & referee** — foul accumulation, yellow/red, suspensions;
   `tackleOutcome.card` is already the contract.
5. **Jockey as a first-class controller action** for the touch contract (today
   we scale stick velocity, which is equivalent but host-applied).
6. **Stamina model** — `staminaDrain` per preset.
7. **Aim indicator toggle** — honour the `settings.aimGuide` field
   (trajectory-line on/off + shot-quality hint).
8. **GK save model** — `keeperReaction` on real dives.

---

## Appendix — file map

| File | Role |
|---|---|
| `app/game/gameplay.js` | Presets, storage, all resolution algorithms, assist-mode + AI-level mapping |
| `app/game/userAssist.js` | Applies `user.passing` to the live engine users at match time |
| `app/data/players.js` | Attribute sheet (team × role), stars, OVR mapping, role key helpers |
| `app/match/PlayerInfo.jsx` | In-match controlled-player chip |
| `app/match/MatchEvents.jsx` | Goal/half-time cards + set-piece phase chip |
| `app/match/TouchControls.jsx` | Mobile controls incl. jockey |
| `app/pad/PadController.jsx` · `app/match/LanHostBridge.jsx` | LAN pad + host-side input fold (jockey scaled by host preset) |
| `app/settings/page.jsx` · `settings.css` | Preset cards, passing/AI settings, PC + touch + pad control reference |
| `app/Landing.jsx` | Team cards (OVR/stats/stars), AI-assist-adjusted match launch |
| `public/match-runtime-min/standalone-match.js` | Engine seam: `__acGameplay.config` application, play loop, touch contract |
