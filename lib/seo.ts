import type {Metadata} from 'next';
import {panelView,panelTitles} from './panel-view';
export const SITE_ORIGIN='https://eleicoes.3ree.org';
export const SITE_NAME='Eleições 2026 · 3ree';
export type PageSEO={title:string;description:string;path:string;image:string};
export const publicPages:Record<string,PageSEO>={
 first:{title:'Primeiro turno: resultados das eleições 2026',description:'Consulte os votos para presidente no primeiro turno de 2026, com resultados do TSE arquivados, mapas, fontes e horários de captura.',path:'/?eleicao=2026-1',image:'primeiro-turno'},
 second:{title:'Segundo turno: resultados das eleições 2026',description:'Consulte os votos para presidente no segundo turno de 2026. Explore mapas, resultados no exterior, histórico, auditoria e arquivos de urnas.',path:'/segundo-turno',image:'segundo-turno'},
 comparison:{title:'Auditoria comparativa dos turnos',description:'Compare votos presidenciais por município entre os dois turnos de 2026. Consulte o mapa, o ranking e o parecer de IA com fontes e limites da análise.',path:'/comparativo',image:'comparativo'},
 mcp:{title:'Dados eleitorais para IA via MCP',description:'Conecte ferramentas de IA ao acervo dos dois turnos de 2026: resultados, municípios, histórico, auditoria, parecer e arquivos de urnas com proveniência.',path:'/integracoes/mcp',image:'mcp'},
};
const descriptions={
 painel:'Consulte resultados eleitorais de 2026 por estado e cargo, com votos, percentuais, seções totalizadas e fontes do TSE arquivadas.',
 exterior:'Consulte os votos para presidente nas seções eleitorais do exterior, com candidatos, percentuais, histórico e horários das capturas do TSE.',
 auditoria:'Examine alterações de votos, mapas municipais e cobertura do acervo. Distinga arquivos recebidos, municípios concluídos e seções totalizadas.',
 historico:'Explore versões arquivadas dos resultados do TSE, com totais, horários de geração e recebimento, arquivos originais e hashes de integridade.',
 urnas:'Consulte boletins de urna (BU), RDV, logs e índices obtidos do TSE por estado, município, zona e seção, com cobertura e pendências.',
 logs:'Consulte tentativas de coleta dos dados eleitorais do TSE: horários, respostas HTTP, falhas e metadados dos arquivos recebidos.',
};
export function panelSEO(params:Record<string,string|string[]|undefined>,round:1|2=1):PageSEO{
 const view=panelView(params),tab=view.menu==='painel'?'resultados':view.menu;
 return {title:`${panelTitles[view.menu].title} — ${round}º turno`,description:descriptions[view.menu]+` Acervo do ${round}º turno.`,path:`${round===2?'/segundo-turno':''}/painel?aba=${tab}${view.menu==='exterior'?'&uf=ZZ&cargo=1':''}`,image:`${tab}-${round}`};
}
export function pageMetadata(page:PageSEO):Metadata{
 const url=SITE_ORIGIN+page.path,image={url:`${SITE_ORIGIN}/og/${page.image}.png`,width:1200,height:630,type:'image/png',alt:`${page.title} · ${SITE_NAME}`};
 return {title:page.title,description:page.description,alternates:{canonical:url},openGraph:{type:'website',locale:'pt_BR',siteName:SITE_NAME,url,title:page.title,description:page.description,images:[image]},twitter:{card:'summary_large_image',title:page.title,description:page.description,images:[{url:image.url,alt:image.alt}]}};
}
export function panelMetadata(params:Record<string,string|string[]|undefined>,round:1|2=1):Metadata{return pageMetadata(panelSEO(params,round));}
export function pageStructuredData(page:PageSEO){const url=SITE_ORIGIN+page.path;return {'@context':'https://schema.org','@graph':[
 {'@type':'WebPage','@id':url+'#webpage',url,name:page.title,description:page.description,inLanguage:'pt-BR',isPartOf:{'@id':SITE_ORIGIN+'/#website'},publisher:{'@id':SITE_ORIGIN+'/#publisher'},primaryImageOfPage:{'@type':'ImageObject',url:SITE_ORIGIN+'/og/'+page.image+'.png',width:1200,height:630},breadcrumb:{'@id':url+'#breadcrumb'}},
 {'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:SITE_NAME,item:SITE_ORIGIN+'/segundo-turno'},{'@type':'ListItem',position:2,name:page.title,item:url}]}
 ]};}
export function sitemapPages(){return [...Object.values(publicPages),...([1,2] as const).flatMap(round=>['resultados','exterior','auditoria','historico','urnas','logs'].map(aba=>panelSEO({aba},round)))];}
