'use client';
import {roundFetch} from '../lib/round-client';
import {useEffect,useMemo,useState} from 'react';
import AuditChart,{type AuditChartCandidate} from './AuditChart';
import PresidentialMap from './PresidentialMap';
import ArchiveDownload from './ArchiveDownload';
import type {Candidate} from '../lib/tse';

const labels:Record<string,string>={base:'Primeira observação',aumento:'Aumento de votos',reducao:'Redução de votos',candidato_ausente:'Candidato ausente na nova versão',candidato_incluido:'Candidato incluído',situacao_alterada:'Situação alterada',mesmo_idg:'Conteúdo alterado com o mesmo IDG',geracao_anterior:'Fonte retornou geração anterior'};
const fmt=(n:number|null)=>n===null?'Ausente':n.toLocaleString('pt-BR');

export default function Audit({uf,cargo,includeExterior=true,candidates,version,selectedCandidate}:{uf:string;cargo:string;includeExterior?:boolean;candidates:Candidate[];version?:number;selectedCandidate?:string}){
 const [rows,setRows]=useState<any[]>([]),[auditCandidate,setAuditCandidate]=useState(selectedCandidate??''),[selectedCandidates,setSelectedCandidates]=useState<string[]>([]),[alerts,setAlerts]=useState(false),[next,setNext]=useState<number|null>(null),[error,setError]=useState('');
 const url=`/api/auditoria?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&candidate=${encodeURIComponent(auditCandidate)}&alerts=${alerts?'1':'0'}`;
 useEffect(()=>{setSelectedCandidates(selectedCandidate?[selectedCandidate]:[]);setAuditCandidate(selectedCandidate??'');},[uf,cargo,includeExterior,selectedCandidate]);
 useEffect(()=>{let active=true;const controller=new AbortController();async function refresh(){try{const r=await roundFetch(url,{cache:'no-store',signal:controller.signal});const d:any=await r.json();if(!r.ok)throw Error(d.error);if(active){setRows(d.records);setNext(d.next);setError('');}}catch(e){if(active)setError(e instanceof Error?e.message:'Falha na auditoria');}}refresh();return()=>{active=false;controller.abort();};},[url,version]);
 const candidateOptions=useMemo<AuditChartCandidate[]>(()=>Array.from(new Map([...rows.filter(r=>r.candidate).map(r=>({id:String(r.candidate),name:String(r.name)})),...candidates.map(c=>({id:c.id,name:c.name}))].map(c=>[c.id,c])).values()),[rows,candidates]);
 const selectedChartCandidates=useMemo(()=>candidateOptions.filter(candidate=>selectedCandidates.includes(candidate.id)),[candidateOptions,selectedCandidates]);
 function toggleCandidate(candidateId:string){setSelectedCandidates(current=>current.includes(candidateId)?current.filter(id=>id!==candidateId):[...current,candidateId]);}
 async function more(){try{const r=await roundFetch(`${url}&before=${next}`,{cache:'no-store'});const d:any=await r.json();if(!r.ok)throw Error(d.error);setRows(old=>[...old,...d.records.filter((row:any)=>!old.some(o=>o.id===row.id))]);setNext(d.next);}catch(e){setError(String(e));}}
 return <div className="audit-sections">{uf==='BR'&&cargo==='1'&&!includeExterior&&<p className="history-help">Brasil sem exterior: totais e percentuais calculados a partir de 27 versões estaduais arquivadas. As evidências incluem os IDs, hashes e horários de cada fonte.</p>}
  <section className="panel audit-graph-section" aria-labelledby="audit-chart-section-title">
   <div className="panel-title"><div><span className="eyebrow">VISUALIZAÇÃO DO HISTÓRICO</span><h2 id="audit-chart-section-title">Candidatos e gráfico</h2></div></div>
   <div className="audit-controls"><fieldset className="candidate-checklist"><legend>Candidatos no gráfico</legend><div className="candidate-checklist-grid">{candidateOptions.map(candidate=><label key={candidate.id} className="candidate-check"><input type="checkbox" checked={selectedCandidates.includes(candidate.id)} onChange={()=>toggleCandidate(candidate.id)}/><span aria-hidden="true"/><strong>{candidate.name}</strong></label>)}</div></fieldset></div>
   <AuditChart includeExterior={includeExterior} uf={uf} cargo={cargo} candidates={selectedChartCandidates} version={version}/>
  </section>
  {cargo==='1'?<PresidentialMap version={version}/>:null}
  <section className="panel history audit-events-section" aria-labelledby="audit-events-title">
   <div className="panel-title"><div><span className="eyebrow">AUDITORIA PERSISTENTE</span><h2 id="audit-events-title">Quando os totais mudaram</h2></div><a href={url} target="_blank" rel="noreferrer">Consultar JSON</a></div>
   <p className="history-help">Comparações entre versões recebidas desde a ativação desta auditoria. Uma redução é uma alteração observada, não comprovação de fraude. O horário de recebimento é do site; geração e totalização são horários informados pelo TSE. Respostas antigas geram alerta sem substituir o resultado atual.</p>
   <div className="audit-controls"><label>Candidato nos registros<select value={auditCandidate} onChange={event=>setAuditCandidate(event.target.value)}><option value="">Todos os candidatos</option>{candidateOptions.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label><button aria-pressed={alerts} onClick={()=>setAlerts(v=>!v)}>{alerts?'Mostrando alertas':'Mostrar só alertas'}</button></div>
   {error&&<p role="alert" className="history-help">{error}</p>}
   <div className="audit-list">{rows.map(r=><article key={r.id} className={`audit-row ${['reducao','candidato_ausente','mesmo_idg','geracao_anterior'].includes(r.kind)?'audit-warning':''}`}><div><strong>{labels[r.kind]??r.kind}</strong><h3>{r.name}</h3>{r.candidate&&<p>{fmt(r.before_votes)} → {fmt(r.after_votes)} votos{r.delta!==null&&<b> · {r.delta>0?'+':''}{fmt(r.delta)}</b>}</p>}</div><div><p>Recebido: {new Date(r.received).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',fractionalSecondDigits:3})} (Brasília)</p><p>Geração TSE: {r.generated} · IDG {r.idg}</p><details><summary>Consultar evidências e horários</summary><p>Totalização TSE: {r.totalization}</p><p>Salvo (UTC): {r.saved}</p><p>Recebido (UTC): {r.received}</p><p className="hash">SHA-256 anterior: {r.previous_hash??'Sem versão anterior'}<br/>SHA-256 recebido: {r.hash}</p><a href={`/api/historico?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&id=${r.snapshot_id}&download=1`}>Baixar versão recebida</a>{r.previous_id&&<a href={`/api/historico?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&id=${r.previous_id}&download=1`}>Baixar versão anterior</a>}{includeExterior&&<a href={`/api/logs?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&id=${r.log_id}`}>Log da consulta</a>}</details></div></article>)}</div>
   {!rows.length&&!error&&<p className="history-help">Nenhuma alteração registrada para este filtro.</p>}
   {next&&<button className="history-more" onClick={more}>Carregar registros anteriores</button>}
  </section>
  <ArchiveDownload/>
 </div>;
}
