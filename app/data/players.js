// ============================================================================
// Animal Cup — player attribute model (FC-style compact stat set)
// ============================================================================
// The match engine (public/match-runtime-min) instantiates each side as
// 1 GK + 6 outfield players and gives every outfield player of a team the
// SAME role archetype (see standalone-match.js createGame(): makePlayer(role)
// with a constant accuracy). There are no per-squad-player stats in the
// engine data (team.json carries only race/role/number), so this module is
// the authoritative attribute sheet, keyed by (team, role) — which is exactly
// the resolution the engine can represent.
//
// Where this data is used (all React-side, no engine changes needed):
//   - Landing team cards        → OVR + key stats + weak-foot/skill stars
//   - In-match player info chip → controlled player's role attributes
//   - settings / squad screens  → full attribute breakdown
//   - docs/gameplay-rules.md    → the tuning reference
//
// Attribute ranges are 55–92 (the engine's own internal stat range is
// ~0–100; we stay inside it so future engine hooks can consume the values
// 1:1). weakFoot / skillMoves are FC-style 1–5 stars.
// ============================================================================

// Team overall, derived from the engine's own team rating (team.json "rating",
// e.g. GER 2044) mapped into a 60–90 display band: ovr = round((rating-1500)/55)
//   GER 2044→84 · ESP 1984→83 · BRA 2010→82 · ARG 2005→81
//   ENG 1934→79 · FRA 1931→78 · POR 1895→74 · USA 1741→68
export const TEAM_OVR = {
  england: 79, france: 78, germany: 84, spain: 83,
  portugal: 74, brazil: 82, argentina: 81, usa: 68,
};

// Style deltas per nation (FC-flavoured, matches the animal identity):
// pace, shooting, passing, dribbling, defending, physical, heading
const STYLE = {
  england:   { pace: 78, shooting: 79, passing: 78, dribbling: 77, defending: 82, physical: 84, heading: 80, weakFoot: 3, skillMoves: 3 },
  france:    { pace: 80, shooting: 76, passing: 78, dribbling: 79, defending: 83, physical: 80, heading: 78, weakFoot: 3, skillMoves: 4 },
  germany:   { pace: 79, shooting: 80, passing: 86, dribbling: 80, defending: 85, physical: 82, heading: 82, weakFoot: 4, skillMoves: 3 },
  spain:     { pace: 77, shooting: 80, passing: 87, dribbling: 82, defending: 79, physical: 76, heading: 77, weakFoot: 3, skillMoves: 4 },
  portugal:  { pace: 81, shooting: 78, passing: 81, dribbling: 84, defending: 76, physical: 75, heading: 75, weakFoot: 2, skillMoves: 5 },
  brazil:    { pace: 84, shooting: 80, passing: 83, dribbling: 88, defending: 76, physical: 75, heading: 74, weakFoot: 3, skillMoves: 5 },
  argentina: { pace: 83, shooting: 84, passing: 84, dribbling: 88, defending: 78, physical: 76, heading: 77, weakFoot: 3, skillMoves: 5 },
  usa:       { pace: 82, shooting: 72, passing: 74, dribbling: 76, defending: 74, physical: 80, heading: 78, weakFoot: 3, skillMoves: 3 },
};

// Role offsets applied to the team style (GK defined absolutely).
const ROLE_OFFSET = {
  gk: null, // absolute below
  d: { pace: -2, shooting: -12, passing: -4, dribbling: -6, defending: 4, physical: 2, heading: 1 },
  m: { pace: -1, shooting: -4, passing: 2, dribbling: -2, defending: -2, physical: 0, heading: 0 },
  a: { pace: 2, shooting: 4, passing: 0, dribbling: 3, defending: -10, physical: -2, heading: -1 },
};

// Goalkeeper profile (absolute). Note: in human-play mode the engine also
// applies a GK nerf to keep a human keeper beatable (catch .5x, force .65x,
// sprint .78x, run .8x, intercept .6x — standalone-match.js play phase).
const GK_BASE = { pace: 66, shooting: 42, passing: 72, dribbling: 58, defending: 86, physical: 72, heading: 82 };

const clamp = (v) => Math.max(55, Math.min(92, Math.round(v)));
const stars = (v) => Math.max(1, Math.min(5, Math.round(v)));

function roleProfile(teamId, role) {
  const st = STYLE[teamId] || STYLE.england;
  if (role === "gk") {
    return {
      pace: clamp(GK_BASE.pace + (st.pace - 78) / 3),
      shooting: GK_BASE.shooting,
      passing: clamp(GK_BASE.passing + (st.passing - 80) / 4),
      dribbling: GK_BASE.dribbling,
      defending: GK_BASE.defending,
      physical: clamp(GK_BASE.physical + (st.physical - 80) / 3),
      heading: clamp(GK_BASE.heading + (st.heading - 78) / 3),
      weakFoot: 4, // keepers are trained on both feet
      skillMoves: 1,
    };
  }
  const off = ROLE_OFFSET[role] || ROLE_OFFSET.m;
  return {
    pace: clamp(st.pace + off.pace),
    shooting: clamp(st.shooting + off.shooting),
    passing: clamp(st.passing + off.passing),
    dribbling: clamp(st.dribbling + off.dribbling),
    defending: clamp(st.defending + off.defending),
    physical: clamp(st.physical + off.physical),
    heading: clamp(st.heading + off.heading),
    weakFoot: role === "a" ? stars(st.weakFoot - 0.5) : st.weakFoot,
    skillMoves: role === "d" ? stars(st.skillMoves - 0.75) : st.skillMoves,
  };
}

// Public API ---------------------------------------------------------------

// Engine role constants → our keys (standalone-match.js:
// ROLE = {D: ROLE_DEFENDER, M: ROLE_MIDFIELDER, A: ROLE_ATTACKER}, GK = "G").
export function engineRoleKey(role) {
  const r = String(role || "").toLowerCase();
  if (r === "g" || r === "go" || r.includes("goal")) return "gk";
  if (r.includes("def")) return "d";
  if (r.includes("attack")) return "a";
  return "m";
}

// Accepts "gk" | "d" | "m" | "a" or the engine's role strings ("G",
// "defender", "midfielder", "attacker").
export function attrForRole(teamId, role) {
  return roleProfile(teamId, engineRoleKey(role));
}

// The two stats that read best on a name bar, by role (FC-style: show the
// player's identity, not a generic pair).
export function keyStatsForRole(role) {
  switch (engineRoleKey(role)) {
    case "gk": return ["defending", "heading"];
    case "d": return ["defending", "pace"];
    case "a": return ["shooting", "pace"];
    default: return ["passing", "dribbling"];
  }
}

// Short labels for the stat bars (kept universal, like FC: PAC/SHO/…).
export const STAT_LABELS = {
  pace: "PAC", shooting: "SHO", passing: "PAS", dribbling: "DRI",
  defending: "DEF", physical: "PHY", heading: "HEA",
};

// Team-level headline (landing cards): OVR + top three team style stats.
export function teamHeadline(teamId) {
  const st = STYLE[teamId] || STYLE.england;
  return {
    ovr: TEAM_OVR[teamId] || 75,
    weakFoot: st.weakFoot,
    skillMoves: st.skillMoves,
    best: [["pace", st.pace], ["shooting", st.shooting], ["passing", st.passing],
           ["dribbling", st.dribbling], ["defending", st.defending],
           ["physical", st.physical], ["heading", st.heading]]
      .sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}
