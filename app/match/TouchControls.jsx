"use client";

import { useEffect, useRef } from "react";

function input() {
  if (!window.__touchInput) {
    window.__touchInput = {
      x: 0, y: 0,
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

export default function TouchControls() {
  const baseRef = useRef(null);
  const thumbRef = useRef(null);
  const pointerRef = useRef(null);

  useEffect(() => {
    input();
    const prevent = (e) => e.preventDefault();
    document.addEventListener("contextmenu", prevent, { passive: false });
    return () => document.removeEventListener("contextmenu", prevent);
  }, []);

  function stickDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
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

  function hold(name) {
    return {
      onPointerDown: (e) => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); setAction(name, true); },
      onPointerUp: (e) => { e.preventDefault(); setAction(name, false); },
      onPointerCancel: () => setAction(name, false),
      onPointerLeave: () => setAction(name, false),
    };
  }

  function tap(name) {
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        pulseAction(name);
      },
      onPointerUp: (e) => e.preventDefault(),
      onPointerCancel: () => {},
    };
  }

  return (
    <div className="tc" aria-label="Mobile match controls">
      <div className="tc-stick" ref={baseRef}
        onPointerDown={stickDown} onPointerMove={stickMove}
        onPointerUp={stickUp} onPointerCancel={stickUp}>
        <span className="tc-thumb" ref={thumbRef} />
        <span className="tc-stick-label">MOVE</span>
      </div>

      <div className="tc-left-actions">
        <button type="button" className="tc-mobile-btn tc-mobile-btn--jockey" {...hold("jockey")}>Jockey</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--switch" {...tap("switchPlayer")}>Switch</button>
      </div>

      <div className="tc-actions" aria-label="Match controls">
        <button type="button" className="tc-mobile-btn tc-mobile-btn--lob" {...tap("lob")}>Lob</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--through" {...tap("throughPass")}>Through</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--shoot" {...hold("shoot")}>Shoot</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--pass" {...tap("pass")}>Pass</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--sprint" {...hold("sprint")}>Sprint</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--finesse" {...hold("finesse")}>Finesse</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--tackle" {...tap("tackle")}>Tackle</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--chip" {...tap("chip")}>Chip</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--power" {...hold("powerShot")}>Power</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--second" {...hold("secondDefender")}>2nd Defender</button>
      </div>
    </div>
  );
}
