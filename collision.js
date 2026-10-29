export function intersects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
const overlapsX=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x;
/** Axis-separated collision with current positions of moving platforms.
 * Returns the actual supporting object, needed to carry the player along with it.
 */
export function moveWithCollisions(player,solids,dt,worldWidth){
  const oldX=player.x;
  player.x=Math.max(0,Math.min(worldWidth-player.w,player.x+player.vx*dt));
  for(const s of solids){
    if(player.y+player.h<=s.y+1||player.y>=s.y+s.h-1)continue;
    if(player.vx>0&&oldX+player.w<=s.x+1&&player.x+player.w>s.x){player.x=s.x-player.w;player.vx=0;}
    else if(player.vx<0&&oldX>=s.x+s.w-1&&player.x<s.x+s.w){player.x=s.x+s.w;player.vx=0;}
  }
  const oldY=player.y;player.y+=player.vy*dt;
  let support=null;
  for(const s of solids){
    if(!overlapsX(player,s))continue;
    const oldBottom=oldY+player.h,newBottom=player.y+player.h;
    if(player.vy>=0&&oldBottom<=s.y+2&&newBottom>=s.y){
      if(!support||s.y<support.y){player.y=s.y-player.h;player.vy=0;support=s;}
    }else if(player.vy<0&&oldY>=s.y+s.h-2&&player.y<=s.y+s.h){player.y=s.y+s.h;player.vy=0;}
  }
  return support;
}
