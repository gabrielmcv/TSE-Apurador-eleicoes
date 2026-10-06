'use client';
import {roundFetch} from '../lib/round-client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {SeriesPoint} from '../lib/audit-series';

export type AuditChartCandidate={id:string;name:string};
type CandidateSeries={candidate:AuditChartCandidate;points:SeriesPoint[];next:number|null;completedAt?:string|null;lastVoteChangeAt?:string|null;lastObservedAt?:string|null;timelineEndAt?:string|null;finalized?:boolean;error?:string};
type Metric='votes'|'percent';
type ChartPoint=SeriesPoint&{baseline?:boolean;previousVotes:number;previousPercent:number};
type EvidencePoint={candidateName:string;point:ChartPoint};
type ChartRow={time:number;[key:string]:number|string|ChartPoint|null};

const colors=['#b29300','#1f7a68','#7b68b7','#c65d48','#3e7cb1','#7b8791','#b26b2d','#5f8f3e'];
const hour=60*60_000;
const time=(timestamp:number)=>new Date(timestamp).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
const date=(value:string)=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',fractionalSecondDigits:3});
const valueKey=(candidateId:string)=>`value_${candidateId}`;
const pointKey=(candidateId:string)=>`point_${candidateId}`;
const candidateFromKey=(dataKey:string)=>dataKey.replace(/^value_/,'');
const formatPercent=(value:number|null)=>value==null?'Ausente':`${value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;
const deltaClass=(value:number)=>value>0?'positive':value<0?'negative':'neutral';
const signed=(value:number,metric:Metric)=>`${value>0?'+':''}${metric==='votes'?`${value.toLocaleString('pt-BR')} votos`:`${value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} p.p.`}`;

function Evidence({active,payload,metric}:{active?:boolean;payload?:readonly {dataKey?:string|number;value?:number|null;payload?:ChartRow;name?:string}[];metric:Metric}){
 if(!active||!payload?.length)return null;
 const items=(payload.map(item=>{const key=String(item.dataKey??''),point=item.payload?.[pointKey(candidateFromKey(key))] as ChartPoint|undefined;return point?{label:String(item.name??point.name??'Candidato ausente nesta versão'),point,value:item.value}:null;}).filter(Boolean) as {label:string;point:ChartPoint;value?:number|null}[]).sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity));
 if(!items.length)return null;
 return <div className="chart-tooltip">{items.map(item=>{const delta=metric==='votes'?(item.point.votes??0)-item.point.previousVotes:(item.point.percent??0)-item.point.previousPercent;return <div key={`${item.label}-${item.point.id}-${item.point.received}`} className="chart-tooltip-item"><strong>{item.label}</strong><p>{metric==='votes'?`${item.point.votes?.toLocaleString('pt-BR')??'Ausente'} votos`:formatPercent(item.point.percent)}</p><small className={`chart-delta ${deltaClass(delta)}`}>{signed(delta,metric)}</small><small className="chart-complement">{metric==='votes'?formatPercent(item.point.percent):`${item.point.votes?.toLocaleString('pt-BR')??'Ausente'} votos`}</small>{item.point.baseline?<small>Ponto inicial da apuração · 17:00</small>:<><small>Captura: {date(item.point.received)} · Brasília</small><small>Geração TSE: {item.point.generated}</small><small>Versão #{item.point.id} · IDG {item.point.idg}</small></>}</div>;})}</div>;
}

async function loadSeries(uf:string,cargo:string,includeExterior:boolean,candidate:AuditChartCandidate,before?:number,signal?:AbortSignal){const suffix=before?`&before=${before}`:'';const response=await roundFetch(`/api/auditoria/serie?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&candidate=${encodeURIComponent(candidate.id)}${suffix}`,{cache:'no-store',signal});const data=await response.json() as {points:SeriesPoint[];next:number|null;completedAt?:string|null;lastVoteChangeAt?:string|null;lastObservedAt?:string|null;timelineEndAt?:string|null;finalized?:boolean;error?:string};if(!response.ok)throw Error(data.error);return {candidate,points:data.points,next:data.next,completedAt:data.completedAt,lastVoteChangeAt:data.lastVoteChangeAt,lastObservedAt:data.lastObservedAt,timelineEndAt:data.timelineEndAt,finalized:data.finalized};}

function electionStart(points:SeriesPoint[]){
 const first=new Date(points[0].received);
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(first);
 const part=(type:string)=>Number(parts.find(item=>item.type===type)?.value);
 return Date.UTC(part('year'),part('month')-1,part('day'),20);
}

function withMetricChanges(points:SeriesPoint[],metric:Metric,endTime:number|null):ChartPoint[]{
 if(!points.length)return [];
 const sorted=[...points].filter(point=>Number.isFinite(Date.parse(point.received))&&(endTime==null||Date.parse(point.received)<=endTime)).sort((a,b)=>Date.parse(a.received)-Date.parse(b.received)||a.id-b.id);
 if(!sorted.length)return [];
 const origin=electionStart(sorted);
 const baselineDate=new Date(origin).toISOString();
 const result:ChartPoint[]=[{...sorted[0],id:0,idg:'inicio',received:baselineDate,generated:'',totalization:'0',generation_ms:0,hash:'',votes:0,percent:0,name:sorted[0].name,baseline:true,previousVotes:0,previousPercent:0}];
 let previousVotes=0,previousPercent=0;
 for(const point of sorted){
  if(Date.parse(point.received)<origin)continue;
  const currentVotes=point.votes??previousVotes,currentPercent=point.percent??previousPercent;
  const changed=metric==='votes'?point.votes!=null&&currentVotes!==previousVotes:point.percent!=null&&currentPercent!==previousPercent;
  if(changed)result.push({...point,previousVotes,previousPercent});
  previousVotes=currentVotes;
  previousPercent=currentPercent;
 }
 const finalPoint=sorted.at(-1);if(finalPoint&&result.at(-1)?.id!==finalPoint.id&&endTime!=null)result.push({...finalPoint,previousVotes,previousPercent});
 return result;
}

export default function AuditChart({uf,cargo,includeExterior=true,candidates,version}:{uf:string;cargo:string;includeExterior?:boolean;candidates:AuditChartCandidate[];version?:number}){
 const [series,setSeries]=useState<CandidateSeries[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(false),[evidence,setEvidence]=useState<EvidencePoint|null>(null),[metric,setMetric]=useState<Metric>('votes');
 const olderRequest=useRef<AbortController|null>(null);
 const candidateKey=candidates.map(candidate=>candidate.id).join(',');

 useEffect(()=>{setSeries([]);setEvidence(null);setError('');olderRequest.current?.abort();return()=>olderRequest.current?.abort();},[uf,cargo,includeExterior,candidateKey]);
 useEffect(()=>{if(!candidates.length)return;let active=true;const controller=new AbortController();setLoading(true);Promise.all(candidates.map(async candidate=>{try{return await loadSeries(uf,cargo,includeExterior,candidate,undefined,controller.signal);}catch(e){return {candidate,points:[],next:null,error:e instanceof Error?e.message:'Falha ao consultar gráfico.'};}})).then((results:CandidateSeries[])=>{if(active){setSeries(results);setError(results.find(result=>result.error)?.error??'');}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;controller.abort();};},[uf,cargo,includeExterior,candidateKey,version,candidates]);

 const completionTime=useMemo(()=>series.map(item=>Date.parse(item.timelineEndAt??'')).filter(Number.isFinite).reduce<number|null>((earliest,timestamp)=>earliest==null||timestamp>earliest?timestamp:earliest,null),[series]);
 const changeSeries=useMemo(()=>series.map(item=>({...item,points:withMetricChanges(item.points,metric,completionTime)})),[series,completionTime,metric]);
 const values=useMemo(()=>{const rows=new Map<number,ChartRow>();for(const item of changeSeries){for(const point of item.points){const timestamp=Date.parse(point.received);const row=rows.get(timestamp)??{time:timestamp};row[valueKey(item.candidate.id)]=metric==='votes'?point.votes:point.percent;row[pointKey(item.candidate.id)]=point;rows.set(timestamp,row);}}return Array.from(rows.values()).sort((a,b)=>a.time-b.time);},[changeSeries,metric]);
 const period=values.length?{start:new Date(values[0].time).toISOString(),end:new Date(completionTime??values[values.length-1].time).toISOString()}:null;
 const rawPoints=series.reduce((total,item)=>total+item.points.length,0);
 const displayPoints=changeSeries.reduce((total,item)=>total+item.points.length,0);
 const domain=values.length?[values[0].time,completionTime??Math.max(values[values.length-1].time,values[0].time+hour)]:[0,1];
 const ticks=values.length?Array.from({length:Math.floor((domain[1]-domain[0])/hour)+1},(_,index)=>domain[0]+index*hour):[];if(values.length&&ticks.at(-1)!==domain[1]){if(ticks.length>1&&domain[1]-ticks[ticks.length-1]<hour*.65)ticks.pop();ticks.push(domain[1]);}
 const hasOlder=series.some(item=>item.next!=null);

 async function older(){const targets=series.filter(item=>item.next!=null);if(!targets.length)return;setLoading(true);const controller=new AbortController();olderRequest.current=controller;try{const results=await Promise.all(targets.map(async item=>loadSeries(uf,cargo,includeExterior,item.candidate,item.next??undefined,controller.signal)));if(controller.signal.aborted)return;setSeries(current=>current.map(item=>{const update=results.find(result=>result.candidate.id===item.candidate.id);if(!update)return item;const points=Array.from(new Map([...update.points,...item.points].map(point=>[point.id,point])).values()).sort((a,b)=>Date.parse(a.received)-Date.parse(b.received)||a.id-b.id);return {...item,points,next:update.next,error:undefined};}));setError('');}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Falha ao consultar versões.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 function selectEvidence(state:any){const item=state?.activePayload?.find((payload:any)=>payload.value!=null);if(!item)return;const key=String(item.dataKey??''),candidateId=candidateFromKey(key),point=item.payload?.[pointKey(candidateId)] as ChartPoint|undefined,candidate=series.find(seriesItem=>seriesItem.candidate.id===candidateId)?.candidate;if(point&&candidate)setEvidence({candidateName:candidate.name,point});}
 const evidenceDelta=evidence?(metric==='votes'?(evidence.point.votes??0)-evidence.point.previousVotes:(evidence.point.percent??0)-evidence.point.previousPercent):0;

 return <div className="audit-chart"><div className="chart-heading"><div><span className="eyebrow">DADOS ARQUIVADOS · HORÁRIO DE BRASÍLIA</span><h2>Evolução de {metric==='votes'?'votos':'porcentagem'}</h2></div><div className="chart-switch" aria-label="Métrica do gráfico"><button type="button" aria-pressed={metric==='votes'} onClick={()=>{setMetric('votes');setEvidence(null);}}>Votos</button><button type="button" aria-pressed={metric==='percent'} onClick={()=>{setMetric('percent');setEvidence(null);}}>Porcentagem</button></div></div><p className="chart-help">Marque um ou mais candidatos acima. Cada linha começa em zero às 17h e registra todas as alterações de {metric==='votes'?'votos':'porcentagem'}.</p>{error?<p role="alert" className="alert">{error}</p>:null}{!candidates.length?<div className="chart-empty">Escolha ao menos um candidato para consultar o histórico.</div>:!rawPoints?<div className="chart-empty">{loading?'Consultando versões arquivadas...':'Nenhuma versão arquivada para esta seleção.'}</div>:<><div className="chart-canvas" role="img" aria-label={`Histórico de ${metric==='votes'?'votos':'porcentagem'} de ${candidates.length.toLocaleString('pt-BR')} candidato${candidates.length===1?'':'s'}, com marcadores de hora a partir das 17h`}><ResponsiveContainer width="100%" height="100%"><LineChart data={values} margin={{top:12,right:18,bottom:12,left:8}} onClick={selectEvidence}><CartesianGrid stroke="#edf0f2" vertical={false}/><XAxis dataKey="time" type="number" domain={domain} ticks={ticks} tickFormatter={time} minTickGap={35} allowDataOverflow stroke="#87919b" tick={{fontSize:12}}/><YAxis width={72} domain={metric==='votes'?[0,'auto']:[0,100]} reversed={false} allowDecimals={metric==='percent'} tickFormatter={value=>metric==='votes'?Number(value).toLocaleString('pt-BR',{notation:'compact'}):`${Number(value).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`} stroke="#87919b" tick={{fontSize:12}}/><Tooltip content={<Evidence metric={metric}/>}/>{changeSeries.map((item,index)=><Line key={item.candidate.id} name={item.candidate.name} dataKey={valueKey(item.candidate.id)} type="linear" stroke={colors[index%colors.length]} strokeWidth={2.5} dot={item.points.length<25?{r:3}:false} activeDot={{r:5}} connectNulls isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div><div className="chart-legend">{changeSeries.map((item,index)=><span key={item.candidate.id}><i style={{background:colors[index%colors.length]}}/>{item.candidate.name}</span>)}</div><div className="chart-caption"><span>{displayPoints.toLocaleString('pt-BR')} pontos no gráfico · {period?`${date(period.start)} — ${date(period.end)}`:'Aguardando dados'}</span>{candidates.length===1?<a href={`/api/auditoria/serie?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&candidate=${encodeURIComponent(candidates[0].id)}`} target="_blank" rel="noreferrer">Consultar dados JSON</a>:null}</div><p className="chart-help">{series.some(item=>item.finalized)?'A linha do tempo encerra na última mudança de votos de qualquer candidato desta abrangência, conforme os registros arquivados.':'A linha do tempo continua durante a apuração; pausas entre publicações não indicam encerramento.'} Valores maiores ficam acima; cada ponto mantém o horário real da captura.</p>{evidence?<div className="chart-evidence"><strong>{evidence.candidateName} · {evidence.point.baseline?'ponto inicial':`versão #${evidence.point.id}`}</strong><span className="chart-evidence-value">{metric==='votes'?`${evidence.point.votes?.toLocaleString('pt-BR')??'Ausente'} votos`:formatPercent(evidence.point.percent)}</span><span className={`chart-delta ${deltaClass(evidenceDelta)}`}>{signed(evidenceDelta,metric)}</span><span>{metric==='votes'?formatPercent(evidence.point.percent):`${evidence.point.votes?.toLocaleString('pt-BR')??'Ausente'} votos`}</span><span>{evidence.point.baseline?'Início da apuração: 17:00 · Brasília':`Capturada: ${date(evidence.point.received)} · Brasília`}</span>{!evidence.point.baseline&&<><span>Geração TSE: {evidence.point.generated}</span><a href={`/api/historico?uf=${uf}&cargo=${cargo}&exterior=${includeExterior?1:0}&id=${evidence.point.id}&download=1`}>Baixar versão original</a></>}</div>:null}{hasOlder?<button disabled={loading} onClick={older}>{loading?'Carregando...':'Incluir versões anteriores'}</button>:null}</>}</div>;
}
