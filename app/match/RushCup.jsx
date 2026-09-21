"use client";
import { useEffect,useRef,useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { readProfile } from "../game/cup";

export default function RushCup(){
 const {t}=useLocale(),[active,setActive]=useState(false),[seconds,setSeconds]=useState(90),[chance,setChance]=useState(""),[momentum,setMomentum]=useState(50),[division,setDivision]=useState("ROOKIE"),start=useRef(0),ended=useRef(false);
 useEffect(()=>{
  const mode=new URLSearchParams(window.location.search).get("mode");
  try{setDivision(readProfile().rush.division||"ROOKIE")}catch{}
  if(mode!=="rush")return;
  const begin=()=>{start.current=performance.now();ended.current=false;setSeconds(90);setMomentum(50);setActive(true)};
  const goal=()=>{setMomentum(x=>Math.min(100,x+14));setChance(t("rush.greatChance"));setTimeout(()=>setChance(""),1100)};
  const finish=()=>{
   if(ended.current)return;ended.current=true;setActive(false);
   const p=window.__matchGame?.pitch,score=[Number(p?.redTeam?.score||0),Number(p?.blueTeam?.score||0)],q=new URLSearchParams(window.location.search),red=q.get("red")||"england",blue=q.get("blue")||"france";
   window.__acPaused=true;try{if(p)p.paused=true}catch{}
   window.dispatchEvent(new CustomEvent("ab-match-ended",{detail:{red,blue,score,rush:true}}));
   setTimeout(()=>{try{const r=readProfile().rush;setDivision(r.division||"ROOKIE");window.dispatchEvent(new CustomEvent("ac-rush-result",{detail:r}))}catch{}},60);
  };
  const onGoal=goal,onStart=begin;window.addEventListener("ab-match-started",onStart);window.addEventListener("ab-goal",onGoal);
  const iv=setInterval(()=>{
   if(!start.current||ended.current)return;
   const left=Math.max(0,90-(performance.now()-start.current)/1000);setSeconds(left);
   if(left<=0)finish();
   else if(Math.floor(left)%7===0){
    try{const u=window.require?.("users")?.list?.[0],b=window.__matchGame?.pitch?.ball,owner=b?.owner;const mine=!!(u?.player?.hasBall||(owner?.team&&owner.team===u?.team));if(mine){const n=Math.floor(left);setChance(t(n%14===0?"rush.greatChance":n%7===0?"rush.goodChance":"rush.basicChance"));setTimeout(()=>setChance(""),900)}}catch{}
   }
  },50);
  return()=>{clearInterval(iv);window.removeEventListener("ab-match-started",onStart);window.removeEventListener("ab-goal",onGoal)};
 },[t]);
 if(!active&&!chance)return null;
 return <><div className="rush-hud"><div className="rush-hud__row"><span className="rush-hud__title">{t("rush.title")}</span><b className="rush-hud__time">{Math.ceil(seconds)}s</b></div><div className="rush-hud__fans">{t("rush.division",{division})}</div><div className="rush-hud__meter"><i style={{width:`${momentum}%`}}/></div></div>{chance?<div className="rush-chance">{chance}</div>:null}</>;
}
