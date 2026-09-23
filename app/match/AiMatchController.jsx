"use client";

import { useEffect, useRef, useState } from "react";

const ACTIONS=["pass","lob","throughPass","shoot","finesse","chip","powerShot","tackle","secondDefender","switchPlayer","jockey"];
const HOLD_ACTIONS=new Set(["sprint","jockey","secondDefender"]);

function ensureInput(name){
  const key=name==="blue"?"__touchInput2":"__touchInput";
  const existing=window[key]||(window[key]={active:false,vx:0,vy:0,shoot:false,sprint:false,pass:false,lob:false,switchPlayer:false,tackle:false,throughPass:false,finesse:false,chip:false,powerShot:false,secondDefender:false,jockey:false});
  return existing;
}
function reset(i){for(const k of ["shoot","pass","lob","switchPlayer","tackle","throughPass","finesse","chip","powerShot","secondDefender","jockey"])i[k]=false;i.active=false}
function apply(side,a){
  const i=ensureInput(side); reset(i);
  i.vx=Math.max(-1,Math.min(1,Number(a?.vx)||0)); i.vy=Math.max(-1,Math.min(1,Number(a?.vy)||0)); i.sprint=!!a?.sprint; i.active=true;
  const act=ACTIONS.includes(a?.action)?a.action:"none";
  if(act!=="none") i[act]=true;
  return i;
}
function snapshot(side){
  const pitch=window.__matchGame?.pitch, users=window.require?.("users")?.list||[];
  if(!pitch) return null;
  const team=side==="red"?pitch.redTeam:pitch.blueTeam, enemy=side==="red"?pitch.blueTeam:pitch.redTeam;
  const u=side==="red"?users[0]:users[1], p=u?.player, b=pitch.ball;
  const pack=(x)=>x?{id:x.id||null,x:Number(x.position?.x??x.x??0),y:Number(x.position?.y??x.y??0),role:x.role||null,hasBall:!!x.hasBall,isGK:!!x.isGoalkeeper}:null;
  return {
    side, score:{red:pitch.redTeam.score|0,blue:pitch.blueTeam.score|0},
    clock:Number(pitch.matchTime||0), ball:{x:Number(b?.position?.x||0),y:Number(b?.position?.y||0),ownerTeam:b?.owner?.team===pitch.redTeam?"red":b?.owner?.team===pitch.blueTeam?"blue":null},
    controlled:pack(p), teammates:(team?.allPlayers||[]).slice(0,8).map(pack), opponents:(enemy?.allPlayers||[]).slice(0,8).map(pack),
    hasBall:!!p?.hasBall
  };
}

export default function AiMatchController({redModel,blueModel,redProvider,blueProvider}){
  const busy=useRef({red:false,blue:false}), dead=useRef(false), [logs,setLogs]=useState([]);
  useEffect(()=>{
    dead.current=false;
    const tick=async(side)=>{
      if(dead.current||busy.current[side])return;
      const provider=side==="red"?redProvider:blueProvider,model=side==="red"?redModel:blueModel;
      const state=snapshot(side); if(!state)return;
      busy.current[side]=true;
      try{
        const r=await fetch("/api/ai/decision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model,side,state})});
        const j=await r.json(); if(!r.ok)throw new Error(j?.error||"AI request failed");
        apply(side,j.action||{});
        setLogs(x=>[{side,model,action:j.action,at:Date.now()},...x].slice(0,8));
      }catch(e){setLogs(x=>[{side,error:e.message,at:Date.now()},...x].slice(0,8));}
      finally{busy.current[side]=false;}
    };
    const iv=setInterval(()=>{tick("red");tick("blue")},900);
    tick("red");tick("blue");
    return()=>{dead.current=true;clearInterval(iv);reset(ensureInput("red"));reset(ensureInput("blue"));};
  },[redModel,blueModel,redProvider,blueProvider]);
  return <div className="ai-lab-overlay" aria-live="polite">
    <div className="ai-lab-badge">🤖 LLM MATCH</div>
    <div className="ai-lab-feed">{logs.slice(0,4).map((x,i)=><div key={x.at+i}><b>{x.side==="red"?"RED":"BLUE"}</b> · {x.error?"ERROR":x.action?.action||"move"}</div>)}</div>
  </div>;
}
