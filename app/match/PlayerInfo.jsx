"use client";
// ============================================================================
// PlayerInfo — FC-style controlled-player chip, shown in human-play modes.
//
// The engine exposes users.list[0].player (the player you currently control;
// it changes with auto-switch). Every outfield player of a team shares the
// team's role archetype in the engine (standalone-match.js createGame), so
// the stats shown are exactly the attributes that player has:
// role + weak-foot stars + skill-move stars + the role's two key stats,
// pulled from app/data/players.js (the attribute sheet).
//
// Polling only (350ms) — the seam has no player-switch event. Cheap reads,
// full-seam guards, renders nothing until a player exists or in team modes.
// ============================================================================
import { useEffect, useState } from "react";
import { attrForRole, engineRoleKey, keyStatsForRole, STAT_LABELS } from "../data/players.js";

const ROLE_ABBR = { gk: "GK", d: "DEF", m: "MID", a: "ATT" };

export default function PlayerInfo({ teamId, enabled }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!enabled) { setInfo(null); return; }
    const tick = () => {
      try {
        const req = typeof window !== "undefined" ? window.require : undefined;
        if (!req) return;
        const users = (req("users") || {}).list || [];
        const u = users[0];
        const p = u && u.player;
        if (!p) return;
        const key = engineRoleKey(p.role);
        const attrs = attrForRole(teamId, key);
        setInfo(prev => (prev && prev.key === key) ? prev : {
          key,
          abbr: ROLE_ABBR[key],
          weakFoot: attrs.weakFoot,
          skillMoves: attrs.skillMoves,
          stats: keyStatsForRole(key).map(k => [STAT_LABELS[k], attrs[k]]),
        });
      } catch { /* seam guard */ }
    };
    tick();
    const iv = setInterval(tick, 350);
    return () => { clearInterval(iv); setInfo(null); };
  }, [enabled, teamId]);

  if (!enabled || !info) return null;
  return (
    <div className="player-info" role="status" aria-live="off">
      <img className="pi-flag" src={`/match-runtime-min/data/teams/${teamId}/flag.png`} alt=""
           onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <span className="pi-role">{info.abbr}</span>
      <span className="pi-stars" title="Weak foot / skill moves">
        <span className="pi-wf">{"★".repeat(info.weakFoot)}{"☆".repeat(5 - info.weakFoot)}</span>
        <span className="pi-sm">{"✦".repeat(info.skillMoves)}{"✧".repeat(5 - info.skillMoves)}</span>
      </span>
      {info.stats.map(([label, val]) => (
        <span className="pi-stat" key={label}><b>{val}</b>{label}</span>
      ))}
    </div>
  );
}
