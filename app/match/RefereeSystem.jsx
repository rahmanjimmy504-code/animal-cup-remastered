"use client";

import { useEffect, useState } from "react";

const EMPTY={fouls:0,yellows:0,reds:0,secondYellows:0,directFreeKicks:0,indirectFreeKicks:0,penalties:0,corners:0,droppedBalls:0,offside:0,handballs:0,dogso:0,substitutions:0,subOpportunities:0,log:[],players:{}};

function teamDirection(pitch,team){
  const gk=(team?.allPlayers||team?.players||[]).find(p=>p?.isGoalkeeper);
  const gx=gk?.home?.x ?? gk?.position?.x;
  const cx=pitch?.center?.x ?? 0;
  return gx < cx ? 1 : -1;
}
function goalX(pitch,team){
  const dir=teamDirection(pitch,team);
  return (pitch?.center?.x??0) + dir * Math.max(1,(pitch?.width||32)*.5);
}
function inOwnPenalty(pitch,team,pos){
  if(!pitch||!team||!pos)return false;
  const gx=goalX(pitch,team),dir=teamDirection(pitch,team);
  const dx=(pos.x-gx)*dir, halfH=(pitch.height||18)*.24;
  return dx>=0 && dx<Math.max(2.5,(pitch.width||32)*.16) && Math.abs(pos.y-(pitch.center?.y??0))<halfH;
}
function inOppHalf(pitch,team,pos){return ((pos.x-(pitch.center?.x??0))*teamDirection(pitch,team))>0;}
function distanceToGoal(pitch,team,pos){return Math.abs(goalX(pitch,team)-(pos?.x??0));}
function getPlayers(team){return (team?.allPlayers||team?.players||team?.fieldPlayers||[]).filter(Boolean);}
function getRef(){
  if(!window.__acReferee){
    window.__acReferee={
      stats:JSON.parse(JSON.stringify(EMPTY)),listeners:new Set(),incident:null,restartExemptUntil:0,lastPassAt:0,lastBall:null,lastHandballAt:0,
      emit(){for(const fn of this.listeners)fn(this.stats);},
      subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);},
      reset(){this.stats=JSON.parse(JSON.stringify(EMPTY));this.incident=null;this.restartExemptUntil=0;this.lastBall=null;this.emit();},
      markRestart(type){this.restartExemptUntil=performance.now()+2500;this.lastRestart=type;},
      onPass(game,passer,receiver){
        const pitch=game?.pitch;if(!pitch||!receiver?.team||!receiver.position)return;
        if(performance.now()<this.restartExemptUntil)return;
        const team=receiver.team, ball=pitch.ball?.position;
        if(!ball||!inOppHalf(pitch,team,receiver.position))return;
        const dir=teamDirection(pitch,team);
        const opponents=getPlayers(team===pitch.redTeam?pitch.blueTeam:pitch.redTeam);
        const defenders=opponents.filter(p=>p.position).sort((a,b)=>((b.position.x-(pitch.center?.x??0))*dir)-((a.position.x-(pitch.center?.x??0))*dir));
        if(defenders.length<2)return;
        const secondLast=defenders[1];
        const receiverAhead=((receiver.position.x-secondLast.position.x)*dir)>0.18;
        const ballAhead=((receiver.position.x-ball.x)*dir)>0.12;
        if(!receiverAhead||!ballAhead)return;
        this.record({kind:"offside",team:team===pitch.redTeam?"red":"blue",restart:"indirectFreeKick",player:receiver,text:"Offside — indirect free kick"});
      },
      tick(game){
        const pitch=game?.pitch;if(!pitch?.ball?.position)return;
        const ball=pitch.ball, bp=ball.position, now=performance.now();
        const holder=ball.owner||ball.inHands;
        if(holder?.isGoalkeeper){
          const ownArea=inOwnPenalty(pitch,holder.team,holder.position||bp);
          if(!ownArea){
            this.record({kind:"handball",team:holder.team===pitch.redTeam?"red":"blue",restart:"indirectFreeKick",player:holder,text:"Goalkeeper handling outside the penalty area — indirect free kick"});
            this.lastHandballAt=now;
          }
        }
        const prev=this.lastBall;
        const speed=ball.velocity?Math.hypot(ball.velocity.x||0,ball.velocity.y||0):0;
        if(prev && !holder && now-this.lastHandballAt>900 && speed>1.1){
          const pv=prev.vx*prev.vx+prev.vy*prev.vy;
          const cv=(ball.velocity?.x||0)**2+(ball.velocity?.y||0)**2;
          const dot=prev.vx*(ball.velocity?.x||0)+prev.vy*(ball.velocity?.y||0);
          if(pv>1 && cv>1 && dot<Math.sqrt(pv*cv)*.15){
            let closest=null,dist=Infinity;
            for(const team of [pitch.redTeam,pitch.blueTeam]){
              for(const p of getPlayers(team)){
                if(p.isGoalkeeper||!p.position)continue;
                const d=Math.hypot(p.position.x-bp.x,p.position.y-bp.y);
                if(d<dist){dist=d;closest=p;}
              }
            }
            if(closest&&dist<.48){
              const defending=closest.team;
              const ownArea=inOwnPenalty(pitch,defending,closest.position);
              const opponentTeam=defending===pitch.redTeam?pitch.blueTeam:pitch.redTeam;
              const attackers=getPlayers(opponentTeam).filter(p=>p.position);
              const nearestAttacker=attackers.sort((a,b)=>Math.hypot(a.position.x-closest.position.x,a.position.y-closest.position.y)-Math.hypot(b.position.x-closest.position.x,b.position.y-closest.position.y))[0];
              const dogso=nearestAttacker&&distanceToGoal(pitch,opponentTeam,nearestAttacker.position)<Math.max(7,(pitch.width||32)*.24)&&inOppHalf(pitch,opponentTeam,nearestAttacker.position);
              const restart=ownArea?"penaltyKick":"directFreeKick";
              const card=dogso?(ownArea?"yellow":"red"):null;
              this.record({kind:"handball",team:defending===pitch.redTeam?"red":"blue",restart,card,player:closest,dogso,text:dogso?(card==="red"?"Handball DOGSO — red card":"Handball DOGSO — penalty and yellow card"):(ownArea?"Handball — penalty kick":"Handball — direct free kick")});
              this.lastHandballAt=now;
            }
          }
        }
        this.lastBall={x:bp.x,y:bp.y,vx:ball.velocity?.x||0,vy:ball.velocity?.y||0};
      },
      onSlideHit(game,slider){
        const pitch=game?.pitch;if(!pitch||!slider?.team)return;
        const cfg=window.__acGameplay?.config||{},now=performance.now();
        if(slider.__acRefLast&&now-slider.__acRefLast<850)return;slider.__acRefLast=now;
        const bp=pitch.ball?.position,sp=slider.position;if(!bp||!sp)return;
        if(Math.hypot(sp.x-bp.x,sp.y-bp.y)>3.4)return;
        const fromBehind=Math.abs((sp.y||0)-(bp.y||0))>.7;
        const speed=slider.velocity?Math.hypot(slider.velocity.x||0,slider.velocity.y||0):0;
        const late=speed>1.2;
        const attackers=getPlayers(slider.team===pitch.redTeam?pitch.blueTeam:pitch.redTeam).filter(p=>p.position);
        const victim=attackers.sort((a,b)=>Math.hypot(a.position.x-sp.x,a.position.y-sp.y)-Math.hypot(b.position.x-sp.x,b.position.y-sp.y))[0];
        const dogso=!!(victim&&Math.hypot(victim.position.x-sp.x,victim.position.y-sp.y)<1.8&&distanceToGoal(pitch,victim.team,victim.position)<Math.max(7,(pitch.width||32)*.24));
        const chance=Math.min(.78,.10+(cfg.foulFrequency||.35)*.30+(fromBehind?.13:0)+(late?.09:0));
        if(Math.random()>chance)return;
        let severity="careless";
        if(late&&fromBehind&&Math.random()<.30)severity="serious";
        else if(late||fromBehind||Math.random()<.28)severity="reckless";
        const card=dogso?(inOwnPenalty(pitch,slider.team,sp)?(severity==="careless"?null:"yellow"):"red"):severity==="serious"?"red":severity==="reckless"?"yellow":null;
        this.record({kind:"foul",team:slider.team===pitch.redTeam?"red":"blue",card,restart:dogso&&inOwnPenalty(pitch,slider.team,sp)?"penaltyKick":"directFreeKick",player:slider,dogso,text:dogso?(card==="red"?"DOGSO — red card":card==="yellow"?"DOGSO — penalty and yellow card":"DOGSO foul — penalty kick"):card==="red"?"Serious foul play — red card":card==="yellow"?"Reckless challenge — yellow card":"Foul — direct free kick"});
      },
      record(e){
        const s=this.stats;
        if(e.kind==="foul")s.fouls++;
        if(e.restart==="directFreeKick")s.directFreeKicks++;
        if(e.restart==="indirectFreeKick")s.indirectFreeKicks++;
        if(e.restart==="penaltyKick")s.penalties++;
        if(e.restart==="corner")s.corners++;
        if(e.restart==="droppedBall")s.droppedBalls++;
        if(e.kind==="offside")s.offside++;
        if(e.kind==="handball")s.handballs++;
        if(e.dogso)s.dogso++;
        const id=e.player?.id??"unknown";if(!s.players[id])s.players[id]={yellow:0,red:false};
        if(e.card==="yellow"){s.players[id].yellow++;s.yellows++;if(s.players[id].yellow>=2){s.secondYellows++;s.reds++;s.players[id].red=true;e={...e,card:"secondYellowRed",text:"Second yellow — red card"};}}
        else if(e.card==="red"){s.reds++;s.players[id].red=true;try{const p=window.__matchGame;if(e.player&&p?.removePlayer)p.removePlayer(e.player);}catch{}}
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
    const tick=()=>{try{if(window.__matchGame?.pitch?.matchStarted&&!window.__matchGame.pitch.paused)getRef().tick(window.__matchGame);}catch{}};
    const timer=setInterval(tick,100);
    window.addEventListener("ac-open-substitutions",openSub);window.addEventListener("keydown",key);
    return()=>{unsub();clearInterval(timer);window.removeEventListener("ac-open-substitutions",openSub);window.removeEventListener("keydown",key);};
  },[]);
  function choose(p){getRef().requestSubstitution(p?.id,p?.role||"M");setSubOpen(false);}
  return <>
    {incident?<div className="ref-incident" role="status"><span className={incident.card==="red"||incident.card==="secondYellowRed"?"ref-card ref-card--red":incident.card==="yellow"?"ref-card ref-card--yellow":"ref-whistle"}/><div><b>{incident.text}</b>{incident.restart?<small>{incident.restart==="directFreeKick"?"Direct free kick":incident.restart==="indirectFreeKick"?"Indirect free kick":incident.restart==="penaltyKick"?"Penalty kick":incident.restart}</small>:null}</div></div>:null}
    <div className="ref-scoreline" aria-label="Match discipline"><span>F {stats.fouls}</span><span>Y {stats.yellows}</span><span>R {stats.reds}</span><span>O {stats.offside}</span><span>H {stats.handballs}</span></div>
    {subOpen?<div className="sub-overlay" role="dialog" aria-modal="true" aria-label="Substitutions"><div className="sub-card"><div className="sub-head"><b>SUBSTITUTIONS</b><button type="button" onClick={()=>setSubOpen(false)}>×</button></div><p>Choose a player to request a substitution at the next stoppage.</p><div className="sub-list">{players.map((p,i)=><button key={p.id??i} type="button" onClick={()=>choose(p)}><span>{p.role==="G"?"GK":p.role||"Player"}</span><strong>Player {Number(p.id)+1}</strong><small>OUT</small></button>)}</div>{!players.length?<div className="sub-empty">The current engine build does not expose named bench players yet.</div>:null}<div className="sub-rule">Up to 3 substitution opportunities • 5-player allowance • 10s exit rule</div></div></div>:null}
  </>;
}
