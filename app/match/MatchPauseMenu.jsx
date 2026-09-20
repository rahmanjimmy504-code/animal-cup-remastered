"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

export default function MatchPauseMenu() {
  const { t } = useLocale();
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  function applyPause(next) {
    setPaused(next);
    window.__acPaused = next;
    window.dispatchEvent(new CustomEvent("ac-match-pause", { detail: { paused: next } }));
    const game = window.__matchGame;
    if (game) {
      const fn = next ? (game.pause || game.stop || game.setPaused) : (game.resume || game.start || game.setPaused);
      if (typeof fn === "function") { try { fn.call(game, next); } catch {} }
    }
  }

  function applySpeed(next) {
    setSpeed(next);
    window.__acMatchSpeed = next;
    window.dispatchEvent(new CustomEvent("ac-match-speed", { detail: { speed: next } }));
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") applyPause(!window.__acPaused); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <>
    <button type="button" className="match-pause-button glass-btn" aria-label={t("match.pause")} onClick={() => applyPause(!paused)}>{paused ? "▶" : "Ⅱ"}</button>
    {paused ? <div className="match-pause" role="dialog" aria-modal="true" aria-label={t("match.pause")}>
      <section className="match-pause__card">
        <span className="match-pause__eyebrow">ANIMAL CUP</span>
        <h2>{t("match.paused")}</h2>
        <button type="button" className="ak-btn" onClick={() => applyPause(false)}>▶ {t("match.resume")}</button>
        <div className="match-speed"><b>{t("match.speed")}</b>{[1, 2, 4].map((n) => <button key={n} type="button" className={speed === n ? "is-selected" : ""} onClick={() => applySpeed(n)}>{n}×</button>)}</div>
        <button type="button" className="ak-btn ak-btn--outline" onClick={() => { window.location.href = "/"; }}>{t("match.exit")}</button>
      </section>
    </div> : null}
  </>;
}
