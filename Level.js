// Deterministic, bounded procedural levels. All mandatory items are on the main traversable route.
export const H=600;
export const GROUND_Y=506;
const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
export function randomFor(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function difficultyOf(n){
  if(n===1)return {name:'ПЕРВАЯ ПАРА',color:'#d5ff50',note:'Тренировка: обычные платформы и первые практические'};
  if(n<=3)return {name:'ЛАБОРАТОРНАЯ',color:'#83b6fa',note:'Появились движущиеся платформы'};
  if(n<=5)return {name:'КОНТРОЛЬНАЯ',color:'#ffca4d',note:'Летающие сессии и перемещающиеся ловушки'};
  if(n<=8)return {name:'ЗАЧЁТНАЯ НЕДЕЛЯ',color:'#ff7b68',note:'Хрупкие платформы, патрули и комбинации ловушек'};
  if(n<=12)return {name:'СЕССИЯ',color:'#b99af7',note:'Длинный маршрут, больше работ и опасностей'};
  return {name:'БЕСКОНЕЧНЫЙ ЭКЗАМЕН',color:'#50dab8',note:'Новые комбинации, максимальная концентрация'};
}
const itemCount=(n)=>({books:Math.min(9,3+Math.floor((n-1)/2)),stars:Math.min(7,2+Math.floor((n-1)/3))});
export function generateLevel(stage,seed=2026){
  const n=Math.max(1,Math.floor(stage)),rng=randomFor((Math.imul(n,7919)+seed)>>>0);
  const pick=(a)=>a[Math.floor(rng()*a.length)];
  const count=Math.min(25,8+Math.floor((n-1)*1.05));
  const requirements=itemCount(n),needed=requirements.books+requirements.stars;
  let right=335,priorY=GROUND_Y;
  const grounds=[{id:'ground-start',x:0,y:GROUND_Y,w:335,h:120,kind:'ground',dx:0,dy:0}];
  const platforms=[];
  for(let i=0;i<count;i++){
    // Even on a difficult level, maximum jump range is far greater than the bound.
    const gap=42+rng()*(Math.min(113,54+n*3)-42);
    const width=Math.round(cap(194-Math.min(44,n*2.3)+rng()*27,145,220));
    const y=Math.round(cap(i===0?466:priorY+(rng()*2-1)*Math.min(54,22+n*3),406,496));
    const p={id:`platform-${i}`,index:i,x:Math.round(right+gap),y,w:width,h:23,kind:'platform',baseX:0,baseY:0,motion:'none',amp:0,speed:0,phase:rng()<.5?0:Math.PI,dx:0,dy:0,fragile:false,crumble:0,broken:false};
    p.baseX=p.x;p.baseY=p.y;
    // Keep every third island stable to guarantee a rest point and prevent trap chains.
    if(n>=2&&i>0&&i%3!==0&&rng()<Math.min(.55,.15+n*.043)){
      p.motion=n>=3 && (i%2===0||rng()<.33)?'vertical':'horizontal';
      p.amp=p.motion==='vertical'?Math.min(25,12+n*.8):Math.min(32,16+n*1.1);
      p.speed=cap(.6+n*.055+rng()*.25,.7,1.7);
    }
    platforms.push(p);priorY=y;right=p.x+p.w;
  }
  const finishX=Math.round(right+60);
  grounds.push({id:'ground-finish',x:finishX,y:GROUND_Y,w:355,h:120,kind:'ground',dx:0,dy:0});
  const worldWidth=finishX+355;
  // Distribute tasks over the entire course. Never put required items on fragile platforms.
  const selected=[];
  for(let j=0;j<needed;j++){
    let idx=cap(Math.round(j*(count-1)/Math.max(1,needed-1)),0,count-1);
    while(selected.includes(idx)&&idx<count-1)idx++;
    while(selected.includes(idx)&&idx>0)idx--;
    selected.push(idx);
  }
  const requiredSet=new Set(selected);
  const collectibles=[];
  selected.forEach((index,j)=>{
    const p=platforms[index];
    const type=j<requirements.books?'book':'star';
    collectibles.push({id:`${type}-${j}`,type,platformId:p.id,offsetX:p.w/2,yOffset:-32,x:p.x+p.w/2,y:p.y-32,taken:false,title:type==='book'?`Практическая №${j+1}`:`Контрольная №${j-requirements.books+1}`});
  });
  const enemies=[],spikes=[],flyers=[],bonuses=[];
  for(let i=0;i<count;i++){
    const p=platforms[i],mandatory=requiredSet.has(i);
    // Collectible islands remain safe from platform-top hazards; flyers may cross nearby.
    if(!mandatory&&n>=4&&rng()<Math.min(.75,.28+n*.024)){
      const type=i%3===0?'patrol':'spike';
      if(type==='spike'){
        const w=33,h=15,span=Math.max(0,(p.w-w)/2-18);
        const phase=rng()*6.28,amp=span*.72,offsetX=p.w/2-w/2;
        spikes.push({id:`spike-${i}`,platformId:p.id,offsetX,x:p.x+offsetX+Math.sin(phase)*amp,y:p.y-h,w,h,moving:true,amp,speed:cap(1+n*.08+rng()*.5,1.2,3),phase});
      }else{
        const phase=rng()*6.28,amp=Math.max(16,(p.w-55)/2),offsetX=p.w/2-13;
        enemies.push({id:`patrol-${i}`,platformId:p.id,offsetX,x:p.x+offsetX+Math.sin(phase)*amp,y:p.y-27,w:26,h:27,amp,speed:cap(1+n*.11+rng()*.5,1,3.3),phase,alive:true});
      }
    }
    if(!mandatory&&n>=6&&i>1&&rng()<Math.min(.53,.12+n*.026))p.fragile=true;
    if(n>=3&&i>=2&&i<count-1&&i%Math.max(2,5-Math.floor(n/5))===1){
      const prev=platforms[i-1],x=(prev.baseX+prev.w+p.baseX)/2;
      const originY=Math.min(prev.baseY,p.baseY)-64,ampX=Math.min(75,25+n*3),ampY=Math.min(30,12+n),phase=rng()*6.28;
      flyers.push({id:`session-${i}`,originX:x,originY,x:x+Math.sin(phase)*ampX,y:originY+Math.cos(phase)*ampY,w:42,h:30,ampX,ampY,speed:cap(.8+n*.06+rng()*.45,.9,2.8),phase});
    }
    // Optional bonuses can appear even on task platforms, safely above the surface.
    if(i>0&&i<count-1&&rng()<Math.min(.58,.25+n*.025)){
      const type=pick(['coffee','scholarship','shield','scholarship']);
      const off=p.w*(mandatory?.24:.45);
      bonuses.push({id:`bonus-${i}`,type,platformId:p.id,offsetX:off,x:p.x+off,y:p.y-78,yOffset:-78,taken:false});
    }
  }
  // Every fifth level is a mini-exam: a much larger flying "Session" guards the last stretch.
  if(n%5===0){
    const ix=Math.min(count-2,Math.max(2,Math.floor(count*.72)));
    const before=platforms[ix-1],after=platforms[ix],originX=(before.baseX+before.w+after.baseX)/2;
    const originY=Math.min(before.baseY,after.baseY)-91,phase=.8,ampX=62,ampY=23;
    flyers.push({id:'session-boss',boss:true,originX,originY,x:originX+Math.sin(phase)*ampX,y:originY+Math.cos(phase)*ampY,w:68,h:44,ampX,ampY,speed:1.15+Math.min(.7,n*.035),phase});
  }
  // Advanced stages always show the key mechanics (otherwise randomness could make them feel identical).
  if(n>=2&&!platforms.some(p=>p.motion==='horizontal')){const p=platforms[1];p.motion='horizontal';p.amp=22;p.speed=1.1;}
  if(n>=3&&!platforms.some(p=>p.motion==='vertical')){const p=platforms[2];p.motion='vertical';p.amp=18;p.speed=1.0;}
  if(n>=4&&!spikes.length){const p=platforms.find((p,i)=>i>0&&!requiredSet.has(i));if(p)spikes.push({id:'spike-required',platformId:p.id,offsetX:p.w/2-16,x:p.x+p.w/2-16,y:p.y-15,w:32,h:15,moving:true,amp:30,speed:1.8,phase:0});}
  if(n>=6&&!platforms.some(p=>p.fragile)){const p=platforms.find((p,i)=>i>1&&!requiredSet.has(i));if(p)p.fragile=true;}
  const gaps=[];
  const all=[...grounds,...platforms].sort((a,b)=>(a.baseX??a.x)-(b.baseX??b.x));
  // Physical fall hazard between fixed *base* platforms; player also loses when beneath canvas.
  for(let i=1;i<all.length;i++){
    const prev=all[i-1],curr=all[i],end=(prev.baseX??prev.x)+prev.w,start=curr.baseX??curr.x;
    if(start-end>10)gaps.push({x:end,y:566,w:start-end,h:34});
  }
  return {number:n,width:worldWidth,grounds,platforms,solids:[...grounds,...platforms],collectibles,bonuses,enemies,spikes,flyers,gaps,finishX,teacherX:finishX+218,requirements,requiredTotal:needed,difficulty:difficultyOf(n),parTime:Math.ceil(worldWidth/230)+12};
}
