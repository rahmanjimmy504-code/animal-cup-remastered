"use client";
// ============================================================================
// Gameplay settings — FC 26/27-style playstyle presets + the control layer.
//
// Everything shown here is HONEST about what the engine honours:
//   • Preset multipliers (speed/acceleration) → applied by the engine in
//     setupMatch via window.__acGameplay.config (see app/match/match.jsx).
//   • Passing assisted/manual → applied to the live engine users at match
//     time by useUserAssist() (user.passing 1/2; sprint flips the mode).
//   • AI assistance → applied to the AI level when a match is launched from
//     the landing screen (effectiveAiLevel, app/game/gameplay.js).
//   • The controls reference below mirrors the ENGINE's real default key
//     layout (arrows / A / W / D / S / Q / Ctrl / T / Shift) — the old
//     "F finesse / C chip / P power" text described keys the engine never
//     bound, so it is gone.
// The resolution algorithms behind the presets live in app/game/gameplay.js
// and are documented in docs/gameplay-rules.md.
// ============================================================================
import { useEffect, useState } from "react";
import { readGameplay, saveGameplay, PRESETS, CURRENT_RULES, CONTROL_PRESETS } from "../game/gameplay";
import { useLocale } from "../i18n/LocaleProvider";
import ThemeToggle from "../game/ThemeToggle";
import "./settings.css";

export default function SettingsPage() {
  const { t } = useLocale();
  const [s, setS] = useState(null);
  useEffect(() => setS(readGameplay()), []);
  if (!s) return null;
  const set = (k, v) => { const n = { ...s, [k]: v }; setS(n); saveGameplay(n); };

  // PC rows — the engine's ACTUAL default keyboard layout (match.rebuilt.js
  // keyDown map in standalone-match.js), not an aspirational one.
  const pcRows = [
    { keys: ["↑", "↓", "←", "→"], label: t("controls.move") },
    { keys: ["A"], label: t("controls.pass") },
    { keys: ["W"], label: t("controls.lob") },
    { keys: ["D"], label: t("controls.shoot") },
    { keys: ["S"], label: t("controls.tackle") },
    { keys: ["Q"], label: t("controls.switch") },
    { keys: ["Ctrl"], label: t("controls.jockey") },
    { keys: ["T"], label: t("controls.trap") },
    { keys: ["Shift"], label: t("controls.sprint") },
  ];
  // Touch + LAN pad use on-screen buttons (no keys), so they render as plain
  // action rows. Order mirrors the on-screen layout (move, then the diamond).
  const touchRows = [
    t("settings.stick"),
    t("settings.shootHold"),
    `${t("controls.pass")} / ${t("controls.lob")} / ${t("controls.tackle")} — ${t("settings.actions")}`,
    `${t("controls.sprint")} (${t("settings.hold")})`,
    `${t("controls.jockey")} (${t("settings.hold")})`,
  ];
  const padRows = [
    t("settings.stick"),
    t("settings.shootHold"),
    `${t("controls.pass")} / ${t("controls.lob")} / ${t("controls.tackle")} — ${t("settings.actions")}`,
    `${t("controls.sprint")} (${t("settings.hold")})`,
    `${t("controls.jockey")} (${t("settings.hold")})`,
  ];

  const ctrlTable = (rows) => (
    <div className="ctrl-table">
      {rows.map((r, i) => (
        <div className="ctrl-table__row" key={i}>
          <span className="ctrl-table__keys">{r.keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>
          <span className="ctrl-table__act">{r.label}</span>
        </div>
      ))}
    </div>
  );
  const actionList = (rows) => (
    <ul className="ctrl-list">
      {rows.map((r, i) => <li key={i}>{r}</li>)}
    </ul>
  );

  return (
    <main className="game-settings">
      <header>
        <a href="/">{t("settings.back")}</a>
        <ThemeToggle />
      </header>
      <section className="settings-card">
        <h1>{t("settings.title")}</h1>
        <p className="settings-sub">{t("settings.sub")}</p>

        {/* ---------- presets ---------- */}
        <h2 className="settings-h2">{t("settings.preset")}</h2>
        <div className="preset-grid">
          {Object.keys(PRESETS).map((k) => (
            <button className={s.preset === k ? "selected" : ""} onClick={() => set("preset", k)} key={k}>
              <b>{k === "arcade" ? "🎮 Arcade" : "🧠 Authentic"}</b>
              <small>{k === "arcade" ? t("settings.arcadeDesc") : t("settings.authenticDesc")}</small>
            </button>
          ))}
        </div>

        {/* ---------- per-toggle settings ---------- */}
        <div className="settings-list">
          <label>
            <span>
              {t("settings.passing")}
              <small>{t("settings.passingDesc")}</small>
            </span>
            <select value={String(s.assistedPassing)} onChange={(e) => set("assistedPassing", e.target.value === "true")}>
              <option value="true">{t("settings.assisted")}</option>
              <option value="false">{t("settings.manual")}</option>
            </select>
          </label>
          <label>
            <span>
              {t("settings.aiAssist")}
              <small>{t("settings.aiAssistDesc")}</small>
            </span>
            <select value={s.aiAssist} onChange={(e) => set("aiAssist", e.target.value)}>
              <option value="low">{t("settings.aiLow")}</option>
              <option value="medium">{t("settings.aiMedium")}</option>
              <option value="high">{t("settings.aiHigh")}</option>
            </select>
          </label>
        </div>

        {/* ---------- controls reference (PC + touch + LAN pad) ---------- */}
\n        <h2 className="settings-h2">2026/27 football rules</h2>\n        <div className="rules-grid">\n          {CURRENT_RULES.rules.map((rule) => (\n            <div className="rule-card" key={rule.id}>\n              <div><b>{rule.label}</b><span className={rule.implemented === true ? "rule-live" : rule.implemented === "partial" ? "rule-partial" : "rule-optional"}>{rule.implemented === true ? "IN GAME" : rule.implemented === "partial" ? "PARTIAL" : "OPTIONAL"}</span></div>\n              <small>{rule.detail}</small>\n            </div>\n          ))}\n        </div>\n        <p className="ctrl-note">Restart countdowns use the 5-second 2026/27 protocol; goalkeeper hand control is limited to 8 seconds.</p>\n        <h2 className="settings-h2">{t("settings.controlsTitle")}</h2>
        <div className="ctrl-columns">
          <div className="ctrl-col">
            <b>{t("settings.pc")}</b>
            {ctrlTable(pcRows)}
            <p className="ctrl-note">{t("controls.modNote")}</p>
          </div>
          <div className="ctrl-col">
            <b>{t("settings.touch")}</b>
            {actionList(touchRows)}
            <p className="ctrl-note">{t("settings.aimLine")}</p>
            <p className="ctrl-note">{t("settings.autoSwitch")}</p>
            <p className="ctrl-note">{t("settings.pinch")}</p>
          </div>
          <div className="ctrl-col">
            <b>{t("settings.pad")}</b>
            {actionList(padRows)}
            <p className="ctrl-note">{t("settings.pinch")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
