"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAYABLE_TEAMS, portraitSrc, runtimeHeadSrc } from "../data/teams";
import { useLocale } from "../i18n/LocaleProvider";
import LangSwitcher from "../i18n/LangSwitcher";
import ThemeToggle from "../game/ThemeToggle";
import css from "./AiLab.module.css";

const PROVIDERS={
  openrouter:{name:"OpenRouter",models:[
    ["openrouter/free","OpenRouter Free Router",true],
    ["nvidia/nemotron-3-ultra-550b-a55b-20260604:free","Nemotron 3 Ultra",true],
    ["nvidia/nemotron-3-super-120b-a12b-20230311:free","Nemotron 3 Super",true],
    ["inclusionai/ling-3.0-flash:free","Ling 3.0 Flash",true],
    ["inclusionai/ling-3.0-flash-fin:free","Ling 3.0 Flash Fin",true]
  ]},
  groq:{name:"Groq",models:[["openai/gpt-oss-20b","GPT OSS 20B",false],["openai/gpt-oss-120b","GPT OSS 120B",false],["qwen/qwen3.8-27b","Qwen 3.8 27B",false]]},
  cloudflare:{name:"Cloudflare Workers AI",models:[["@cf/zai-org/glm-4.7-flash","GLM 4.7 Flash",true],["@cf/nvidia/nemotron-3-120b-a12b","Nemotron 3 120B",true],["@cf/openai/gpt-oss-20b","GPT OSS 20B",true],["@cf/qwen/qwen3-30b-a3b-fp8","Qwen 3 30B",true]]},
  mistral:{name:"Mistral",models:[["mistral-small-latest","Mistral Small",false],["mistral-large-latest","Mistral Large",false]]},
  cohere:{name:"Cohere",models:[["command-a-03-2025","Command A",false]]},
  huggingface:{name:"Hugging Face",models:[["openai/gpt-oss-20b","GPT OSS 20B",true],["Qwen/Qwen3-8B","Qwen 3 8B",true]]},
  zai:{name:"Z.ai",models:[["glm-4.7-flash","GLM 4.7 Flash",false],["glm-5","GLM 5",false]]}
};

function choices(provider){return PROVIDERS[provider]?.models||[]}

export default function AiLabPage(){
 const {t}=useLocale(),router=useRouter();
 const [red,setRed]=useState("england"),[blue,setBlue]=useState("france"),[time,setTime]=useState(4);
 const [redProvider,setRedProvider]=useState("openrouter"),[blueProvider,setBlueProvider]=useState("openrouter");
 const [redModel,setRedModel]=useState("nvidia/nemotron-3-ultra-550b-a55b-20260604:free"),[blueModel,setBlueModel]=useState("nvidia/nemotron-3-super-120b-a12b-20230311:free");
 const [configured,setConfigured]=useState({});
 useEffect(()=>{fetch("/api/ai/decision").then(r=>r.json()).then(x=>setConfigured(x.providers||{})).catch(()=>{});},[]);
 const redModels=useMemo(()=>choices(redProvider),[redProvider]),blueModels=useMemo(()=>choices(blueProvider),[blueProvider]);
 useEffect(()=>{if(!redModels.some(x=>x[0]===redModel))setRedModel(redModels[0]?.[0]||"")},[redModels,redModel]);
 useEffect(()=>{if(!blueModels.some(x=>x[0]===blueModel))setBlueModel(blueModels[0]?.[0]||"")},[blueModels,blueModel]);
 function watch(){router.push(`/match?red=${red}&blue=${blue}&ai=0&p2=1&play=1&time=${time}&mode=ai-lab&ailab=1&redProvider=${redProvider}&blueProvider=${blueProvider}&redAI=${encodeURIComponent(redModel)}&blueAI=${encodeURIComponent(blueModel)}`)}
 const teamButton=(id,picked,setPicked,disabled)=>{const team=PLAYABLE_TEAMS.find(x=>x.id===id);return <button type="button" disabled={disabled} className={`${css.team} ${picked===id?css.teamOn:""}`} onClick={()=>setPicked(id)}><img src={portraitSrc(id)} alt="" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=runtimeHeadSrc(id)}}/><span>{t(`team.${id}.name`)}</span><small>{team?.icon||"🐾"} {t(`team.${id}.animal`)}</small></button>};
 const modelPicker=(provider,setProvider,model,setModel)=> <div className={css.modelBox}><select value={provider} onChange={e=>setProvider(e.target.value)}>{Object.entries(PROVIDERS).map(([id,p])=><option key={id} value={id}>{p.name}{configured[id]?.configured?" · ✓":""}</option>)}</select><div className={css.models}>{choices(provider).map(([id,name,free])=><button key={id} type="button" className={model===id?css.modelOn:""} onClick={()=>setModel(id)}><b>{free?"🟢":"🔵"}</b><span>{name}</span><small>{free?"FREE model":"provider tier"}</small></button>)}</div></div>;
 return <main className={css.page}><div className={css.top}><a href="/">← {t("keys.back")}</a><div><LangSwitcher/><ThemeToggle/></div></div><section className={css.card}>
  <div className={css.eyebrow}>🤖 REAL LLM VS LLM</div><h1>{t("aiLab.title")}</h1><p className={css.lead}>{t("aiLab.subtitle")}</p>
  <div className={css.duel}>
   <section><h2>{t("aiLab.redTeam")}</h2><div className={css.teams}>{PLAYABLE_TEAMS.map(team=>teamButton(team.id,red,setRed,team.id===blue))}</div><h3>{t("aiLab.model")}</h3>{modelPicker(redProvider,setRedProvider,redModel,setRedModel)}</section>
   <div className={css.vs}>VS</div>
   <section><h2>{t("aiLab.blueTeam")}</h2><div className={css.teams}>{PLAYABLE_TEAMS.map(team=>teamButton(team.id,blue,setBlue,team.id===red))}</div><h3>{t("aiLab.model")}</h3>{modelPicker(blueProvider,setBlueProvider,blueModel,setBlueModel)}</section>
  </div>
  <div className={css.notice}><b>{t("aiLab.real")}</b><span>{t("aiLab.setup")}</span><span>{t("aiLab.noKeys")}</span></div>
  <div className={css.bottom}><label>{t("aiLab.matchLength")}<select value={time} onChange={e=>setTime(Number(e.target.value))}><option value={2}>{t("home.time.short")}</option><option value={4}>{t("home.time.normal")}</option><option value={8}>{t("home.time.long")}</option></select></label><button type="button" className={css.watch} onClick={watch}>▶ {t("aiLab.watch")}</button></div>
  <div className={css.noRewards}>🏆 {t("aiLab.noRewards")}</div>
 </section></main>;
}
