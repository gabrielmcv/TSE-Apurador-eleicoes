'use client';
import {useState} from 'react';
import {Copy,Check} from 'lucide-react';
export default function CopyEndpoint(){const [state,setState]=useState('');return <div className="mcp-copy"><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText('https://apuracao-eleicoes-2026.useup.chatgpt.site/mcp');setState('Endereço copiado');}catch{setState('Selecione o endereço para copiar.');}}}>{state==='Endereço copiado'?<Check size={16}/>:<Copy size={16}/>}Copiar endereço</button><span role="status">{state}</span></div>;}
