"use client";

// ============================================================================
// TouchControls — FC Mobile-style on-screen controls (play mode, touch).
//
// Layout follows EA's FC Mobile HUD: one contextual button cluster in the
// bottom-right thumb zone (the joystick stays bottom-left, untouched).
//   • SPRINT  — the big green-ring button pinned in the corner, both modes.
//   • ATTACK  (your team has the ball): SHOOT / THROUGH / PASS diamond plus a
//     small modifier arc (FINESSE · LOB · CHIP · POWER).
//   • DEFEND  (opponents have it / loose ball): TACKLE / CLEAR / SWITCH diamond
//     plus JOCKEY and 2ND DEF holds.
// The cluster swaps between the two sets exactly like FC Mobile does, driven
// by real possession polled from the engine seam (users.list[0] + ball owner).
//
// Visual skin matches FC Mobile: dark charcoal circles, coloured accent rings
// with a notch at the top, bold uppercase labels, pressed glow, a golden power
// arc that fills while SHOOT is held, and a small haptic tick on press.
//
// Input seam is unchanged: every button writes the same window.__touchInput
// fields the engine's acApplyInput() already consumes (vx/vy/shoot/pass/…).
// ============================================================================

import { useEffect, useRef, useState } from "react";

function input() {
  if (!window.__touchInput) {
    window.__touchInput = {
      active: false, vx: 0, vy: 0,
      shoot: false, pass: false, sprint: false, throughPass: false,
      lob: false, tackle: false, finesse: false, chip: false,
      powerShot: false, switchPlayer: false, secondDefender: false, jockey: false,
    };
  }
  return window.__touchInput;
}

const pulseTimers = new Map();

function setAction(name, value) {
  const state = input();
  state[name] = value;
  state.active = true;
}

function releaseAction(name) {
  const state = input();
  state[name] = false;
  state.active = state.vx !== 0 || state.vy !== 0;
}

function pulseAction(name) {
  const state = input();
  state.active = true;
  state[name] = true;
  clearTimeout(pulseTimers.get(name));
  pulseTimers.set(name, setTimeout(() => {
    state[name] = false;
    state.active = state.vx !== 0 || state.vy !== 0;
  }, 140));
}

// FC Mobile gives a subtle tactile tick on every press — mirror that where the
// browser supports the Vibration API (silently ignored elsewhere).
function buzz(ms) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms); } catch { /* no haptics */ }
}

// Pointer capture can throw (pointer already released between dispatch and
// capture, synthetic/stale pointerId) — never let it block the action itself.
function capture(e) {
  try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* not capturable — fine */ }
}

export default function TouchControls() {
  const baseRef = useRef(null);
  const thumbRef = useRef(null);
  const pointerRef = useRef(null);
  // true = attacking (your team owns the ball), false = defending / loose ball.
  const [attack, setAttack] = useState(false);

  useEffect(() => {
    input();
    const prevent = (e) => e.preventDefault();
    document.addEventListener("contextmenu", prevent, { passive: false });
    return () => document.removeEventListener("contextmenu", prevent);
  }, []);

  // Possession poll — same seam PlayerInfo uses (users.list[0]); the ball
  // owner/inHands holder tells us which set of buttons FC Mobile would show.
  useEffect(() => {
    const iv = setInterval(() => {
      let atk = false;
      try {
        const req = typeof window !== "undefined" ? window.require : undefined;
        const users = req ? req("users") : null;
        const u0 = users && users.list && users.list[0];
        const pitch = window.__matchGame && window.__matchGame.pitch;
        const ball = pitch && pitch.ball;
        const holder = (ball && (ball.owner || ball.inHands)) || null;
        if (u0 && holder && u0.team && holder.team === u0.team) atk = true;
        else if (u0 && u0.player && u0.player.hasBall) atk = true;
      } catch { /* seam not ready yet — keep last mode */ }
      setAttack((prev) => (prev === atk ? prev : atk));
    }, 250);
    return () => clearInterval(iv);
  }, []);

  function stickDown(e) {
    capture(e);
    pointerRef.current = e.pointerId;
    stickMove(e);
  }

  function stickMove(e) {
    if (pointerRef.current !== null && e.pointerId !== pointerRef.current) return;
    const base = baseRef.current;
    const thumb = thumbRef.current;
    if (!base || !thumb) return;
    const r = base.getBoundingClientRect();
    const max = Math.max(1, Math.min(r.width, r.height) * 0.36);
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > max) { x = x / len * max; y = y / len * max; }
    thumb.style.transform = `translate(${x}px, ${y}px)`;
    setAction("vx", x / max);
    setAction("vy", y / max);
  }

  function stickUp(e) {
    if (pointerRef.current !== null && e.pointerId !== pointerRef.current) return;
    pointerRef.current = null;
    if (thumbRef.current) thumbRef.current.style.transform = "translate(0,0)";
    setAction("vx", 0);
    setAction("vy", 0);
  }

  // Held actions (shoot / sprint / modifiers). `charge` adds the golden FC
  // power arc that fills while the button is down (SHOOT only).
  function hold(name, opts) {
    const charge = !!(opts && opts.charge);
    const charging = (el, on) => el && el.classList && el.classList.toggle("is-charging", on);
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        capture(e);
        e.currentTarget.classList.add("is-down");
        setAction(name, true);
        buzz(10);
        if (charge) charging(e.currentTarget, true);
      },
      onPointerUp: (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("is-down");
        releaseAction(name);
        if (charge) charging(e.currentTarget, false);
      },
      onPointerCancel: (e) => {
        e.currentTarget.classList.remove("is-down");
        releaseAction(name);
        if (charge) charging(e.currentTarget, false);
      },
      onPointerLeave: (e) => {
        e.currentTarget.classList.remove("is-down");
        releaseAction(name);
        if (charge) charging(e.currentTarget, false);
      },
    };
  }

  function tap(name) {
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        capture(e);
        e.currentTarget.classList.add("is-down");
        pulseAction(name);
        buzz(8);
      },
      onPointerUp: (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("is-down");
      },
      onPointerCancel: (e) => e.currentTarget.classList.remove("is-down"),
    };
  }

  return (
    <div className="tc" aria-label="Mobile match controls">
      {/* Left analog joystick — unchanged (owner: don't move or restyle). */}
      <div className="tc-stick" ref={baseRef}
        onPointerDown={stickDown} onPointerMove={stickMove}
        onPointerUp={stickUp} onPointerCancel={stickUp}>
        <span className="tc-thumb" ref={thumbRef} />
        <span className="tc-stick-label">MOVE</span>
      </div>

      {/* FC Mobile contextual cluster — bottom-right thumb zone. */}
      <div className="fc-cluster" aria-label="Action buttons">
        {/* SPRINT — the big corner button, present in both modes (FC's
            "Sprint & Skill" slot). Hold to sprint. */}
        <button type="button" aria-label="Sprint"
          className="fc-btn fc-btn--big fc-slot-big fc-ring-sprint" {...hold("sprint")}>
          Sprint
        </button>

        {/* ATTACK set — SHOOT / THROUGH / PASS diamond + modifier arc. */}
        <div className={`fc-group ${attack ? "" : "is-off"}`} aria-hidden={!attack}>
          <button type="button" aria-label="Shoot (hold to charge)"
            className="fc-btn fc-btn--main fc-slot-top fc-ring-shoot" {...hold("shoot", { charge: true })}>
            Shoot
            <svg className="fc-power" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" pathLength="100" />
            </svg>
          </button>
          <button type="button" aria-label="Through pass"
            className="fc-btn fc-btn--main fc-slot-mid fc-ring-through" {...tap("throughPass")}>
            Through
          </button>
          <button type="button" aria-label="Pass"
            className="fc-btn fc-btn--main fc-slot-left fc-ring-pass" {...tap("pass")}>
            Pass
          </button>
          <button type="button" aria-label="Finesse modifier (hold with shoot)"
            className="fc-btn fc-btn--sat fc-arc-a fc-ring-finesse" {...hold("finesse")}>
            Finesse
          </button>
          <button type="button" aria-label="Lob pass"
            className="fc-btn fc-btn--lob fc-arc-b fc-ring-lob" {...tap("lob")}>
            Lob
          </button>
          <button type="button" aria-label="Chip modifier (tap with shoot)"
            className="fc-btn fc-btn--sat fc-arc-c fc-ring-chip" {...tap("chip")}>
            Chip
          </button>
          <button type="button" aria-label="Power shot modifier (hold with shoot)"
            className="fc-btn fc-btn--sat fc-arc-d fc-ring-power" {...hold("powerShot")}>
            Power
          </button>
        </div>

        {/* DEFEND set — TACKLE / CLEAR / SWITCH diamond + helper holds. */}
        <div className={`fc-group ${attack ? "is-off" : ""}`} aria-hidden={attack}>
          <button type="button" aria-label="Slide tackle"
            className="fc-btn fc-btn--main fc-slot-top fc-ring-tackle" {...tap("tackle")}>
            Tackle
          </button>
          <button type="button" aria-label="Clearance"
            className="fc-btn fc-btn--main fc-slot-mid fc-ring-clear" {...tap("lob")}>
            Clear
          </button>
          <button type="button" aria-label="Switch player"
            className="fc-btn fc-btn--main fc-slot-left fc-ring-switch" {...tap("switchPlayer")}>
            Switch
          </button>
          <button type="button" aria-label="Second defender press (hold)"
            className="fc-btn fc-btn--sat fc-arc-b fc-ring-second" {...hold("secondDefender")}>
            2nd Def
          </button>
          <button type="button" aria-label="Jockey (hold)"
            className="fc-btn fc-btn--sat fc-arc-c fc-ring-jockey" {...hold("jockey")}>
            Jockey
          </button>
        </div>
      </div>
    </div>
  );
}
