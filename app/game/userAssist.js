"use client";
// ============================================================================
// useUserAssist — applies the settings' assisted/manual passing mode to the
// LIVE engine user objects.
//
// The engine honours user.passing (0–3) on every pass and lob:
//   0 assisted always · 1 assisted, hold sprint = manual
//   2 manual, hold sprint = assisted · 3 manual always
// React persists the user's preference in localStorage (see settings page);
// this bridge copies it onto users.list[i].passing for every human user as
// soon as the engine exposes them, then no-ops until the setting changes.
// Safe to mount anywhere the match runs: it never throws across the seam.
// ============================================================================
import { useEffect, useState } from "react";
import { readGameplay, passingModeFor } from "./gameplay.js";

export function useUserAssist() {
  const [applied, setApplied] = useState(0);
  useEffect(() => {
    let stopped = false;
    const tick = () => {
      try {
        const req = typeof window !== "undefined" ? window.require : undefined;
        if (!req) return;
        const users = (req("users") || {}).list || [];
        if (!users.length) return;
        const mode = passingModeFor(readGameplay());
        let n = 0;
        for (const u of users) {
          if (u && u.passing !== mode) { u.passing = mode; n++; }
        }
        if (n && !stopped) setApplied(n);
      } catch { /* seam guard */ }
    };
    tick();
    const iv = setInterval(tick, 700);
    return () => { stopped = true; clearInterval(iv); };
  }, []);
  return applied;
}
