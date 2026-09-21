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
import { useLocale } from "../i18n/LocaleProvider";
import { attrForRole, engineRoleKey, keyStatsForRole, STAT_LABELS } from "../data/players.js";

const ROLE_ABBR = { gk: "GK", d: "DEF", m: "MID", a: "ATT" };

export default function PlayerInfo({ teamId, enabled }) {
  const { t } = useLocale();
  const [info,setInfo]=useState(null),[stamina,setStamina]=useState(1),[goals,setGoals]=useState(0);
  const infoRef = { current: info };

  useEffect(() => {
    if (!enabled) { setInfo(null); return; }
    setGoals(0);
    let currentId = null;
    const onGoal = (e) => {
      const d = (e && e.detail) || {};
      const scorer = d.scorerPlayer || d.scorer || d.player || null;
      const scorerNumber = d.scorerNumber ?? d.playerNumber ?? scorer?.number;
      const scorerTeam = d.scorerTeam || d.team || scorer?.team || scorer?.race;
      if (!currentId) return;
      const sameTeam = scorerTeam == null || String(scorerTeam).toLowerCase() === String(teamId).toLowerCase();
      const samePlayer = (scorerNumber != null && infoRef.current?.number != null && Number(scorerNumber) === Number(infoRef.current.number))
        || (scorer?.id != null && String(scorer.id) === String(currentId))
        || (scorer?.name && infoRef.current?.name && String(scorer.name) === String(infoRef.current.name));
      if (sameTeam && samePlayer) setGoals(g => g + 1);
    };
    const tick = () => {
      try {
        const req = typeof window !== "undefined" ? window.require : undefined;
        if (!req) return;
        const users = (req("users") || {}).list || [];
        const u = users[0];
        const p = u && u.player;
        if (!p) return;
        const key = engineRoleKey(p.role);
        currentId = p.id ?? p.uid ?? p.number ?? p.role;
        const displayName = p.name || p.playerName || u.name || `${teamId.toUpperCase()} #${p.number ?? "?"}`;
        const number = p.number ?? p.jerseyNumber ?? null;
        const attrs = attrForRole(teamId, key);
        const engineGoals = Number.isFinite(Number(p.goals)) ? Number(p.goals) : null;
        if (engineGoals != null) setGoals(engineGoals);
        setInfo(prev => (prev && prev.key === key && prev.name === displayName && prev.number === number) ? prev : {
          key,
          name: displayName,
          number,
          abbr: ROLE_ABBR[key],
          weakFoot: attrs.weakFoot,
          skillMoves: attrs.skillMoves,
          stats: keyStatsForRole(key).map(k => [STAT_LABELS[k], attrs[k]]),
        });
      } catch { /* seam guard */ }
      try { setStamina(Number.isFinite(window.__acStamina)?window.__acStamina:1); } catch {}
    };
    tick();
    window.addEventListener("ab-goal", onGoal);
    const iv = setInterval(tick, 180);
    return () => { clearInterval(iv); window.removeEventListener("ab-goal", onGoal); setInfo(null); };
  }, [enabled, teamId]);

  infoRef.current = info;
  if (!enabled || !info) return null;
  return (
    <div className="player-info" role="status" aria-live="off">
      <img className="pi-flag" src={`/match-runtime-min/data/teams/${teamId}/flag.png`} alt=""
           onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <span className="pi-name">{info.name}{info.number != null ? ` #${info.number}` : ""}</span>
      <span className="pi-role">{info.abbr}</span>
      <span className="pi-stars" title="Skill moves / weak foot">
        <span className="pi-sm">{"★".repeat(info.skillMoves)}{"☆".repeat(5 - info.skillMoves)}</span>
        <span className="pi-wf">{"★".repeat(info.weakFoot)}{"☆".repeat(5 - info.weakFoot)}</span>
      </span>
      <span className="pi-goals"><b>{goals}</b>G</span>
      {info.stats.map(([label, val]) => (
        <span className="pi-stat" key={label}><b>{val}</b>{label}</span>
      ))}
    <span className="pi-trait">{t(`team.${teamId}.trait`)}</span><span className="pi-stamina" title={t("match.stamina")}><i style={{width:`${Math.round(stamina*100)}%`}}/><b>{Math.round(stamina*100)}</b></span>
    </div>
  );
}
