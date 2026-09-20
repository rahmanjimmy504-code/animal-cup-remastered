"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

const KEY = "animalCupMatchA11y";

export default function MatchAccessibility() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({ reducedMotion: false, highContrast: false, largeHud: false });

  useEffect(() => {
    try { setSettings({ ...settings, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }); } catch {}
  }, []);

  useEffect(() => {
    const root = document.body;
    root.classList.toggle("ac-reduced-motion", settings.reducedMotion);
    root.classList.toggle("ac-high-contrast", settings.highContrast);
    root.classList.toggle("ac-large-hud", settings.largeHud);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const flip = (name) => setSettings((s) => ({ ...s, [name]: !s[name] }));
  return (
    <div className="match-a11y">
      <button type="button" className="glass-btn" aria-label={t("match.accessibility")} onClick={() => setOpen((v) => !v)}>⚙</button>
      {open ? <section className="match-a11y__panel" aria-label={t("match.accessibility")}>
        <b>{t("match.accessibility")}</b>
        <label><input type="checkbox" checked={settings.reducedMotion} onChange={() => flip("reducedMotion")} /> {t("match.reducedMotion")}</label>
        <label><input type="checkbox" checked={settings.highContrast} onChange={() => flip("highContrast")} /> {t("match.highContrast")}</label>
        <label><input type="checkbox" checked={settings.largeHud} onChange={() => flip("largeHud")} /> {t("match.largeHud")}</label>
      </section> : null}
    </div>
  );
}
