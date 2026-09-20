// ============================================================================
// Animal Cup — FC 26/27-style gameplay rules layer
// ============================================================================
// This module is the single source of truth for the two gameplay presets
// (Arcade / Authentic) and for the reference resolution algorithms that the
// rules document (docs/gameplay-rules.md) specifies.
//
// SCOPE NOTES (important — read before wiring anything):
// The match engine lives in public/match-runtime-min (bundled, closed). From
// the React side it accepts exactly two preset knobs, which it reads through
// window.__acGameplay.config in setupMatch (standalone-match.js):
//   - playerSpeedMultiplier   → scales every player's run speed
//   - accelerationMultiplier  → scales force/acceleration
// Every other preset field below is a *reference* parameter: it is persisted
// with the preset, documented in the rules doc, and consumed by the
// resolution functions in this file — the deterministic reference
// implementations that a future engine build (with source access) or a
// server-side referee can call. Nothing here is silently no-op in the UI.
//
// What React CAN drive at match time (beyond the two multipliers):
//   - user.passing (0–3) assisted/manual pass+lob mode — see useUserAssist()
//   - the AI level 0–3 (match URL "ai" param)
//   - touch/LAN input (vx/vy/shoot/sprint/pass/lob/switchPlayer/tackle)
// ============================================================================

const KEY = "animalCupRemastered.gameplay.v1";

// ---------------------------------------------------------------------------
// Presets. Fields the engine applies are marked (engine); the rest are
// reference parameters for the resolution functions / future engine.
// ---------------------------------------------------------------------------
export const PRESETS = {
  arcade: {
    preset: "arcade",
    // (engine)
    playerSpeedMultiplier: 1.14,
    accelerationMultiplier: 1.16,
    // (reference)
    passSpeedMultiplier: 1.12,
    passAccuracyBase: 0.92,          // assisted ground pass base
    shotAccuracyBase: 0.90,          // normal shot base
    shotSpeedMultiplier: 1.08,
    dribbleControl: 1.12,            // ball-tightness feel
    skillMoveMultiplier: 1.10,       // accuracy bonus for skill-rated players
    weakFootPenalty: 0.25,           // how much the weak foot hurts (0=none)
    aiDefendAggression: 0.38,        // how often AI defends vs holds
    aiAssist: 0.20,                  // how much AI helps the human
    aiJockeyRatio: 0.25,             // share of AI possession used for jockey
    foulFrequency: 0.28,
    physicality: 0.90,               // scale on physical duels
    keeperReaction: 0.92,
    offsideTolerance: 0.22,
    staminaDrain: 0.90,
    jockeySpeed: 0.60,               // touch jockey button velocity scale
    tackleCooldown: 0.9,             // s before another slide tackle (ref)
  },
  authentic: {
    preset: "authentic",
    // (engine)
    playerSpeedMultiplier: 1.0,
    accelerationMultiplier: 0.94,
    // (reference)
    passSpeedMultiplier: 0.96,
    passAccuracyBase: 0.78,
    shotAccuracyBase: 0.78,
    shotSpeedMultiplier: 0.98,
    dribbleControl: 0.94,
    skillMoveMultiplier: 0.96,
    weakFootPenalty: 0.55,
    aiDefendAggression: 0.50,
    aiAssist: 0.55,
    aiJockeyRatio: 0.60,
    foulFrequency: 0.45,
    physicality: 1.08,
    keeperReaction: 1.04,
    offsideTolerance: 0.08,
    staminaDrain: 1.08,
    jockeySpeed: 0.55,
    tackleCooldown: 1.4,
  },
};

// ---------------------------------------------------------------------------
// Settings storage (preset + per-toggle overrides). Backward compatible with
// v1 saves.
// ---------------------------------------------------------------------------
const defaults = { preset: "arcade", assistedPassing: true, assistedShooting: true, aiAssist: "medium", aimGuide: false };

export function readGameplay() {
  if (typeof window === "undefined") return { ...defaults };
  try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || "null") || {}) }; }
  catch { return { ...defaults }; }
}

export function saveGameplay(v) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(v));
  return v;
}

export function getGameplayConfig() {
  const s = readGameplay();
  return PRESETS[s.preset] || PRESETS.arcade;
}

// ---------------------------------------------------------------------------
// Resolution algorithms (reference implementations — deterministic, no RNG;
// the engine/future referee supplies `roll` in [0,1)).
// All stats are the 55–92 scale from app/data/players.js.
// ---------------------------------------------------------------------------

// A pass: base accuracy by preset, skill from passing, pressure and distance
// work against it; through balls trade a little accuracy for speed.
export function passOutcome({ passing = 70, pressure = 0.2, distance = 1, through = false, lofted = false } = {}, c = getGameplayConfig()) {
  const risk = pressure * 0.45 + Math.min(1, distance / 30) * 0.2 + (lofted ? 0.16 : 0);
  return {
    accuracy: Math.max(0.2, Math.min(0.99, c.passAccuracyBase + (passing - 70) / 500 - risk + (through ? 0.02 : 0))),
    speed: c.passSpeedMultiplier * (through ? 1.06 : lofted ? 0.92 : 1),
    curve: through ? Math.max(0, (passing - 55) / 100) : 0,
  };
}

// A shot. `type` ∈ normal | finesse | chip | power (see SHOT_TYPES).
// Weak-foot penalty: shots with the non-dominant foot lose accuracy in
// proportion to (5 - weakFoot) stars, scaled by the preset penalty.
// Skill move bonus: shooting right after a skill move grants a small,
// skill-rated accuracy bump (preset-scaled) — FC-style "trick unlocks shot".
export function shotOutcome({ shooting = 70, weakFoot = 3, skillMoves = 3, pressure = 0.2, distance = 1, type = "normal", offWeakFoot = false, afterSkillMove = false } = {}, c = getGameplayConfig()) {
  const t = SHOT_TYPES.includes(type) ? type : "normal";
  let penalty = pressure * 0.42 + Math.min(1, distance / 35) * 0.16;
  if (t === "power") penalty += 0.12;
  let accuracy = c.shotAccuracyBase + (shooting - 70) / 450 - penalty;
  if (t === "finesse") accuracy -= 0.025;
  if (t === "chip") accuracy -= 0.04;
  if (offWeakFoot) accuracy -= (5 - weakFoot) * 0.045 * c.weakFootPenalty * 2;
  if (afterSkillMove) accuracy += (skillMoves - 1) * 0.012 * c.skillMoveMultiplier;
  return {
    accuracy: Math.max(0.16, Math.min(0.98, accuracy)),
    speed: c.shotSpeedMultiplier * (t === "power" ? 1.22 : t === "finesse" ? 0.94 : t === "chip" ? 0.78 : 1),
    curve: t === "finesse" ? Math.max(0.12, shooting / 100) : 0,
    type: t,
  };
}

// A tackle. `timing` 0–1: 0 = too early, 1 = perfect, 0 < 0.25 = too late
// window (high foul risk). Jockey (walk) before the tackle narrows the risk:
// a player who arrives jockeying gets +15% success and -40% foul odds.
export function tackleOutcome({ defending = 70, physical = 70, attackerPhysical = 70, position = 0.5, timing = 0.5, fromBehind = false, jockeyed = false } = {}, c = getGameplayConfig()) {
  const jockeyBonus = jockeyed ? 0.15 : 0;
  const foulDamp = jockeyed ? 0.4 : 1;
  const base = 0.42 + (defending - 70) / 260 + (physical - attackerPhysical) / 500 + (position - 0.5) * 0.28 + (timing - 0.5) * 0.3 + jockeyBonus;
  const foul = ((fromBehind ? 0.18 : 0) + (timing < 0.25 ? 0.12 : 0) + c.foulFrequency * 0.1) * foulDamp;
  return {
    success: Math.max(0.08, Math.min(0.92, base)),
    foul: Math.max(0.02, Math.min(0.55, foul)),
    card: foul > 0.42 ? "red" : foul > 0.24 ? "yellow" : null,
  };
}

// Physical duel (running shoulder bump / press check).
export function physicalOutcome(a = {}, b = {}, c = getGameplayConfig()) {
  const ap = (a.physical || 70) * c.physicality + (a.pace || 70) * 0.12;
  const bp = (b.physical || 70) * c.physicality + (b.pace || 70) * 0.12;
  return { winner: ap >= bp ? "a" : "b", margin: Math.abs(ap - bp) };
}

// Header (corner / near-post free kick). `timing` = jump vs flight;
// `position` = 0 at the back post … 1 near the keeper (central is best);
// `reach` = physical+pace composite vs the marker's reach.
export function headerOutcome({ heading = 70, physical = 70, pace = 70, timing = 0.5, position = 0.5, reach = 0 } = {}, c = getGameplayConfig()) {
  const contest = reach >= 0 ? 1 : 0; // 1 when contested
  const base = 0.5 + (heading - 70) / 300 + (timing - 0.5) * 0.34 + (0.5 - Math.abs(position - 0.55)) * 0.2 - (contest ? 0.12 : 0);
  const power = (physical * 0.6 + pace * 0.4) / 100;
  return {
    win: Math.max(0.12, Math.min(0.95, base)),
    shotQuality: Math.max(0.2, Math.min(0.95, (heading - 60) / 40) * (0.8 + power * 0.3)),
  };
}

// Two-stage set pieces (design contract; the engine currently plays corners
// and free kicks with built-in AI — see roadmap in docs/gameplay-rules.md).
// Stage 1: choose the delivery. Stage 2: pick a delivery target.
export const SETPIECE_DELIVERIES = {
  corner: ["nearPost", "farPost", "short", "cutBack"],
  freeKick: ["driven", "bentNear", "bentFar", "lowThrough"],
  penalty: ["left", "centre", "right", "topLeft", "topRight"],
};

// ---------------------------------------------------------------------------
// Assist model — the one assist knob the engine DOES honour at match time.
// user.passing (0–3), set on the live User objects (see useUserAssist):
//   0 assisted always · 1 assisted, hold sprint = manual
//   2 manual, hold sprint = assisted · 3 manual always
// Lob passes use the same mode. The settings toggle maps to 1 (assisted
// default) or 2 (manual default) so sprint always gives the *other* mode.
// ---------------------------------------------------------------------------
export function passingModeFor(settings) {
  return settings.assistedPassing === false ? 2 : 1;
}

// AI assist preference (settings) applied on top of the chosen match
// difficulty (0–2) when a match is launched from the landing screen.
export function effectiveAiLevel(difficulty, aiAssist) {
  const adj = aiAssist === "high" ? 1 : aiAssist === "low" ? -1 : 0;
  return Math.max(0, Math.min(2, difficulty + adj));
}

// ---------------------------------------------------------------------------
// Enumerations (re-exported for the UI + rules doc)
// ---------------------------------------------------------------------------
export const RULE_STATES = ["kickoff", "inPlay", "cornerStage1", "cornerStage2", "freeKickAim", "penaltyAim", "goalKick", "throwIn", "halfTime", "fullTime"];
export const SHOT_TYPES = ["normal", "finesse", "chip", "power"];
export const PASS_TYPES = ["ground", "through", "lofted", "cross"];
