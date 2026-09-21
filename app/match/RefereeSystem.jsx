"use client";

import { useEffect, useState } from "react";

const EMPTY={fouls:0,yellows:0,reds:0,secondYellows:0,directFreeKicks:0,indirectFreeKicks:0,penalties:0,corners:0,droppedBalls:0,offside:0,handballs:0,substitutions:0,subOpportunities:0,log:[],players:{}};

function getRef(){
  if(!window.__acReferee){
    window.__acReferee={
      stats:JSON.parse(JSON.stringify(EMPTY)),listeners:new Set(),incident:null,
      emit(){for(const fn of this.listeners)fn(this.stats);},
      subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);},
      reset(){this.stats=JSON.parse(JSON.stringify(EMPTY));this.emit();},
      onSlideHit(game,slider){
        const pitch=game?.pitch;if(!pitch||!slider?.team)return;
        const cfg=window.__acGameplay?.config||{},now=performance.now();
        if(slider.__acRefLast&&now-slider.__acRefLast<850)return;slider.__acRefLast=now;
        const bp=pitch.ball?.position,sp=slider.position;if(!bp||!sp)return;
        if(Math.hypot(sp.x-bp.x,sp.y-bp.y)>3.4)return;
        const fromBehind=Math.abs((sp.y||0)-(bp.y||0))>.7;
        const speed=slider.velocity?Math.hypot(slider.velocity.x||0,slider.velocity.y||0):0;
        const late=speed>1.2;
        const chance=Math.min(.78,.10+(cfg.foulFrequency||.35)*.30+(fromBehind?.13:0)+(late?.09:0));
        if(Math.random()>chance)return;
        let severity="careless";
        if(late&&fromBehind&&Math.random()<.30)severity="serious";
        else if(late||fromBehind||Math.random()<.28)severity="reckless";
        const card=severity==="serious"?"red":severity==="reckless"?"yellow":null;
        this.record({kind:"foul",team:slider.team===pitch.redTeam?"red":"blue",card,restart:"directFreeKick",player:slider,text:card==="red"?"Serious foul play — red card":card==="yellow"?"Reckless challenge — yellow card":"Foul — direct free kick"});
      },
      record(e){
        const s=this.stats;
        if(e.kind==="foul")s.fouls++;
        if(e.restart==="directFreeKick")s.directFreeKicks++;
        if(e.restart==="indirectFreeKick")s.indirectFreeKicks++;
        if(e.restart==="penalty")s.penalties++;
        if(e.restart==="corner")s.corners++;
        if(e.restart==="droppedBall")s.droppedBalls++;
        if(e.kind==="offside")s.offside++;
        if(e.kind==="handball")s.handballs++;
        const id=e.player?.id??"unknown";if(!s.players[id])s.players[id]={yellow:0,red:false};
        if(e.card==="yellow"){s.players[id].yellow++;s.yellows++;if(s.players[id].yellow>=2){s.secondYellows++;s.reds++;s.players[id].red=true;e={...e,card:"secondYellowRed",text:"Second yellow — red card"};}}
        else if(e.card==="red"){s.reds++;s.players[id].red=true;}
        s.log.unshift({id:Date.now()+Math.random(),at:Math.floor((window.__matchGame?.pitch?.matchTime||0)/60),...e});s.log=s.log.slice(0,30);
        this.incident=e;this.emit();
      },
      requestSubstitution(outId,role){
        if(this.stats.subOpportunities>=3){this.incident={kind:"substitution",text:"No substitution opportunity remaining"};this.emit();return;}
        this.stats.subOpportunities++;this.incident={kind:"substitution",text:"Substitution requested — waiting for a stoppage",outId,role};this.emit();
      }
    };
  }return window.__acReferee;
}

export default function RefereeSystem(){
  const [stats,setStats]=useState(EMPTY),[incident,setIncident]=useState(null),[subOpen,setSubOpen]=useState(false),[players,setPlayers]=useState([]);
  useEffect(()=>{
    const r=getRef();
    const unsub=r.subscribe(next=>{setStats({...next,log:[...next.log],players:{...next.players}});if(r.incident){setIncident(r.incident);clearTimeout(r.timer);r.timer=setTimeout(()=>setIncident(null),2600);}});
    const openSub=()=>{try{const u=window.require?.("users")?.list?.[0],team=u?.team;setPlayers((team?.players||team?.fieldPlayers||[]).filter(Boolean).slice(0,7));}catch{setPlayers([]);}setSubOpen(true);};
    const key=e=>{if(e.key?.toLowerCase()==="m"&&!e.repeat)openSub();};
    window.addEventListener("ac-open-substitutions",openSub);window.addEventListener("keydown",key);
    return()=>{unsub();window.removeEventListener("ac-open-substitutions",openSub);window.removeEventListener("keydown",key);};
  },[]);
  function choose(p){getRef().requestSubstitution(p?.id,p?.role||"M");setSubOpen(false);}
  return <>
    {incident?<div className="ref-incident" role="status"><span className={incident.card==="red"||incident.card==="secondYellowRed"?"ref-card ref-card--red":incident.card==="yellow"?"ref-card ref-card--yellow":"ref-whistle"}/><div><b>{incident.text}</b>{incident.restart?<small>{incident.restart==="directFreeKick"?"Direct free kick":incident.restart==="indirectFreeKick"?"Indirect free kick":incident.restart}</small>:null}</div></div>:null}
    <div className="ref-scoreline" aria-label="Match discipline"><span>F {stats.fouls}</span><span>Y {stats.yellows}</span><span>R {stats.reds}</span></div>
    {subOpen?<div className="sub-overlay" role="dialog" aria-modal="true" aria-label="Substitutions"><div className="sub-card"><div className="sub-head"><b>SUBSTITUTIONS</b><button type="button" onClick={()=>setSubOpen(false)}>×</button></div><p>Choose a player to request a substitution at the next stoppage.</p><div className="sub-list">{players.map((p,i)=><button key={p.id??i} type="button" onClick={()=>choose(p)}><span>{p.role==="G"?"GK":p.role||"Player"}</span><strong>Player {Number(p.id)+1}</strong><small>OUT</small></button>)}</div>{!players.length?<div className="sub-empty">The current engine build does not expose named bench players yet.</div>:null}<div className="sub-rule">Up to 3 substitution opportunities • 5-player allowance • 10s exit rule</div></div></div>:null}
  </>;
}
