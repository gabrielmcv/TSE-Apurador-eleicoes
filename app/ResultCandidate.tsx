'use client';
import CandidateStatus from './CandidateStatus';
import {candidateStatus} from '../lib/candidate-status';
import {History,ArrowUpRight} from 'lucide-react';
import type {Candidate} from '../lib/tse';
import CandidateAvatar from './CandidateAvatar';
const number=(n:number)=>n.toLocaleString('pt-BR');
export default function ResultCandidate({candidate:c,rank,leader,uf,cargo,delta,includeExterior=true}:{candidate:Candidate;rank:number;leader:boolean;uf:string;cargo:string;delta?:number;includeExterior?:boolean}){
 const placed=c.percent>0;
 return <article className={`result-candidate ${leader?'result-leader':'result-compact'}`}><div className="result-candidate-heading">{leader?<CandidateAvatar candidate={c}/>:null}<div className="result-identity">{placed?<span className="result-position">{rank}º lugar</span>:null}<h3>{c.name}</h3><p>{c.number} · {c.party}</p></div></div><div className="result-count"><strong>{c.percent.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}<span>%</span></strong><span>{number(c.votes)} votos</span></div><div className="vote-bar"><i style={{width:`${Math.min(100,Math.max(0,c.percent))}%`}}/></div><div className="result-status"><CandidateStatus candidate={c}/>{[candidateStatus(c)?'':c.status,c.destination].filter(value=>value&&!/^v[aá]lido$/i.test(value.trim())).join(' · ')}</div>{delta!=null&&delta!==0?<p className={`vote-change ${delta<0?'negative':''}`}>{delta>0?'+':''}{number(delta)} votos na última versão</p>:null}<a className="timeline-button" href={`/painel?aba=auditoria&uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&candidate=${encodeURIComponent(c.id)}`}><History size={14} aria-hidden="true"/><span>Ver histórico de alterações</span><ArrowUpRight size={14} aria-hidden="true"/></a></article>;
}
