"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

export default function MatchTimeline() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teams = { red: params.get("red") || "england", blue: params.get("blue") || "france" };
    let last = [0, 0], half = false, phase = null, started = false;
    const add = (item) => setItems((old) => [...old, { ...item, id: `${Date.now()}-${Math.random()}` }].slice(-12));
    const timer = setInterval(() => {
      const pitch = window.__matchGame && window.__matchGame.pitch;
      if (!pitch || !pitch.redTeam || !pitch.blueTeam) return;
      const score = [pitch.redTeam.score | 0, pitch.blueTeam.score | 0];
      if (!started) { last = score; started = true; }
      else if (score[0] !== last[0] || score[1] !== last[1]) {
        const team = score[0] > last[0] ? teams.red : teams.blue;
        add({ type: "goal", icon: "⚽", text: `${t(`team.${team}.name`)} ${score[0]}–${score[1]}` });
        last = score;
      }
      if (!half && pitch.secondHalf) { half = true; add({ type: "half", icon: "⏱", text: t("event.halftime") }); }
      const nextPhase = pitch.states && pitch.states.name;
      if (nextPhase && nextPhase !== phase && nextPhase !== "InPlay") {
        phase = nextPhase;
        const key = { Kickoff: "match.phase.kickoff", Corner: "match.phase.corner", GoalKick: "match.phase.goalkick", ThrowIn: "match.phase.throwin" }[nextPhase];
        if (key) add({ type: "phase", icon: "↻", text: t(key) });
      } else if (!nextPhase) phase = null;
    }, 400);
    return () => clearInterval(timer);
  }, [t]);
  return <aside className="match-timeline" aria-live="polite"><b>{t("match.timeline")}</b>{items.length ? items.slice().reverse().map((item) => <div key={item.id}><span>{item.icon}</span>{item.text}</div>) : <small>{t("match.timelineEmpty")}</small>}</aside>;
}
