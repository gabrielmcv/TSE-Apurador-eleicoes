'use client';
import {createContext,useContext} from 'react';
const Round=createContext<1|2>(1);
export const useRound=()=>useContext(Round);
export default function RoundProvider({children}:{children:React.ReactNode}){return <Round.Provider value={2}><div onClickCapture={event=>{const anchor=(event.target as HTMLElement).closest('a');if(!anchor)return;const url=new URL(anchor.href,window.location.href);if(url.origin===window.location.origin&&url.pathname.startsWith('/api/')){url.searchParams.set('eleicao','2026-2');anchor.href=url.href;}}}>{children}</div></Round.Provider>;}
