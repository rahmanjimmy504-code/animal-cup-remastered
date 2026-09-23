"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAYABLE_TEAMS, portraitSrc, runtimeHeadSrc } from "../data/teams";
import { useLocale } from "../i18n/LocaleProvider";
import LangSwitcher from "../i18n/LangSwitcher";
import ThemeToggle from "../game/ThemeToggle";
import css from "./AiLab.module.css";

const AI_MODELS = [
  { id: "easy", level: 0, icon: "🌱", key: "easy" },
  { id: "standard", level: 1, icon: "⚽", key: "standard" },
  { id: "advanced", level: 2, icon: "🔥", key: "advanced" },
  { id: "elite", level: 3, icon: "👑", key: "elite" },
];

export default function AiLabPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [red, setRed] = useState("england");
  const [blue, setBlue] = useState("france");
  const [redModel, setRedModel] = useState("standard");
  const [blueModel, setBlueModel] = useState("elite");
  const [time, setTime] = useState(4);

  const selectedRed = useMemo(() => AI_MODELS.find((m) => m.id === redModel) || AI_MODELS[1], [redModel]);
  const selectedBlue = useMemo(() => AI_MODELS.find((m) => m.id === blueModel) || AI_MODELS[3], [blueModel]);
  const sameEngineLevel = selectedRed.level === selectedBlue.level;

  function watch() {
    // The closed match runtime exposes one documented AI difficulty value for
    // the whole match, not separate red/blue AI controllers. Never pretend the
    // two selected profiles are independently applied when they are not.
    const effective = sameEngineLevel ? selectedRed.level : Math.max(selectedRed.level, selectedBlue.level);
    router.push(`/match?red=${red}&blue=${blue}&ai=${effective}&time=${time}&mode=ai-lab&ailab=1&redAI=${redModel}&blueAI=${blueModel}`);
  }

  const teamButton = (id, picked, setPicked, disabled) => {
    const team = PLAYABLE_TEAMS.find((x) => x.id === id);
    return (
      <button type="button" disabled={disabled} className={`${css.team} ${picked === id ? css.teamOn : ""}`} onClick={() => setPicked(id)}>
        <img src={portraitSrc(id)} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = runtimeHeadSrc(id); }} />
        <span>{t(`team.${id}.name`)}</span>
        <small>{team?.icon || "🐾"} {t(`team.${id}.animal`)}</small>
      </button>
    );
  };

  return (
    <main className={css.page}>
      <div className={css.top}><a href="/">← {t("keys.back")}</a><div><LangSwitcher /><ThemeToggle /></div></div>
      <section className={css.card}>
        <div className={css.eyebrow}>👁️ AI SPECTATOR MODE</div>
        <h1>{t("aiLab.title")}</h1>
        <p className={css.lead}>{t("aiLab.subtitle")}</p>

        <div className={css.duel}>
          <section>
            <h2>{t("aiLab.redTeam")}</h2>
            <div className={css.teams}>{PLAYABLE_TEAMS.map((team) => teamButton(team.id, red, setRed, team.id === blue))}</div>
            <h3>{t("aiLab.model")}</h3>
            <div className={css.models}>{AI_MODELS.map((model) => <button key={model.id} type="button" className={redModel === model.id ? css.modelOn : ""} onClick={() => setRedModel(model.id)}><b>{model.icon}</b><span>{t(`aiLab.model.${model.key}`)}</span><small>AI {model.level}</small></button>)}</div>
          </section>
          <div className={css.vs}>VS</div>
          <section>
            <h2>{t("aiLab.blueTeam")}</h2>
            <div className={css.teams}>{PLAYABLE_TEAMS.map((team) => teamButton(team.id, blue, setBlue, team.id === red))}</div>
            <h3>{t("aiLab.model")}</h3>
            <div className={css.models}>{AI_MODELS.map((model) => <button key={model.id} type="button" className={blueModel === model.id ? css.modelOn : ""} onClick={() => setBlueModel(model.id)}><b>{model.icon}</b><span>{t(`aiLab.model.${model.key}`)}</span><small>AI {model.level}</small></button>)}</div>
          </section>
        </div>

        <div className={css.notice}>
          <b>{sameEngineLevel ? t("aiLab.exact") : t("aiLab.compatibility")}</b>
          {!sameEngineLevel ? <span>{t("aiLab.compatibilityDetail", { level: Math.max(selectedRed.level, selectedBlue.level) })}</span> : null}
        </div>

        <div className={css.bottom}>
          <label>{t("aiLab.matchLength")}
            <select value={time} onChange={(e) => setTime(Number(e.target.value))}>
              <option value={2}>{t("home.time.short")}</option>
              <option value={4}>{t("home.time.normal")}</option>
              <option value={8}>{t("home.time.long")}</option>
            </select>
          </label>
          <button type="button" className={css.watch} onClick={watch}>▶ {t("aiLab.watch")}</button>
        </div>
        <div className={css.noRewards}>🏆 {t("aiLab.noRewards")}</div>
      </section>
    </main>
  );
}
