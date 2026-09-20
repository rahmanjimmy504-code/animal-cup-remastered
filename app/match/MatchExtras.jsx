"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { captureMatch } from "./captureMatch";
import { PLAYABLE_TEAMS } from "../data/teams";

const OPTIONS_KEY = "animalCupMatchOptions";
const TACTICS = ["balanced", "attacking", "defensive", "counter"];
const PERFORMANCE = ["auto", "quality", "performance"];

// Defaults MUST match MatchChrome's — used as the server-prerender snapshot.
// currentMatch() reads window.location and therefore can only run in the
// browser: calling it from useMemo during render broke `next build`
// prerendering of /match with "ReferenceError: window is not defined" (CI
// 2026-09-20). So teams starts at the defaults and is filled in after
// hydration, exactly like MatchChrome does.
const DEFAULT_TEAMS = { red: "england", blue: "france" };

function currentMatch() {
  const q = new URLSearchParams(window.location.search);
  return { red: q.get("red") || DEFAULT_TEAMS.red, blue: q.get("blue") || DEFAULT_TEAMS.blue };
}

export default function MatchExtras() {
  const { t } = useLocale();
  const [panel, setPanel] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [options, setOptions] = useState({ tactic: "balanced", performance: "auto", touchScale: 1, sensitivity: 1 });
  const [teams, setTeams] = useState(DEFAULT_TEAMS);

  // Client-only: read ?red=&blue= from the URL (never during prerender).
  useEffect(() => { setTeams(currentMatch()); }, []);

  useEffect(() => {
    try { setOptions((old) => ({ ...old, ...JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}") })); } catch {}
    const onGoal = (event) => {
      const d = event?.detail || {};
      const pitch = window.__matchGame?.pitch;
      const score = d.score || [pitch?.redTeam?.score || 0, pitch?.blueTeam?.score || 0];
      const scorer = score[0] > (d.previousScore?.[0] || 0) ? d.red : d.blue;
      setHighlights((old) => [{ id: Date.now(), minute: Math.floor((pitch?.matchTime || 0) / 60), score, team: scorer || teams.red }, ...old].slice(0, 8));
    };
    window.addEventListener("ab-goal", onGoal);
    return () => window.removeEventListener("ab-goal", onGoal);
  }, [teams]);

  useEffect(() => {
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch {}
    document.body.dataset.performance = options.performance;
    document.body.style.setProperty("--ac-touch-scale", String(options.touchScale));
    window.__acMatchOptions = options;
    window.__acTactics = options.tactic;
    window.dispatchEvent(new CustomEvent("ac-match-options", { detail: options }));
  }, [options]);

  const traitKey = (id) => `team.${id}.trait`;
  const teamInfo = (id) => PLAYABLE_TEAMS.find((team) => team.id === id);
  const saveHighlight = async (highlight) => { await captureMatch(teams); setHighlights((old) => old.map((item) => item.id === highlight.id ? { ...item, saved: true } : item)); };
  const change = (key, value) => setOptions((old) => ({ ...old, [key]: value }));

  return <>
    <div className="match-extras__traits" aria-label={t("match.traits")}>
      <span>{teamInfo(teams.red)?.icon || "🐾"} {t(traitKey(teams.red))}</span>
      <span>{teamInfo(teams.blue)?.icon || "🐾"} {t(traitKey(teams.blue))}</span>
    </div>
    <div className="match-extras__buttons">
      <button type="button" className="glass-btn" onClick={() => setPanel(panel === "highlights" ? null : "highlights")} aria-label={t("match.highlights")}>★</button>
      <button type="button" className="glass-btn" onClick={() => setPanel(panel === "tactics" ? null : "tactics")} aria-label={t("match.tactics")}>⚽</button>
      <button type="button" className="glass-btn" onClick={() => setPanel(panel === "performance" ? null : "performance")} aria-label={t("match.performance")}>▣</button>
    </div>
    {panel === "highlights" ? <section className="match-extras__panel match-extras__panel--highlights">
      <b>{t("match.highlights")}</b>
      {highlights.length ? highlights.map((item) => <div className="match-highlight" key={item.id}><span>⚽ {item.minute}&apos; · {t(`team.${item.team}.name`)} {item.score[0]}–{item.score[1]}</span><button type="button" onClick={() => saveHighlight(item)} disabled={item.saved}>{item.saved ? "✓" : "Save"}</button></div>) : <small>{t("match.noHighlights")}</small>}
    </section> : null}
    {panel === "tactics" ? <section className="match-extras__panel"><b>{t("match.tactics")}</b><div className="match-choice-grid">{TACTICS.map((id) => <button key={id} type="button" className={options.tactic === id ? "is-selected" : ""} onClick={() => change("tactic", id)}>{t(`match.tactic.${id}`)}</button>)}</div><small>{t("match.tacticsHint")}</small></section> : null}
    {panel === "performance" ? <section className="match-extras__panel"><b>{t("match.performance")}</b><div className="match-choice-grid">{PERFORMANCE.map((id) => <button key={id} type="button" className={options.performance === id ? "is-selected" : ""} onClick={() => change("performance", id)}>{t(`match.performance.${id}`)}</button>)}</div><label>{t("match.touchSize")} <input type="range" min=".8" max="1.3" step=".05" value={options.touchScale} onChange={(e) => change("touchScale", Number(e.target.value))} /></label><label>{t("match.touchSensitivity")} <input type="range" min=".6" max="1.5" step=".05" value={options.sensitivity} onChange={(e) => change("sensitivity", Number(e.target.value))} /></label></section> : null}
  </>;
}
