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
 openGraph:{type:'website',locale:'pt_BR',siteName:'Eleições 2026 · 3ree',url:origin+'/',title:'Eleições 2026: apuração e resultados do TSE',description:'Resultados arquivados, histórico de votos, auditoria e originais das urnas. Painel independente com fonte TSE.',images:[{url:origin+'/og-eleicoes.png',width:1200,height:630,alt:'Eleições 2026 · Apuração, histórico e dados do TSE'}]},
 twitter:{card:'summary_large_image',title:'Eleições 2026: apuração e resultados do TSE',description:'Resultados, histórico de votos e arquivos das urnas com fonte TSE.',images:[origin+'/og-eleicoes.png']},
 icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},
};
const structured={ '@context':'https://schema.org','@graph':[
 {'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Eleições 2026 · 3ree',inLanguage:'pt-BR',description:'Painel independente de apuração eleitoral com dados publicados pelo TSE.'},
 {'@type':'DataCatalog','@id':origin+'/#acervo',url:origin+'/painel?aba=auditoria',name:'Acervo das Eleições Gerais 2026',description:'Cópias de respostas oficiais capturadas do TSE, com históricos, horários de recebimento e hashes de integridade disponíveis. A cobertura depende das capturas realizadas.',isPartOf:{'@id':origin+'/#website'},creator:{'@type':'Organization',name:'3ree',url:origin},isBasedOn:'https://resultados.tse.jus.br/',dataset:[{'@type':'Dataset',name:'Eleições 2026 — 1º turno',url:origin+'/',temporalCoverage:'2026-10-04',isAccessibleForFree:true,description:'Resultados e arquivos efetivamente arquivados pelo painel; não representa a sequência individual de cada voto.',distribution:[{'@type':'DataDownload',encodingFormat:'application/json',contentUrl:origin+'/api/resultados?uf=BR&cargo=1'}]}]}
 ]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><ResultPump/><MunicipalPump/>{children}</body></html>;}
