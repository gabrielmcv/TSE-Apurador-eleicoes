export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
export const CARGOS: Record<string,string> = {'1':'Presidente','3':'Governador','5':'Senador','6':'Deputado federal','7':'Deputado estadual','8':'Deputado distrital'};
export function endpoint(uf:string,cargo:string,context={round:1,president:'6257',state:'6259'}) {
 if(!['BR','ZZ',...UFS].includes(uf)||!CARGOS[cargo]||(['BR','ZZ'].includes(uf)&&cargo!=='1')||(cargo==='8'&&uf!=='DF')||(cargo==='7'&&uf==='DF')) throw Error('Abrangência incompatível com o cargo.');
 if(context.round===2&&!['1','3'].includes(cargo))throw Error('Este cargo não possui segundo turno.');
 const ele=cargo==='1'?context.president:context.state;
 return `https://resultados.tse.jus.br/oficial/ele2026/${ele}/dados/${uf.toLowerCase()}/${uf.toLowerCase()}-c${cargo.padStart(4,'0')}-e${ele.padStart(6,'0')}-u.json`;
}
export type Candidate={id:string;photo?:string;name:string;number:string;party:string;votes:number;percent:number;status:string;destination:string;elected:boolean};
export type Result={id:string;generated:string;generationTime:number;totalization:string;progress:number;sections:number;totalSections:number;total:number;valid:number;blank:number;nullVotes:number;status:string;candidates:Candidate[]};
const integer=(v:unknown)=>{if(typeof v!=='number'&&(typeof v!=='string'||!/^\d+$/.test(v)))throw Error('Contagem ausente ou inválida.');const n=Number(v); if(!Number.isSafeInteger(n)||n<0) throw Error('Número de votos inválido no arquivo.');return n;};
const decimal=(v:unknown)=>{if(typeof v!=='number'&&(typeof v!=='string'||!/^\d+(?:[.,]\d+)?$/.test(v)))throw Error('Percentual ausente ou inválido.');const n=Number(String(v).replace(',','.'));if(!Number.isFinite(n))throw Error('Percentual inválido.');return n;};
export function normalize(raw:any,cargo:string,uf?:string,context={round:1,president:'6257',state:'6259'}):Result {
 if(uf&&(String(raw.cdabr).toUpperCase()!==uf||!['br','uf'].includes(raw.tpabr)))throw Error('Abrangência diferente da solicitada.');
 if(raw.f!=='o'||String(raw.t)!==String(context.round)||String(raw.ele)!==(cargo==='1'?context.president:context.state))throw Error('Arquivo não corresponde à eleição oficial selecionada.');
 const c=raw.carg?.find((x:any)=>Number(x.cd)===Number(cargo));
 if(!c||!raw.s||!raw.v||!raw.idg)throw Error('Leiaute do TSE não reconhecido.');
 const candidates:Candidate[]=(c.agr??[]).flatMap((a:any)=>(a.par??[]).flatMap((p:any)=>(p.cand??[]).map((x:any)=>({id:String(x.sqcand??x.n),photo:cargo==='1'&&/^\d+$/.test(String(x.sqcand??''))?`https://resultados.tse.jus.br/oficial/ele2026/${context.president}/fotos/br/${x.sqcand}.jpeg`:undefined,name:String(x.nmu??x.nm),number:String(x.n),party:String(p.sg),votes:integer(x.vap),percent:decimal(x.pvap),status:String(x.st??''),destination:String(x.dvt??''),elected:x.e==='s'}))));
 const [d,m,y]=String(raw.dg).split('/');const generationTime=Date.parse(`${y}-${m}-${d}T${raw.hg}-03:00`);
 if(!Number.isFinite(generationTime))throw Error('Data de geração inválida.');
 return {id:String(raw.idg),generated:`${raw.dg} ${raw.hg}`,generationTime,totalization:`${raw.dt??''} ${raw.ht??''}`,progress:decimal(raw.s.pst),sections:integer(raw.s.st),totalSections:integer(raw.s.ts),total:integer(raw.v.tv),valid:integer(raw.v.vv),blank:integer(raw.v.vb),nullVotes:integer(raw.v.tvn),status:raw.dv==='n'?'Divulgação ainda não liberada':raw.and==='f'?'Totalização finalizada':raw.and==='n'?'Aguardando totalização':'Apuração em andamento',candidates};
}
