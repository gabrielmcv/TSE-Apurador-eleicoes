import {endpoint,UFS} from './tse';
export type PanelMenu='painel'|'exterior'|'auditoria'|'historico'|'logs'|'urnas';
export type PanelView={menu:PanelMenu;uf:string;cargo:string;candidate:string;includeExterior?:boolean};
export function panelView(params:Record<string,string|string[]|undefined>):PanelView{
 const value=(key:string)=>{const v=params[key];return Array.isArray(v)?v[0]:v;};
 const tab=value('aba'),candidate=value('candidate')??'';let uf=value('uf')??'BR';if(!['BR','ZZ',...UFS].includes(uf))uf='BR';
 const menu:PanelMenu=tab==='resultados'?'painel':tab==='exterior'?'exterior':tab==='urnas'?'urnas':tab==='logs'?'logs':tab==='historico'?'historico':tab==='auditoria'||candidate?'auditoria':uf==='ZZ'?'exterior':'painel';
 if(menu==='exterior')uf='ZZ';let cargo=value('cargo')??'1';try{if(!(menu==='logs'&&cargo==='municipal'))endpoint(uf,cargo);}catch{cargo='1';}
 return {menu,uf,cargo,candidate,includeExterior:value('exterior')!=='0'};
}
export const panelTitles:Record<PanelMenu,{title:string;description:string}>={
 painel:{title:'Outros resultados',description:'Apuração por abrangência e cargo.'},
 exterior:{title:'Votação no exterior',description:'Resultados para presidente nas seções eleitorais do exterior.'},
 auditoria:{title:'Auditoria de alterações',description:'Aumentos, reduções e alertas entre as versões recebidas.'},
 historico:{title:'Histórico de resultados',description:'Consulte os totais e arquivos de cada versão arquivada.'},
 logs:{title:'Logs de coleta',description:'Consultas ao TSE, respostas, horários e falhas registradas.'},
 urnas:{title:'Arquivos de urna',description:'BU, RDV e logs por abrangência, município, zona e seção.'}
};
