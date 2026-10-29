import {moveWithCollisions} from './collision.js';
const ACCEL=2900,FRICTION=3200,GRAVITY=1550;
const approach=(x,to,d)=>x<to?Math.min(to,x+d):Math.max(to,x-d);
export class Player{
  constructor(x,y){this.spawnX=x;this.spawnY=y;this.w=32;this.h=46;this.reset();}
  reset(){this.x=this.spawnX;this.y=this.spawnY;this.vx=0;this.vy=0;this.grounded=true;this.support=null;this.facing=1;this.stepTime=0;this.jumpBuffer=0;this.coyote=.09;}
  update(dt,input,solids,width,character){
    // A moving platform carries the student both horizontally and vertically.
    if(this.grounded&&this.support&&!this.support.broken){
      this.x+=this.support.dx||0;this.y+=this.support.dy||0;
      this.y=this.support.y-this.h;
    }
    const direction=Number(input?.right)-Number(input?.left);
    const speed=340;
    this.vx=approach(this.vx,direction*speed,(direction?ACCEL:FRICTION)*dt);
    if(direction)this.facing=direction;
    if(input?.consumeJump())this.jumpBuffer=.12;
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    this.coyote=this.grounded?.095:Math.max(0,this.coyote-dt);
    if(this.jumpBuffer>0&&this.coyote>0){this.vy=-(character?.power==='jump'?621:580);this.grounded=false;this.support=null;this.coyote=0;this.jumpBuffer=0;}
    this.vy=Math.min(1100,this.vy+GRAVITY*dt);
    this.support=moveWithCollisions(this,solids,dt,width);
    this.grounded=!!this.support;
    this.stepTime=this.grounded&&Math.abs(this.vx)>25?this.stepTime+dt*17:0;
  }
}
