export type ComparisonSnapshot={ibge:string;votes:number|null;percent:number|null;progress:number;generated:string;received:string;snapshotId:number;hash:string};
export function compareMunicipality(first:ComparisonSnapshot|undefined,second:ComparisonSnapshot|undefined){
 const secondData=second?.votes!=null&&second.votes>0;
 const comparable=first?.votes!=null&&secondData;
 return {first:first??null,second:second??null,comparable,secondData,complete:comparable&&first.progress>=100&&second.progress>=100,delta:comparable?second.votes!-first.votes!:null,points:comparable&&first.percent!=null&&second.percent!=null?Math.round((second.percent-first.percent)*100)/100:null,growth:comparable&&first.votes!>0?(second.votes!-first.votes!)/first.votes!*100:null};
}
export const comparisonQuery=(prefix:''|'r2_')=>`SELECT j.ibge,s.id snapshotId,s.generated,s.received,s.hash,
 CAST(json_extract(s.normalized,'$.progress') AS REAL) progress,
 CAST(json_extract(c.value,'$.votes') AS INTEGER) votes,
 CAST(json_extract(c.value,'$.percent') AS REAL) percent
 FROM ${prefix}municipal_jobs j JOIN ${prefix}municipal_snapshots s ON s.id=j.snapshot_id
 LEFT JOIN json_each(s.normalized,'$.candidates') c ON CAST(json_extract(c.value,'$.id') AS TEXT)=?`;

export type ComparisonSort='name'|'first'|'second'|'delta'|'growth'|'points';
type SortableComparison={name:string;uf?:string;first:{votes:number|null}|null;second:{votes:number|null}|null;delta:number|null;growth:number|null;points:number|null};
export function compareRanking(a:SortableComparison,b:SortableComparison,key:ComparisonSort,descending:boolean){
 if(key==='name')return (descending?-1:1)*a.name.localeCompare(b.name,'pt-BR')||(a.uf??'').localeCompare(b.uf??'');
 const left=key==='first'||key==='second'?a[key]?.votes??null:a[key];
 const right=key==='first'||key==='second'?b[key]?.votes??null:b[key];
 if(left===null||right===null)return left===right?a.name.localeCompare(b.name,'pt-BR'):left===null?1:-1;
 return (descending?right-left:left-right)||a.name.localeCompare(b.name,'pt-BR')||(a.uf??'').localeCompare(b.uf??'');
}

export function comparisonColor(delta:number|null,maximum:number,scale:'linear'|'log'='linear'){
 if(delta===null)return '#59636a';
 if(delta===0)return '#99aaa9';
 const magnitude=Math.min(Math.abs(delta),Math.max(1,maximum));
 const weight=scale==='log'?Math.log1p(magnitude)/Math.log1p(Math.max(1,maximum)):magnitude/Math.max(1,maximum);
 const light=delta>0?[219,242,231]:[255,228,222],dark=delta>0?[8,83,57]:[139,27,26];
 return '#'+light.map((channel,i)=>Math.round(channel+(dark[i]-channel)*weight).toString(16).padStart(2,'0')).join('');
}
