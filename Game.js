import {Player} from './Player.js';
import {intersects} from './collision.js';
import {generateLevel,H,GROUND_Y} from './Level.js';
import {CHARACTERS,drawStudent} from './Characters.js';
const CW=1120,KEY='web-quest-campus-v3';
const C={bg:'#181818',panel:'#262626',stroke:'#484848',ink:'#f2f2f2',muted:'#aaa',lime:'#d5ff50',coral:'#ff7b68',violet:'#b99af7',blue:'#83b6fa',mint:'#50dab8',yellow:'#ffca4d'};
const palette=[C.lime,C.mint,C.blue,C.violet,C.coral,C.yellow];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rnd=(a)=>String(a).padStart(2,'0');
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=1;c.strokeStyle=stroke;c.stroke();}}
function tx(c,s,x,y,size=14,col=C.ink,weight=700,align='left'){c.font=`${weight} ${size}px Inter, -apple-system, Arial, sans-serif`;c.textAlign=align;c.fillStyle=col;c.fillText(s,x,y);c.textAlign='left';}
function star(c,x,y,r,color){c.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,k=i%2?.44:1;if(i===0)c.moveTo(x+Math.cos(a)*r*k,y+Math.sin(a)*r*k);else c.lineTo(x+Math.cos(a)*r*k,y+Math.sin(a)*r*k);}c.closePath();c.fillStyle=color;c.fill();}
const gradeFor=(score,total)=>{const p=score/Math.max(1,total);return p>=1?5:p>=.8?4:p>=.6?3:p>=.4?2:1;};
export class Game{
  constructor(canvas,onChange=()=>{}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas 2D недоступен');
    this.onChange=onChange;this.input=null;this.record=this.loadRecord();
    this.stage=1;this.bank=0;this.streak=0;this.character=CHARACTERS.find(x=>x.id===this.record.characterId)||CHARACTERS[0];
    this.player=new Player(90,GROUND_Y-46);this.rafId=null;this.lastTime=null;this.state='ready';this.result=null;this.cameraX=0;
    this.resize=()=>{const box=canvas.getBoundingClientRect();this.viewWidth=clamp(H*(box.width/Math.max(1,box.height)),500,1420);this.cameraX=clamp(this.cameraX,0,Math.max(0,this.level.width-this.viewWidth));this.render();};
    this.buildLevel();
    if(typeof ResizeObserver!=='undefined')this.resizeObserver=new ResizeObserver(this.resize),this.resizeObserver.observe(canvas);
    else window.addEventListener('resize',this.resize);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
    window.addEventListener('blur',()=>this.pause());
    this.resize();this.emit();
  }
  setInput(i){this.input=i;}
  loadRecord(){try{const r=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('web-quest-infinite-v2')||'{}');return {bestLevel:clamp(Math.floor(Number(r.bestLevel)||1),1,999999),bestPoints:Math.max(0,Number(r.bestPoints)||0),bestStreak:Math.max(0,Number(r.bestStreak)||0),characterId:String(r.characterId||'kirill')};}catch{return {bestLevel:1,bestPoints:0,bestStreak:0,characterId:'kirill'};}}
  saveRecord(){this.record.bestLevel=Math.max(this.record.bestLevel,this.stage);this.record.bestPoints=Math.max(this.record.bestPoints,this.bank);this.record.bestStreak=Math.max(this.record.bestStreak,this.streak);this.record.characterId=this.character.id;try{localStorage.setItem(KEY,JSON.stringify(this.record));}catch{/* private browsing / storage unavailable */}}
  get counts(){let books=0,stars=0;for(const item of this.level.collectibles){if(item.taken){if(item.type==='book')books++;else stars++;}}return {books,stars,total:books+stars,required:this.level.requiredTotal,allBooks:this.level.requirements.books,allStars:this.level.requirements.stars};}
  get nextGrade(){return gradeFor(this.counts.total,this.level.requiredTotal);}
  get minToPass(){return Math.ceil(this.level.requiredTotal*.6);}
  buildLevel(){
    this.level=generateLevel(this.stage);this.player.reset();this.cameraX=0;this.levelTime=0;this.hazardClock=0;
    this.result=null;this.popups=[];this.particles=[];this.stomps=0;this.bonusCount=0;this.stagePoints=0;
    this.shields=this.character.power==='shield'?1:0;this.reviveAvailable=this.character.power==='revive';
    this.coffeeTimer=0;this.invincible=0;this.combo=0;this.comboTimer=0;this.checkpoint={x:90,y:GROUND_Y-46};this.lastHudSecond=-1;
    this.emit();this.render();
  }
  chooseCharacter(id){const who=CHARACTERS.find(x=>x.id===id);if(!who)return;
    this.cancelLoop();this.input?.clear();this.character=who;this.state='ready';this.buildLevel();this.saveRecord();this.emit();
  }
  emit(){if(!this.level)return;this.onChange({state:this.state,stage:this.stage,counts:this.counts,record:{...this.record},result:this.result,bank:this.bank,stagePoints:this.stagePoints,streak:this.streak,character:this.character,difficulty:this.level.difficulty,time:this.levelTime,par:this.level.parTime,shields:this.shields,coffee:this.coffeeTimer,combo:this.combo,bonusCount:this.bonusCount,passAt:this.minToPass});}
  cancelLoop(){if(this.rafId!==null)cancelAnimationFrame(this.rafId);this.rafId=null;this.lastTime=null;}
  startLoop(){if(this.rafId===null)this.rafId=requestAnimationFrame(t=>this.frame(t));}
  run(){if(this.state==='running')return;
    if(this.state==='won'){this.stage++;this.state='ready';this.buildLevel();}
    else if(this.state==='failed'){this.state='ready';this.buildLevel();}
    this.input?.clear();this.lastTime=null;this.state='running';this.saveRecord();this.emit();this.startLoop();
  }
  pause(){if(this.state!=='running')return;this.state='paused';this.cancelLoop();this.input?.clear();this.emit();this.render();}
  restart(){this.cancelLoop();this.input?.clear();this.state='ready';this.buildLevel();this.run();}
  startOver(){this.cancelLoop();this.input?.clear();this.stage=1;this.bank=0;this.streak=0;this.state='ready';this.buildLevel();this.run();}
  startFromRecord(){this.cancelLoop();this.input?.clear();this.stage=this.record.bestLevel;this.bank=0;this.streak=0;this.state='ready';this.buildLevel();this.run();}
  centerCameraOnPlayer(){this.cameraX=clamp(this.player.x-this.viewWidth*.34,0,Math.max(0,this.level.width-this.viewWidth));}
  prepareFailureView(reason){const p=this.player;if(reason==='teacher'){p.x=Math.max(90,Math.min(this.level.teacherX-130,this.checkpoint.x));p.y=GROUND_Y-46;}else{p.x=this.checkpoint.x;p.y=this.checkpoint.y;}p.vx=0;p.vy=0;p.grounded=true;p.support=null;p.coyote=.095;this.centerCameraOnPlayer();}
  finish(reason){if(this.state!=='running')return;
    const score=this.counts.total,total=this.level.requiredTotal,grade=reason==='teacher'?gradeFor(score,total):null;
    const passed=reason==='teacher'&&grade>=3;
    let points=0;
    if(passed){points=this.stagePoints+score*85+this.stomps*60+Math.max(0,Math.floor((this.level.parTime-this.levelTime)*12))+(grade===5?250:0);
      this.bank+=points;this.streak=grade===5?this.streak+1:0;this.record.bestLevel=Math.max(this.record.bestLevel,this.stage+1);
    }else this.streak=0;
    this.result={grade,score,total,reason,passed,points,bonuses:this.bonusCount,seconds:Math.floor(this.levelTime)};
    this.state=passed?'won':'failed';if(!passed)this.prepareFailureView(reason);this.saveRecord();this.input?.clear();this.emit();this.render();
  }
  frame(t){this.rafId=null;if(this.state!=='running')return;const dt=this.lastTime===null?0:clamp((t-this.lastTime)/1000,0,.03);this.lastTime=t;
    this.update(dt);this.render();if(this.state==='running')this.startLoop();}
  popup(x,y,label,color=C.lime){this.popups.push({x,y,label,color,life:1.15});}
  spark(x,y,color){for(let i=0;i<10;i++){const a=i*Math.PI/5;this.particles.push({x,y,vx:Math.cos(a)*(30+i%3*18),vy:Math.sin(a)*(24+i%4*12),life:.5+Math.random()*.25,color});}}
  addPoints(amount){this.stagePoints+=amount;}
  collect(item){item.taken=true;this.combo=this.comboTimer>0?Math.min(5,this.combo+1):1;this.comboTimer=5;
    let points=30+(this.combo-1)*15;if(item.type==='book'&&this.character.power==='books')points=Math.round(points*1.3);
    this.addPoints(points);this.popup(item.x,item.y-40,`+${points} / ${item.type==='book'?'ПРАКТИКА':'КОНТРОЛЬНАЯ'}`,item.type==='book'?C.coral:C.lime);
    this.spark(item.x,item.y,item.type==='book'?C.coral:C.lime);
    if(item.type==='star')this.checkpoint={x:Math.max(0,item.x-23),y:Math.min(GROUND_Y-46,item.y-14)};
    this.emit();
  }
  collectBonus(b){b.taken=true;this.bonusCount++;
    const extra=this.character.power==='bonuses'?50:0;
    let message='';
    if(b.type==='coffee'){this.coffeeTimer=this.character.power==='coffee'?12:6;message='☕ КОФЕ / ЗАМЕДЛЕНИЕ';}
    else if(b.type==='shield'){this.shields=Math.min(2,this.shields+1);message='◈ АВТОСОХРАНЕНИЕ / ЩИТ';}
    else message='✦ СТИПЕНДИЯ / +150';
    const amount=(b.type==='scholarship'?150:55)+extra;this.addPoints(amount);this.popup(b.x,b.y-25,`+${amount} / ${message}`,C.mint);this.spark(b.x,b.y,C.mint);this.emit();
  }
  hit(reason){if(this.invincible>0||this.state!=='running')return;
    if(reason!=='fall'&&this.shields>0){this.shields--;this.invincible=1.6;this.player.vy=-290;this.player.grounded=false;this.player.support=null;
      this.popup(this.player.x+12,this.player.y-12,'ЩИТ СПАС ОТ ПЕРЕСДАЧИ',C.mint);this.emit();return;}
    if(this.reviveAvailable){this.reviveAvailable=false;const p=this.player;p.x=this.checkpoint.x;p.y=this.checkpoint.y;p.vx=0;p.vy=0;p.grounded=false;p.support=null;p.coyote=0;this.invincible=2.2;
      this.popup(p.x+15,p.y-20,'ВОССТАНОВЛЕН / ЕЩЁ ОДИН ШАНС',C.blue);this.emit();return;}
    this.finish(reason);
  }
  update(dt){
    if(!dt)return;
    const lv=this.level,p=this.player;this.levelTime+=dt;this.coffeeTimer=Math.max(0,this.coffeeTimer-dt);
    this.invincible=Math.max(0,this.invincible-dt);this.comboTimer=Math.max(0,this.comboTimer-dt);if(this.comboTimer===0)this.combo=0;
    this.hazardClock+=dt*(this.coffeeTimer>0?.48:1);
    // Moving platforms first, then all objects attached to them.
    for(const s of lv.platforms){s.dx=0;s.dy=0;if(s.broken)continue;
      const prevX=s.x,prevY=s.y;
      if(s.motion==='horizontal')s.x=s.baseX+Math.sin(this.levelTime*s.speed+s.phase)*s.amp;
      else if(s.motion==='vertical')s.y=s.baseY+Math.sin(this.levelTime*s.speed+s.phase)*s.amp;
      s.dx=s.x-prevX;s.dy=s.y-prevY;
    }
    const index=new Map(lv.platforms.map(s=>[s.id,s]));
    for(const item of [...lv.collectibles,...lv.bonuses]){const s=index.get(item.platformId);if(!s)continue;item.x=s.x+item.offsetX;item.y=s.y+item.yOffset;}
    for(const e of lv.enemies){const s=index.get(e.platformId);if(!s)continue;e.x=s.x+e.offsetX+Math.sin(this.hazardClock*e.speed+e.phase)*e.amp;e.y=s.y-e.h;}
    for(const s of lv.spikes){const p=index.get(s.platformId);if(!p)continue;s.x=p.x+s.offsetX+(s.moving?Math.sin(this.hazardClock*s.speed+s.phase)*s.amp:0);s.y=p.y-s.h;}
    for(const f of lv.flyers){f.x=f.originX+Math.sin(this.hazardClock*f.speed+f.phase)*f.ampX;f.y=f.originY+Math.cos(this.hazardClock*f.speed*.9+f.phase)*f.ampY;}
    // Breakable platforms count contact time. They are intentionally never required for item collection.
    for(const s of lv.platforms){if(!s.fragile||s.broken)continue;
      if(p.grounded&&p.support===s)s.crumble+=dt;
      if(s.crumble>.88){s.broken=true;if(p.support===s){p.support=null;p.grounded=false;}this.popup(s.x+s.w/2,s.y-20,'РАБОТА НЕ СОХРАНЕНА',C.coral);}
    }
    const prevBottom=p.y+p.h;
    p.update(dt,this.input,lv.solids.filter(s=>!s.broken),lv.width,this.character);
    for(const i of lv.collectibles){if(i.taken)continue;
      if(intersects(p,{x:i.x-21,y:i.y-22,w:42,h:44}))this.collect(i);
    }
    for(const b of lv.bonuses){if(b.taken)continue;
      if(intersects(p,{x:b.x-18,y:b.y-18,w:36,h:36}))this.collectBonus(b);
    }
    if(this.invincible<=0){
      for(const e of lv.enemies){if(!e.alive||!intersects(p,e))continue;
        if(p.vy>90&&prevBottom<=e.y+12){e.alive=false;p.vy=-425;p.grounded=false;p.support=null;this.stomps++;this.addPoints(65);this.popup(e.x+13,e.y-21,'+65 / ДЕДЛАЙН ЗАКРЫТ',C.mint);}
        else{this.hit('enemy');if(this.state!=='running')return;break;}}
      for(const s of lv.spikes){if(intersects(p,{x:s.x+3,y:s.y+3,w:s.w-6,h:s.h-3})){this.hit('spikes');if(this.state!=='running')return;break;}}
      for(const f of lv.flyers){if(intersects(p,{x:f.x+3,y:f.y+3,w:f.w-6,h:f.h-6})){this.hit('session');if(this.state!=='running')return;break;}}
    }
    if(p.y>H+25){this.hit('fall');if(this.state!=='running')return;}
    // Finish is only reachable from the final ground segment.
    if(intersects(p,{x:lv.teacherX-39,y:GROUND_Y-114,w:88,h:114})){this.finish('teacher');return;}
    for(const pop of this.popups){pop.life-=dt;pop.y-=dt*32;}this.popups=this.popups.filter(x=>x.life>0);
    for(const s of this.particles){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=dt*55;}this.particles=this.particles.filter(x=>x.life>0);
    const target=clamp(p.x-this.viewWidth*.34,0,Math.max(0,lv.width-this.viewWidth));this.cameraX+=(target-this.cameraX)*Math.min(1,dt*8);
    if(Math.floor(this.levelTime)!==this.lastHudSecond){this.lastHudSecond=Math.floor(this.levelTime);this.emit();}
  }
  visible(x,w){return x+w>this.cameraX-60&&x<this.cameraX+this.viewWidth+60;}
  render(){if(!this.ctx||!this.level||!this.viewWidth)return;const c=this.ctx,V=this.viewWidth;
    c.setTransform(CW/V,0,0,1,0,0);c.clearRect(0,0,V,H);this.drawBackground(c,V);
    c.save();c.translate(-Math.round(this.cameraX),0);
    this.drawGaps(c);this.drawPlatforms(c);this.drawSpikes(c);this.drawItems(c);this.drawFlyers(c);this.drawEnemies(c);this.drawTeacher(c);this.drawPlayer(c);this.drawFX(c);c.restore();this.drawHud(c,V);
  }
  drawBackground(c,V){c.fillStyle=C.bg;c.fillRect(0,0,V,H);
    c.strokeStyle='#303030';c.lineWidth=1;c.beginPath();for(let x=-(this.cameraX*.12)%54;x<V;x+=54){c.moveTo(x,0);c.lineTo(x,H);}for(let y=0;y<H;y+=54){c.moveTo(0,y);c.lineTo(V,y);}c.stroke();
    const offset=-(this.cameraX*.2)%700;
    for(let i=-1;i<=V/700+1;i++){const x=offset+i*700;tx(c,'WEB',x+28,293,180,'#242424',900);tx(c,'/ DESIGN',x+40,356,44,'#272727',900);
      rr(c,x+454,377,152,140,12,'#202020','#2d2d2d');rr(c,x+472,406,52,45,7,'#292929');rr(c,x+536,406,52,45,7,'#292929');tx(c,'ЛЕКЦИЯ',x+474,476,10,'#484848',900);}
    rr(c,0,544,V,2,0,'#3a3a3a');tx(c,'//  СПБГУПТД — ПРАКТИЧЕСКИЕ РАБОТЫ В РЕЖИМЕ ВЫЖИВАНИЯ',18,580,10,'#555',800);
  }
  drawGaps(c){for(const g of this.level.gaps){if(!this.visible(g.x,g.w))continue;
    rr(c,g.x,g.y,g.w,g.h,0,'#552c29');rr(c,g.x,g.y,g.w,5,0,C.coral);
    for(let x=g.x+6;x<g.x+g.w-10;x+=26){c.fillStyle='#ad5447';c.beginPath();c.moveTo(x,g.y+23);c.lineTo(x+10,g.y+9);c.lineTo(x+20,g.y+23);c.fill();}
  }}
  drawPlatforms(c){for(const s of this.level.solids){if(s.broken||!this.visible(s.x,s.w))continue;
    const ground=s.kind==='ground';
    rr(c,s.x,s.y,s.w,s.h,ground?5:7,ground?'#2a2a2a':'#303030','#575757');
    const top=s.fragile?C.violet:ground?C.lime:s.motion==='vertical'?C.mint:s.motion==='horizontal'?C.blue:palette[(s.index||0)%palette.length];
    rr(c,s.x,s.y,s.w,ground?8:8,ground?3:4,top);
    if(ground){for(let x=s.x+22;x<s.x+s.w-9;x+=48){rr(c,x,s.y+29,23,4,2,'#404040');rr(c,x,s.y+49,23,4,2,'#404040');}
      tx(c,'СПБГУПТД / КАМПУС',s.x+16,s.y+81,10,'#727272',800);}
    else{rr(c,s.x+12,s.y+14,Math.max(20,s.w-24),2,0,'#494949');
      const label=s.fragile?'ХРУПКАЯ':s.motion==='vertical'?'ЛИФТ ↑↓':s.motion==='horizontal'?'ПОДВИЖНАЯ ↔':'ПЛАТФОРМА';
      tx(c,`${rnd(s.index+1)} / ${label}`,s.x+11,s.y+37,9,'#b4b4b4',800);
      if(s.motion!=='none'){const cx=s.baseX+s.w/2,cy=s.baseY;
        c.save();c.strokeStyle='#777777';c.setLineDash([4,5]);c.beginPath();if(s.motion==='horizontal'){c.moveTo(cx-s.amp,cy+48);c.lineTo(cx+s.amp,cy+48);}else{c.moveTo(cx,cy-s.amp-13);c.lineTo(cx,cy+s.amp+27);}c.stroke();c.restore();}
      if(s.fragile&&s.crumble>0){rr(c,s.x,s.y-7,s.w*clamp(s.crumble/.88,0,1),4,2,C.coral);}
    }
  }}
  drawSpikes(c){for(const s of this.level.spikes){if(!this.visible(s.x,s.w))continue;
    rr(c,s.x,s.y+12,s.w,3,1,C.coral);
    for(let i=0;i<4;i++){const x=s.x+i*s.w/4;c.fillStyle=C.coral;c.beginPath();c.moveTo(x,s.y+14);c.lineTo(x+s.w/8,s.y);c.lineTo(x+s.w/4,s.y+14);c.fill();}
    if(s.moving)tx(c,'↔',s.x+s.w/2,s.y-7,13,C.coral,900,'center');
  }}
  drawItems(c){for(const b of [...this.level.collectibles,...this.level.bonuses]){if(b.taken||!this.visible(b.x-30,60))continue;
    const y=b.y+Math.sin(this.levelTime*3+b.x*.05)*4,bonus=['coffee','shield','scholarship'].includes(b.type),color=b.type==='book'?C.coral:b.type==='star'?C.lime:C.mint;
    c.save();c.shadowColor=color;c.shadowBlur=18;c.beginPath();c.arc(b.x,y,22,0,Math.PI*2);c.fillStyle=color+'22';c.fill();c.shadowBlur=0;
    if(b.type==='book'){rr(c,b.x-12,y-14,24,28,3,C.coral);rr(c,b.x-12,y-14,6,28,1,'#bf554b');for(let k=0;k<3;k++)rr(c,b.x-2,y-7+k*8,10,2,1,'#272727');}
    else if(b.type==='star'){star(c,b.x,y,17,C.lime);star(c,b.x,y,6,'#202020');}
    else if(b.type==='coffee'){rr(c,b.x-11,y-10,19,23,4,C.mint);c.strokeStyle=C.mint;c.lineWidth=3;c.beginPath();c.arc(b.x+9,y-1,7,-Math.PI/2,Math.PI/2);c.stroke();tx(c,'☕',b.x-1,y+5,15,'#161616',900,'center');}
    else if(b.type==='shield'){rr(c,b.x-14,y-14,28,29,7,C.blue);tx(c,'◈',b.x,y+6,23,'#171717',900,'center');}
    else{star(c,b.x,y,15,C.yellow);tx(c,'₽',b.x,y+6,13,'#1c1c1c',900,'center');}
    c.restore();
  }}
  drawFlyers(c){for(const f of this.level.flyers){if(!this.visible(f.x,f.w))continue;
    c.save();c.shadowBlur=f.boss?29:19;c.shadowColor=f.boss?'#ffca4d99':'#b99af77d';rr(c,f.x,f.y,f.w,f.h,7,f.boss?C.yellow:C.violet);c.shadowBlur=0;
    c.fillStyle=f.boss?'#bd8548':'#70568e';c.beginPath();c.moveTo(f.x+2,f.y+9);c.lineTo(f.x-17,f.y);c.lineTo(f.x-9,f.y+20);c.fill();c.beginPath();c.moveTo(f.x+f.w-2,f.y+9);c.lineTo(f.x+f.w+17,f.y);c.lineTo(f.x+f.w+9,f.y+20);c.fill();
    tx(c,f.boss?'EXAM':'С',f.x+f.w/2,f.y+(f.boss?30:23),f.boss?18:25,'#23172e',900,'center');
    rr(c,f.x-17,f.y-24,f.w+34,17,4,'#292331',f.boss?C.yellow:'#9c77be');tx(c,f.boss?'БОСС / СЕССИЯ':'СЕССИЯ',f.x+f.w/2,f.y-12,10,f.boss?C.yellow:C.violet,900,'center');c.restore();
  }}
  drawEnemies(c){for(const e of this.level.enemies){if(!e.alive||!this.visible(e.x,e.w))continue;
    c.save();c.shadowBlur=15;c.shadowColor='#ff7b6870';rr(c,e.x,e.y,e.w,e.h,5,C.coral);c.shadowBlur=0;
    rr(c,e.x+5,e.y+7,4,5,1,C.bg);rr(c,e.x+17,e.y+7,4,5,1,C.bg);tx(c,'!',e.x+e.w/2,e.y-9,13,C.coral,900,'center');c.restore();
  }}
  drawTeacher(c){const x=this.level.teacherX,y=GROUND_Y;if(!this.visible(x-130,260))return;
    rr(c,x-96,y-180,196,35,8,C.lime);tx(c,'ФИНИШ / АТТЕСТАЦИЯ',x+2,y-157,13,'#171717',900,'center');
    rr(c,x-12,y-68,36,60,7,'#dedede');rr(c,x-22,y-88,50,44,7,'#414141');rr(c,x-13,y-74,34,22,3,C.lime);tx(c,'5?',x+3,y-57,18,'#272727',900,'center');
    rr(c,x-6,y-120,34,35,14,'#e9b68e');rr(c,x-7,y-122,35,12,[8,8,1,1],'#202020');rr(c,x+2,y-107,3,3,2,'#1a1a1a');rr(c,x+17,y-107,3,3,2,'#1a1a1a');
    rr(c,x-30,y-11,68,11,3,'#616161');rr(c,x-112,y+13,235,27,6,C.panel,C.stroke);tx(c,'КОКОРИН ЕВГЕНИЙ СЕРГЕЕВИЧ',x+5,y+31,10,C.ink,900,'center');
  }
  drawPlayer(c){const p=this.player,step=p.grounded&&Math.abs(p.vx)>24?Math.sin(p.stepTime)*4:0;
    if(this.invincible>0&&Math.floor(this.levelTime*14)%2===0)return;
    drawStudent(c,this.character,Math.round(p.x+p.w/2),Math.round(p.y+p.h),{facing:p.facing,step});
    if(this.shields>0){c.save();c.strokeStyle=C.blue;c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.ellipse(p.x+16,p.y+21,27,35,0,0,Math.PI*2);c.stroke();c.restore();}
    if(this.coffeeTimer>0){tx(c,'☕',p.x+16,p.y-12,18,C.mint,900,'center');}
  }
  drawFX(c){for(const pop of this.popups){if(pop.life<=0||!this.visible(pop.x-145,290))continue;c.save();c.globalAlpha=clamp(pop.life,0,1);
    const w=Math.min(254,Math.max(123,pop.label.length*6.6));rr(c,pop.x-w/2,pop.y-17,w,30,6,'#252525',pop.color);tx(c,pop.label,pop.x,pop.y+3,10,pop.color,900,'center');c.restore();}
    for(const p of this.particles){c.save();c.globalAlpha=Math.min(1,p.life*1.8);rr(c,p.x-2,p.y-2,4,4,1,p.color);c.restore();}
  }
  drawHud(c,V){rr(c,16,15,174,36,7,'#242424','#484848');tx(c,`УРОВЕНЬ ${rnd(this.stage)}`,29,38,13,C.ink,900);
    rr(c,V-206,15,190,36,7,'#242424','#484848');tx(c,`РАБОТЫ ${this.counts.total} / ${this.level.requiredTotal}`,V-192,38,12,C.lime,900);
    rr(c,V/2-43,15,86,36,7,'#242424','#484848');const time=Math.floor(this.levelTime);tx(c,`${rnd(Math.floor(time/60))}:${rnd(time%60)}`,V/2,39,14,C.ink,900,'center');
    if(this.shields||this.coffeeTimer){const s=`${this.shields?'◈ ЩИТ ×'+this.shields:''} ${this.coffeeTimer?'☕ '+Math.ceil(this.coffeeTimer)+'с':''}`.trim();rr(c,V/2-85,57,170,27,5,'#2a2a2a','#555');tx(c,s,V/2,75,11,C.mint,900,'center');}
    const progress=clamp(this.player.x/Math.max(1,this.level.teacherX),0,1);rr(c,16,H-30,V-32,5,2,'#494949');rr(c,16,H-30,(V-32)*progress,5,2,C.lime);rr(c,16+(V-32)*progress-5,H-34,10,12,3,C.coral);
  }
}
