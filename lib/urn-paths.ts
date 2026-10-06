import {electionContext} from './election-context';
import {UFS} from './tse';
export const CONFIG='https://resultados.tse.jus.br/oficial/comum/config/ele-c.json';
export function scopeUf(uf:string){if(![...UFS,'ZZ'].includes(uf))throw Error('Abrangência de urna inválida.');return uf.toLowerCase();}
export function digits(value:unknown,length:number){const s=String(value);if(!/^\d+$/.test(s)||s.length>length)throw Error('Código territorial inválido.');return s.padStart(length,'0');}
export function officialUrl(value:string){const u=new URL(value);if(u.origin!=='https://resultados.tse.jus.br'||!u.pathname.startsWith('/oficial/')||u.search||u.hash||/%2f|%5c/i.test(u.pathname))throw Error('URL fora do repositório oficial.');return u.href;}
export function paths(config:any,uf:string){
 if(config.f!=='o')throw Error('Configuração não oficial.');const pl=config.pl?.find((p:any)=>p.c==='ele2026'&&p.dt===(electionContext().round===2?'25/10/2026':'04/10/2026'));if(!pl)throw Error('Pleito oficial de 2026 não encontrado no EA11.');
 const u=scopeUf(uf),pleito=String(pl.cd),prefix=`https://resultados.tse.jus.br/oficial/${pl.c}/arquivo-urna/${pleito}`;
 const template=config.arq?.find((a:any)=>a.tp==='cs')?.dir;if(typeof template!=='string')throw Error('Diretório EA16 ausente no EA11.');
 const vars:Record<string,string>={base:'https://resultados.tse.jus.br',ambiente:'oficial',ciclo:pl.c,cd_pleito:pleito,cd_eleicao:electionContext().president,uf:u};
 const directory=template.replace(/<([^>]+)>/g,(_:string,k:string)=>vars[k]??`<${k}>`);if(/[<>]/.test(directory))throw Error('Diretório de seções possui tokens não reconhecidos.');
 return {uf:uf.toUpperCase(),pleito,prefix,index:officialUrl(`${directory.replace(/\/$/,'')}/${u}-p${digits(pleito,6)}-cs.json`)};
}
export function sectionUrl(p:{prefix:string;pleito:string;uf:string},municipio:string,zona:string,secao:string){const uf=scopeUf(p.uf),m=digits(municipio,5),z=digits(zona,4),s=digits(secao,4);return officialUrl(`${p.prefix}/dados/${uf}/${m}/${z}/${s}/p${digits(p.pleito,6)}-${uf}-m${m}-z${z}-s${s}-aux.json`);}
export function filesFromAux(raw:any,p:{prefix:string;pleito:string;uf:string},m:string,z:string,s:string){
 if(!['o','O'].includes(raw.f)||!Array.isArray(raw.hashes))throw Error('EA18 não oficial ou incompatível.');const aux=sectionUrl(p,m,z,s);const parent=aux.slice(0,aux.lastIndexOf('/')+1);
 return raw.hashes.flatMap((h:any)=>{if(typeof h.hash!=='string'||!/^[-a-zA-Z0-9_]+$/.test(h.hash)||!Array.isArray(h.arq))throw Error('Hash ou lista de arquivos inválidos no EA18.');return h.arq.map((a:any)=>{if(typeof a.nm!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(a.nm)||a.nm==='.'||a.nm==='..')throw Error('Nome de arquivo inválido.');return {hash:h.hash,filename:a.nm,type:String(a.tp??'desconhecido'),tseReceived:h.dr&&h.hr?`${h.dr} ${h.hr}`:null,tseStatus:String(h.st??''),source:officialUrl(`${parent}${h.hash}/${a.nm}`)};});});
}
