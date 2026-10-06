'use client';
import {useEffect,useRef,useState} from 'react';
const format=(n:number,decimals:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
export default function LiveNumber({value,decimals=0}:{value:number;decimals?:number}){
 const [shown,setShown]=useState(value);const current=useRef(value);
 useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){current.current=value;setShown(value);return;}const from=current.current,start=performance.now();let frame:number;function tick(now:number){const p=Math.min(1,(now-start)/650);const n=from+(value-from)*(1-Math.pow(1-p,3));current.current=n;setShown(n);if(p<1)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[value]);
 return <span aria-label={format(value,decimals)}><span aria-hidden="true">{format(decimals?shown:Math.round(shown),decimals)}</span></span>;
}
