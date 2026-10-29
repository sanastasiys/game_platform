// Все персонажи вымышлены. Портреты и игровые спрайты — оригинальная Canvas-графика.
// Спрайты рисуются послойно: волосы сзади, одежда, шея и лицо, затем только чёлка.
// Поэтому длинные волосы никогда не обрамляют подбородок «бородой».
export const CHARACTERS = [
  {id:'kirill',name:'Кирилл Королёв',title:'Троечник-спринтер',story:'Сдаёт практические в 23:59. Главное — успеть до закрытия Moodle.',perk:'Практики дают +30% очков',power:'books',outfit:'hoodie',skin:'#e5b08a',hair:'#252020',coat:'#ff7b68',pants:'#6488af',shirt:'#fee8a2',hairStyle:'messy',accessory:'headphones'},
  {id:'polina',name:'Полина Белова',title:'Королева пересдач',story:'Знает расписание пересдач лучше, чем расписание пар.',perk:'Один защитный щит в начале уровня',power:'shield',outfit:'jacket',skin:'#efc2a2',hair:'#935445',coat:'#b99af7',pants:'#42425e',shirt:'#f6e3ee',hairStyle:'ponytail',accessory:'glasses'},
  {id:'artem',name:'Артём Орлов',title:'Восстановлен приказом',story:'Уже был отчислен. Вернулся доказать, что HTML всё-таки выучил.',perk:'Один возврат к последней контрольной',power:'revive',outfit:'varsity',skin:'#c8916d',hair:'#171c24',coat:'#83b6fa',pants:'#d7d7d7',shirt:'#272e42',hairStyle:'short',accessory:'cap'},
  {id:'vika',name:'Виктория Смирнова',title:'Староста потока',story:'У неё есть таблица всех дедлайнов, кроме собственных.',perk:'Бонусы дают дополнительно +50 очков',power:'bonuses',outfit:'blazer',skin:'#dba27d',hair:'#4f3029',coat:'#d5ff50',pants:'#3e4650',shirt:'#fbfbfb',hairStyle:'bun',accessory:'glasses'},
  {id:'danya',name:'Данила Волков',title:'Вечный второкурсник',story:'Второй год изучает одно и то же, зато прыгает дальше всех.',perk:'Прыжок на 7% выше',power:'jump',outfit:'sport',skin:'#edc39c',hair:'#a5723c',coat:'#50dab8',pants:'#363d4b',shirt:'#1c2833',hairStyle:'spiky',accessory:'none'},
  {id:'masha',name:'Мария Ким',title:'Легенда общежития',story:'Пережила три сессии без сна. Кофемашина знает её по имени.',perk:'Эффект кофе длится вдвое дольше',power:'coffee',outfit:'cardigan',skin:'#e8b99b',hair:'#1a1a23',coat:'#ffca4d',pants:'#66558a',shirt:'#dce9fb',hairStyle:'bob',accessory:'scarf'}
];

function block(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();c.fill();}
function stroke(c,points,color,width=1.5){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.stroke();}

function backHair(c,p){
  const h=p.hair;
  if(p.hairStyle==='ponytail'){
    // Хвост расположен снаружи контура головы и НЕ соединяется под подбородком.
    ellipse(c,15,-56,7,7,h); // основание высокого хвоста
    c.beginPath();
    c.moveTo(16,-57);c.bezierCurveTo(29,-61,30,-50,26,-44);
    c.bezierCurveTo(28,-40,24,-36,18,-35);
    c.bezierCurveTo(22,-42,18,-49,14,-51);c.closePath();c.fillStyle=h;c.fill();
    stroke(c,[[25,-49],[24,-43],[21,-40]],'#b77868',1.1);
    block(c,13,-58,5,5,2,'#f0b4d4'); // резинка
  }else if(p.hairStyle==='bun'){
    ellipse(c,9,-62,8,8,h);
    ellipse(c,10,-63,4,4,'#674337');
    block(c,-12,-55,24,11,6,h);
  }else if(p.hairStyle==='bob'){
    // Каре: боковые пряди только СБОКУ головы, до линии челюсти.
    block(c,-15,-57,30,17,7,h);
    block(c,-15,-49,6,14,3,h);
    block(c,9,-49,6,14,3,h);
    block(c,-15,-38,6,4,2,h);
    block(c,9,-38,6,4,2,h);
  }
}

function clothes(c,p,step){
  // Штанины и обувь. Лицо всегда будет выше воротника.
  block(c,-11+step,-16,9,14,2,p.pants);
  block(c,2-step,-16,9,14,2,p.pants);
  block(c,-12+step,-4,12,5,2,'#15191e');
  block(c,2-step,-4,12,5,2,'#15191e');
  block(c,-13,-38,26,26,6,p.coat);
  block(c,-19,-36,8,24,4,p.coat);
  block(c,11,-36,8,24,4,p.coat);
  block(c,-20,-26,6,9,3,p.skin);
  block(c,14,-26,6,9,3,p.skin);
  // Рюкзак — слева и ЗА рукой, а не рядом с причёской.
  block(c,-21,-32,7,19,3,'#3a4153');
  block(c,-19,-26,3,7,1,'#242a37');

  if(p.outfit==='jacket'){
    polygon(c,[[-7,-37],[0,-31],[6,-37]],p.shirt);
    block(c,-4,-31,8,13,2,p.shirt);
    stroke(c,[[-10,-36],[-4,-30],[-5,-17]],'#d8c6ff',1.5);
    stroke(c,[[10,-36],[4,-30],[5,-17]],'#946fd9',1.5);
    block(c,-8,-18,16,3,1,'#9d7de5');
  }else if(p.outfit==='blazer'){
    block(c,-5,-35,10,19,2,p.shirt);
    polygon(c,[[-12,-36],[-3,-30],[-8,-26]],'#e8ffa2');
    polygon(c,[[12,-36],[3,-30],[8,-26]],'#a7dd30');
    block(c,-1,-29,2,11,1,'#292f31');
    block(c,7,-19,3,3,1,'#263119');
    // Конспект старосты.
    block(c,15,-30,7,12,2,'#b99af7');
    block(c,17,-27,3,2,1,'#f4f4f4');
  }else if(p.outfit==='cardigan'){
    block(c,-6,-36,12,22,2,p.shirt);
    block(c,-6,-35,4,19,1,'#ffd97e');
    block(c,2,-35,4,19,1,'#e2a931');
    block(c,0,-30,2,2,1,'#ab7b25');
    block(c,0,-22,2,2,1,'#ab7b25');
  }else if(p.outfit==='varsity'){
    block(c,-5,-35,10,21,1,p.shirt);
    block(c,-12,-35,2,21,1,'#e6f1ff');
    block(c,10,-35,2,21,1,'#e6f1ff');
  }else if(p.outfit==='sport'){
    block(c,-3,-37,6,24,1,p.shirt);
    block(c,-10,-21,20,2,1,'#e0fff2');
  }else{
    block(c,-7,-34,14,7,3,'#ffd1b0');
    block(c,-4,-24,8,2,1,'#ffd1b0');
    block(c,-7,-17,14,2,1,'#c95c54');
  }
  block(c,-4,-39,8,6,2,p.skin); // шея находится перед воротником
}

function head(c,p){
  // Естественная линия подбородка: никакого тёмного контура под лицом.
  ellipse(c,-11,-44,2.6,4,p.skin);
  ellipse(c,11,-44,2.6,4,p.skin);
  block(c,-11,-56,22,21,[9,9,8,8],p.skin);
  // Блики на щеках, нос и небольшой рот.
  ellipse(c,-7,-40,2.2,1.1,'#f5afa2');
  ellipse(c,7,-40,2.2,1.1,'#f5afa2');
  block(c,-.5,-43,1.4,2.2,1,'#bd8669');
  stroke(c,[[-2,-38.7],[0,-38],[2,-38.7]],'#a95b59',1);
}

function frontHair(c,p){
  const h=p.hair;
  if(p.hairStyle==='ponytail'){
    // Чёлка только на верхней четверти лица. Боковые волосы не доходят до подбородка.
    block(c,-12,-60,24,8,[8,8,2,2],h);
    polygon(c,[[-12,-54],[3,-55],[-7,-50],[-12,-48]],h);
    block(c,-12,-54,3,6,1,h);
  }else if(p.hairStyle==='bun'){
    block(c,-12,-59,24,8,[8,8,2,2],h);
    polygon(c,[[2,-54],[12,-54],[10,-49],[6,-50]],h);
    stroke(c,[[-8,-55],[0,-53]],'#765044',1);
  }else if(p.hairStyle==='bob'){
    block(c,-12,-59,24,9,[8,8,2,2],h);
    polygon(c,[[-12,-54],[5,-55],[-6,-49],[-12,-49]],h);
    block(c,8,-52,4,7,2,h);
    // Контрастная маленькая заколка вместо массивной пряди.
    block(c,7,-53,5,2,1,'#ffca4d');
  }else if(p.hairStyle==='messy'){
    block(c,-12,-58,24,8,[8,8,1,1],h);
    block(c,-10,-61,8,6,2,h);
    block(c,1,-63,7,7,2,h);
  }else if(p.hairStyle==='spiky'){
    block(c,-12,-58,24,8,[8,8,1,1],h);
    for(const x of [-8,0,8])polygon(c,[[x-4,-55],[x,-65],[x+5,-55]],h);
  }else{
    block(c,-12,-58,24,9,[8,8,1,1],h);
  }
}

function features(c,p){
  // Выразительные глаза. Очки — тонкая геометрическая оправа.
  block(c,-6,-45.5,2,2.8,1,'#25232a');
  block(c,4,-45.5,2,2.8,1,'#25232a');
  if(p.accessory==='glasses'){
    c.strokeStyle='#29232d';c.lineWidth=1.1;
    c.strokeRect(-9,-48,8,6);c.strokeRect(1,-48,8,6);
    stroke(c,[[-1,-46],[1,-46]],'#29232d',1.1);
    stroke(c,[[-9,-46],[-12,-47]],'#29232d',1);
    stroke(c,[[9,-46],[12,-47]],'#29232d',1);
  }
  if(p.accessory==='headphones'){
    c.strokeStyle='#25232a';c.lineWidth=2.5;
    c.beginPath();c.arc(0,-47,13,Math.PI*1.1,Math.PI*1.9);c.stroke();
    block(c,-14,-48,3,9,1,'#282a33');
    block(c,11,-48,3,9,1,'#282a33');
  }else if(p.accessory==='cap'){
    block(c,-12,-60,24,7,3,'#1f2633');
    block(c,6,-56,13,4,2,'#353d4f');
  }else if(p.accessory==='scarf'){
    // Шарф на ГРУДИ, не на подбородке.
    block(c,-8,-35,17,4,2,'#d3f2ff');
    block(c,7,-34,4,11,2,'#e8faff');
  }
}

export function drawStudent(c,p,x,feet,{scale=1,facing=1,step=0,opacity=1}={}){
  if(!p)return;
  c.save();c.translate(x,feet);c.scale(scale*facing,scale);c.globalAlpha*=opacity;
  ellipse(c,0,1,17,3.5,'#00000044');
  backHair(c,p);
  clothes(c,p,step);
  head(c,p);
  frontHair(c,p);
  features(c,p);
  c.restore();
}
