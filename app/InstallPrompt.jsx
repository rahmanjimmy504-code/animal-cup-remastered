"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "animalCupInstallPromptDismissed";

/**
 * Offers a one-tap install prompt when the browser supports the PWA install
 * flow. The prompt is deliberately kept outside the game canvas so it does
 * not interfere with touch controls, and it remembers a dismissal for the
 * current browser.
 */
export default function InstallPrompt() {
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) return undefined;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return undefined;

    const onInstallable = (installEvent) => {
      installEvent.preventDefault();
      setEvent(installEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    return () => window.removeEventListener("beforeinstallprompt", onInstallable);
  }, []);

  if (!visible || !event) return null;

  async function install() {
    setVisible(false);
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  }

  function dismiss() {
    setVisible(false);
    setEvent(null);
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  return (
    <aside
      role="dialog"
      aria-label="Install Animal Cup"
      style={{
        position: "fixed", zIndex: 100, left: "50%", bottom: 18,
        transform: "translateX(-50%)", width: "min(92vw, 390px)",
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        border: "2px solid #41702a", borderRadius: 16,
        background: "#fffef8", color: "#315022",
        boxShadow: "0 10px 30px rgba(30, 50, 20, .3)",
        fontFamily: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
      }}
    >
      <span aria-hidden style={{ fontSize: 27 }}>🐾</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
        Install Animal Cup for quick offline play.
      </span>
      <button type="button" onClick={install} style={buttonStyle}>Install</button>
      <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" style={dismissStyle}>×</button>
    </aside>
  );
}

const buttonStyle = {
  border: "0", borderRadius: 10, padding: "9px 12px", cursor: "pointer",
  background: "#5d9038", color: "#fff7e2", fontWeight: 900,
};
const dismissStyle = {
  border: 0, background: "transparent", color: "#6b8a55", cursor: "pointer",
  fontSize: 22, lineHeight: 1, padding: 4,
};
