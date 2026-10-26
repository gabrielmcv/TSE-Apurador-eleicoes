'use client';
import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react';
import {initialViewport,zoomViewport,panViewport} from '../../lib/map-viewport';
type Point={x:number;y:number};
const midpoint=(a:Point,b:Point)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export default function useMapViewport(ready:boolean){
 const [view,setView]=useState(initialViewport),svg=useRef<SVGSVGElement|null>(null),points=useRef(new Map<number,Point>()),moved=useRef(false),interacting=useRef(false),origin=useRef<Point|null>(null);
 useEffect(()=>{const target=svg.current;if(!ready||!target)return;function wheel(e:WheelEvent){if(!e.deltaY)return;e.preventDefault();const rect=target!.getBoundingClientRect();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?rect.height:1);setView(v=>zoomViewport(v,Math.exp(-Math.max(-400,Math.min(400,pixels))*.002),{x:e.clientX,y:e.clientY},rect));}target.addEventListener('wheel',wheel,{passive:false});return()=>target.removeEventListener('wheel',wheel);},[ready]);
 const down=useCallback((e:PointerEvent<SVGSVGElement>)=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(!points.current.size){moved.current=false;origin.current={x:e.clientX,y:e.clientY};}points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});interacting.current=true;if(e.pointerType!=='mouse')e.currentTarget.setPointerCapture(e.pointerId);if(points.current.size>1)moved.current=true;},[]);
 const move=useCallback((e:PointerEvent<SVGSVGElement>)=>{const old=points.current.get(e.pointerId);if(!old)return;const before=[...points.current.values()];const point={x:e.clientX,y:e.clientY};points.current.set(e.pointerId,point);const after=[...points.current.values()];const rect=e.currentTarget.getBoundingClientRect();if(before.length>=2){const a=midpoint(before[0],before[1]),b=midpoint(after[0],after[1]);const previousDistance=distance(before[0],before[1]),newDistance=distance(after[0],after[1]);if(previousDistance>0&&newDistance>0)setView(v=>panViewport(zoomViewport(v,newDistance/previousDistance,a,rect),b.x-a.x,b.y-a.y,rect));moved.current=true;}else{const start=origin.current;if(start&&Math.hypot(point.x-start.x,point.y-start.y)>5)moved.current=true;if(moved.current){e.currentTarget.setPointerCapture(e.pointerId);setView(v=>panViewport(v,point.x-old.x,point.y-old.y,rect));}}},[]);
 const up=useCallback((e:PointerEvent<SVGSVGElement>)=>{points.current.delete(e.pointerId);interacting.current=points.current.size>0;const remaining=[...points.current.values()][0];origin.current=remaining??null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);},[]);
 const zoomBy=useCallback((factor:number)=>setView(v=>zoomViewport(v,factor,{x:630,y:605},{left:0,top:0,width:1260,height:1210})),[]);
 const reset=useCallback(()=>{setView(initialViewport);points.current.clear();interacting.current=false;},[]);
 return {...view,svg,moved,interacting,down,move,up,zoomBy,reset};
}
