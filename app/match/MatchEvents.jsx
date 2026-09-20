"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import EventCard from "./EventCard";

// Pitch state machine names (engine) → set-piece labels shown as a small
// top-centre chip while the restart is set up (FC-style phase feedback).
// The engine only models these four human-relevant restarts as pitch states
// (no PK shoot-out / free-kick state machine yet — see rules doc roadmap).
const PHASE_NAMES = {
  Kickoff: "match.phase.kickoff",
  Corner: "match.phase.corner",
  GoalKick: "match.phase.goalkick",
  ThrowIn: "match.phase.throwin",
};

/**
 * Drives the in-match event cards (goal / half-time) by POLLING the live
 * runtime (window.__matchGame.pitch) — deliberately NOT by editing the
 * standalone-match.js adapter (another session owns it) and NOT by coupling
 * to the engine's signal API. A score bump → GOAL card; secondHalf flip →
 * HALF-TIME card. Full-time is handled by MatchChrome's result screen.
 * Also renders the set-piece phase chip from pitch.states.name.
 */
export default function MatchEvents() {
  const { t } = useLocale();
  const [event, setEvent] = useState(null);
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    // engine team objects carry numeric entity ids — the team SLUGS for
    // portraits come from the match URL (same seeding as MatchChrome)
    const params = new URLSearchParams(window.location.search);
    const slugs = { red: params.get("red") || "england", blue: params.get("blue") || "france" };
    let lastR = 0, lastB = 0, shownHalf = false, started = false, hideTimer = null;
    let lastPhase = null, phaseTimer = null;
    // closure-local (the `event` state is stale inside this interval) — used
    // to hold the phase chip while a goal/half-time card is on screen
    let lastEventAt = 0;
    const show = (ev) => {
      lastEventAt = Date.now();
      setEvent(ev);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setEvent(null), 2600);
    };
    const poll = setInterval(() => {
      const game = window.__matchGame;
      const pitch = game && game.pitch;
      if (!pitch || !pitch.redTeam || !pitch.blueTeam) return;
      const r = pitch.redTeam.score | 0, b = pitch.blueTeam.score | 0;
      if (!started) { lastR = r; lastB = b; shownHalf = !!pitch.secondHalf; started = true; return; }
      if (r > lastR || b > lastB) {
        const teamId = r > lastR ? slugs.red : slugs.blue;
        show({ kind: "goal", title: t("event.goal"), teamId, line: `${r} : ${b}` });
      } else if (!shownHalf && (pitch.states.name === "HalfEnded" || pitch.secondHalf)) {
        // HalfEnded = the first-half whistle (the right moment); secondHalf
        // flip is only a late fallback in case a poll tick missed the state
        shownHalf = true;
        show({ kind: "half", title: t("event.halftime"), teamId: null, line: t("event.halftimeLine") });
      }
      // set-piece phase chip (suppressed for 2.6s after an event card —
      // they share the top-centre zone)
      const ph = pitch.states && pitch.states.name;
      if (ph && PHASE_NAMES[ph] && ph !== lastPhase && Date.now() - lastEventAt > 2600) {
        lastPhase = ph;
        setPhase(t(PHASE_NAMES[ph]));
        clearTimeout(phaseTimer);
        phaseTimer = setTimeout(() => setPhase(null), 2200);
      } else if (!ph || !PHASE_NAMES[ph]) {
        lastPhase = ph;
      }
      lastR = r; lastB = b;
    }, 350);
    return () => { clearInterval(poll); clearTimeout(hideTimer); clearTimeout(phaseTimer); };
  }, [t]);

  return (
    <>
      {phase && !event ? <div className="phase-chip">{phase}</div> : null}
      <EventCard event={event} onClose={() => setEvent(null)} />
    </>
  );
}
