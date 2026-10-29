import {Game} from './Game.js';
import {Input} from './input.js';
import {CHARACTERS,drawStudent} from './Characters.js';
const id=k=>document.getElementById(k);
const keys=['gameCanvas','bookCount','starCount','bankCount','bestLevel','difficultyDot','difficultyText','levelDisplay','overlay','overlayKicker','overlayVisual','overlayTitle','overlayMessage','overlayFact1','overlayFact2','overlayButton','startButton','startButtonText','pauseButton','pauseButtonText','restartButton','resetButton','recordButton','statusLine','runTimer','streakCount','stagePoints','bonusCounter','shieldCount','passCount','characterGrid','selectedStudentName','selectedStudentPerk','characterHelp'];
const d=Object.fromEntries(keys.map(k=>[k,id(k)]));
const pad=n=>String(n).padStart(2,'0');
let pinnedScrollY=window.scrollY||0, previousState='ready';
const pinScroll=()=>{pinnedScrollY=window.scrollY||0;};
const restoreScroll=()=>requestAnimationFrame(()=>window.scrollTo({top:pinnedScrollY,left:0,behavior:'auto'}));
try{history.scrollRestoration='manual';}catch{}
function refresh({state,stage,counts,record,result,bank,stagePoints,streak,character,difficulty,time,par,shields,coffee,bonusCount,passAt}){
  d.bookCount.innerHTML=`${counts.books} <small>/ ${counts.allBooks}</small>`;
  d.starCount.innerHTML=`${counts.stars} <small>/ ${counts.allStars}</small>`;
  d.bankCount.textContent=bank.toLocaleString('ru-RU');
  d.bestLevel.textContent=pad(record.bestLevel);
  d.difficultyDot.style.background=difficulty.color;
  d.difficultyText.textContent=difficulty.name;
  d.levelDisplay.textContent=`УРОВЕНЬ ${pad(stage)}`;
  d.runTimer.textContent=`${pad(Math.floor(time/60))}:${pad(Math.floor(time%60))}`;
  d.streakCount.textContent=streak;
  d.stagePoints.textContent=stagePoints.toLocaleString('ru-RU');
  d.bonusCounter.textContent=bonusCount;
  d.shieldCount.textContent=shields+(coffee?` · КОФЕ ${Math.ceil(coffee)}с`:'' );
  d.passCount.textContent=`${counts.total} / ${passAt}`;
  d.selectedStudentName.textContent=character.name;
  d.selectedStudentPerk.textContent=character.perk;
  d.overlay.hidden=state==='running';
  d.startButton.disabled=state==='running';
  d.pauseButton.disabled=!['running','paused'].includes(state);
  d.pauseButtonText.textContent=state==='paused'?'Продолжить':'Пауза';
  d.recordButton.hidden=record.bestLevel<=1;
  let kicker=`СЕМЕСТР ${pad(stage)} / ${difficulty.name}`;
  let visual=String(stage),title='Выходи на пару!';
  let message=`${character.name} — ${character.title.toLowerCase()}. ${difficulty.note}. На уровне ${counts.required} обязательных работ: для зачёта собери минимум ${passAt}, для пятёрки — все.`;
  let fact1=`${counts.required} РАБОТ`,fact2=`≥${passAt} ДЛЯ ЗАЧЁТА`;
  let action='Начать уровень ↗',startText='Старт';
  let status=`Уровень ${stage} · ${counts.total}/${counts.required} работ · ${character.name}`;
  if(state==='ready')status=`Готов к старту · ${character.name}`;
  if(state==='paused'){
    kicker='БОЛЬШАЯ ПЕРЕМЕНА / ПАУЗА';visual='Ⅱ';title='Продолжим после пары?';
    message=`Студент: ${character.name}. Время остановилось; все предметы и положение сохранены. Вернуться можно в любой момент.`;
    fact1=`РАБОТЫ ${counts.total}/${counts.required}`;fact2=`ВРЕМЯ ${Math.floor(time)} СЕК.`;
    action='Продолжить ↗';startText='Продолжить';status='Пауза';
  }
  if(state==='won'){
    kicker=`АТТЕСТАЦИЯ / УРОВЕНЬ ${pad(stage)} СДАН`;visual=String(result.grade);
    title=result.grade===5?'Пятёрка в зачётке!':`Семестр закрыт на ${result.grade}`;
    message=`Кокорин Евгений Сергеевич поставил ${result.grade}. Собрано ${result.score} из ${result.total} работ, найдено бонусов: ${result.bonuses}. +${result.points} очков. Впереди новый маршрут и новые угрозы.`;
    fact1=`+${result.points} ОЧКОВ`;fact2=`СЕРИЯ ПЯТЁРОК ${streak}`;
    action=`Следующий уровень ${pad(stage+1)} ↗`;startText='Следующий';status=`Оценка ${result.grade} · Уровень ${stage+1} открыт`;
  }
  if(state==='failed'){
    kicker=`ПЕРЕСДАЧА / УРОВЕНЬ ${pad(stage)}`;
    visual=result?.reason==='teacher'?String(result.grade):'!';
    title=result?.reason==='teacher'?`Незачёт: оценка ${result.grade}`:'Сессия не пощадила';
    const causes={enemy:'Ходячий дедлайн',spikes:'Движущиеся колючки',session:'Летающая сессия',fall:'Пропасть'};
    message=result?.reason==='teacher'?`Преподаватель увидел ${result.score}/${result.total} работ. Нужно минимум ${passAt}. Переиграй уровень и собери больше.`:`${causes[result?.reason]||'Опасность'} прервала попытку. Собрано ${result.score}/${result.total}. Можно сразу пересдать уровень, не теряя уже пройденных.`;
    fact1=`ПРОЙДЕНО ${stage-1} УРОВНЕЙ`;fact2='ПЕРЕСДАЧА БЕЗ ШТРАФА';
    action='Пересдать уровень ↻';startText='Пересдать';status='Не зачтено · Пересдача';
  }
  d.overlayKicker.textContent=kicker;d.overlayVisual.textContent=visual;
  d.overlayTitle.textContent=title;d.overlayMessage.textContent=message;
  d.overlayFact1.textContent=fact1;d.overlayFact2.textContent=fact2;
  d.overlayButton.textContent=action;d.startButtonText.textContent=startText;d.statusLine.textContent=status;
  if(previousState==='running'&&state!=='running')restoreScroll();
  previousState=state;
  document.querySelectorAll('[data-student-id]').forEach(node=>{
    const selected=node.dataset.studentId===character.id;
    node.classList.toggle('is-selected',selected);
    node.setAttribute('aria-pressed',String(selected));
  });
}
const game=new Game(d.gameCanvas,refresh);
const input=new Input(()=>game.state==='running');game.setInput(input);
function renderCards(){
  d.characterGrid.innerHTML=CHARACTERS.map((student,index)=>`
    <button type="button" class="student-card ${game.character.id===student.id?'is-selected':''}" data-student-id="${student.id}" aria-pressed="${game.character.id===student.id}">
      <span class="student-top"><span>${pad(index+1)} / СТУДЕНТ</span><span class="student-pick">ВЫБРАН ✓</span></span>
      <span class="student-main"><span class="student-portrait" style="--student-accent:${student.coat}"><canvas width="96" height="115" aria-hidden="true"></canvas></span>
      <span class="student-info"><strong>${student.name}</strong><em>${student.title}</em><span class="student-story">${student.story}</span></span></span>
      <span class="student-perk"><span>СПОСОБНОСТЬ</span><b>${student.perk}</b></span>
    </button>`).join('');
  document.querySelectorAll('[data-student-id]').forEach((btn,index)=>{
    const canvas=btn.querySelector('canvas'),ctx=canvas.getContext('2d');
    drawStudent(ctx,CHARACTERS[index],49,107,{scale:1.6});
    btn.addEventListener('click',()=>{
      if(game.character.id===btn.dataset.studentId)return;
      pinScroll();
      game.chooseCharacter(btn.dataset.studentId);
      d.characterHelp.textContent=`Выбран: ${game.character.name}. При смене студента текущая попытка начинается заново.`;
      d.gameCanvas.focus({preventScroll:true});
    });
  });
}
renderCards();game.emit();
const focus=()=>d.gameCanvas.focus({preventScroll:true});
const start=()=>{pinScroll();game.run();focus();};
d.startButton.addEventListener('click',start);d.overlayButton.addEventListener('click',start);
d.pauseButton.addEventListener('click',()=>{pinScroll();if(game.state==='paused')start();else game.pause();});
d.restartButton.addEventListener('click',()=>{pinScroll();game.restart();focus();});
d.resetButton.addEventListener('click',()=>{pinScroll();game.startOver();focus();});
d.recordButton.addEventListener('click',()=>{pinScroll();game.startFromRecord();focus();});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&game.state==='running'){e.preventDefault();game.pause();}});
if(new URLSearchParams(location.search).has('test'))window.__webQuest=game;

['pointerdown','touchstart','mousedown'].forEach(evt=>{d.gameCanvas.addEventListener(evt,pinScroll,{passive:true});document.querySelector('.toolbar')?.addEventListener(evt,pinScroll,{passive:true});document.querySelector('.touch-controls')?.addEventListener(evt,pinScroll,{passive:true});});
