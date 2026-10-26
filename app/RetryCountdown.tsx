'use client';
import {useEffect,useState} from 'react';
export default function RetryCountdown({retryAt}:{retryAt?:number|null}){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{setNow(Date.now());if(!retryAt)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[retryAt]);
 if(!retryAt)return null;
 const seconds=Math.max(0,Math.ceil((retryAt-now)/1000));
 return <span className="retry-countdown" role="timer" aria-label="Tempo até a próxima tentativa">{seconds?<>Nova tentativa em <strong>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong></>:<>Aguardando a próxima consulta automática…</>}</span>;
}
