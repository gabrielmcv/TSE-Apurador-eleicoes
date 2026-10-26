import type { Metadata } from 'next';
import './globals.css';
import MunicipalPump from './MunicipalPump';
import ResultPump from './ResultPump';
const origin='https://eleicoes.3ree.org';
export const metadata:Metadata={
 metadataBase:new URL(origin),
 title:{default:'Eleições 2026: apuração e resultados do TSE | 3ree',template:'%s | Eleições 2026 · 3ree'},
 description:'Consulte a apuração das eleições 2026: presidente, governadores, Senado e deputados, exterior, histórico de votos, auditoria e arquivos das urnas do TSE.',
 applicationName:'Eleições 2026 · 3ree',
 alternates:{canonical:origin+'/'},
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
 openGraph:{type:'website',locale:'pt_BR',siteName:'Eleições 2026 · 3ree',url:origin+'/',title:'Eleições 2026: apuração e resultados do TSE',description:'Resultados arquivados, histórico de votos, auditoria e originais das urnas. Painel independente com fonte TSE.',images:[{url:origin+'/og/segundo-turno.png',width:1200,height:630,alt:'Eleições 2026 · Apuração, histórico e dados do TSE'}]},
 twitter:{card:'summary_large_image',title:'Eleições 2026: apuração e resultados do TSE',description:'Resultados, histórico de votos e arquivos das urnas com fonte TSE.',images:[origin+'/og/segundo-turno.png']},
 icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},
};
const structured={ '@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':origin+'/#publisher',name:'3ree',url:origin},
 {'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Eleições 2026 · 3ree',inLanguage:'pt-BR',description:'Painel independente com resultados eleitorais e documentos públicos do TSE arquivados.',publisher:{'@id':origin+'/#publisher'}},
 {'@type':'DataCatalog','@id':origin+'/#acervo',url:origin+'/segundo-turno/painel?aba=urnas',name:'Acervo das Eleições Gerais 2026',description:'Cópias dos dados do TSE obtidas pelo painel, com fonte, horários, versões e hashes. Cobertura variável; não equivale a auditoria forense integral.',isPartOf:{'@id':origin+'/#website'},creator:{'@id':origin+'/#publisher'},dataset:([1,2] as const).map(round=>({'@type':'Dataset','@id':origin+`/#dados-turno-${round}`,name:`Eleições 2026 — ${round}º turno`,url:origin+(round===1?'/?eleicao=2026-1':'/segundo-turno'),temporalCoverage:round===1?'2026-10-04':'2026-10-25',isAccessibleForFree:true,description:'Resultados efetivamente arquivados, com cobertura e horários próprios; não identifica votos individuais.',creator:{'@type':'Organization',name:'Tribunal Superior Eleitoral',url:'https://www.tse.jus.br/'},isBasedOn:'https://resultados.tse.jus.br/',distribution:[{'@type':'DataDownload',encodingFormat:'application/json',contentUrl:origin+`/api/resultados?uf=BR&cargo=1&eleicao=2026-${round}`}]}))}
 ]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><ResultPump/><MunicipalPump/>{children}</body></html>;}
