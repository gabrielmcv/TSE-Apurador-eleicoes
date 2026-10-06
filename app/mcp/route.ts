import {z} from 'zod/v4';
import {latest} from '../../lib/archive';
import {withCandidatePhotos} from '../../lib/photos';
import {endpoint} from '../../lib/tse';
import {getStorage} from '../../db';
import {runElection,firstElection} from '../../lib/election-context';
import {loadSecondContext} from '../../lib/second-round-config';
import {initializeSecondStorage} from '../../lib/round-storage';
import {env} from 'cloudflare:workers';
async function results(request:Request){const p=new URL(request.url).searchParams,uf=p.get('uf')??'BR',cargo=p.get('cargo')??'1';try{const source=endpoint(uf,cargo,electionContext()),row=await latest(uf,cargo);return Response.json({election:electionInfo(),source,result:row?withCandidatePhotos(JSON.parse(row.normalized),cargo,uf):null,archive:row?{id:row.id,idg:row.idg,hash:row.hash,received:row.received,saved:row.saved}:null});}catch{return Response.json({error:'Seleção ou consulta indisponível.'},{status:400});}}
import {GET as history} from '../api/historico/route';
import {GET as audit} from '../api/auditoria/route';
import {GET as logs} from '../api/logs/route';
import {GET as urns} from '../api/urnas/route';
import {GET as municipalities} from '../api/auditoria/mapa/municipios/route';
import {exportStatus} from '../../lib/archive-export';
import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from '../../lib/election-context';
export const dynamic='force-dynamic';
const uf=z.string().regex(/^(BR|ZZ|AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/).default('BR');
const cargo=z.enum(['1','3','5','6','7','8']).default('1');
const positive=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const electionArg={eleicao:z.enum(['2026-1','2026-2']).default('2026-1')};
const scope={...electionArg,uf,cargo};
const cursor={before:positive.optional()};
const tools=[
 {name:'consultar_resultados',description:'Último resultado arquivado do TSE por UF e cargo. BR presidencial inclui exterior. Cargos: 1 presidente, 3 governador, 5 senador, 6 deputado federal, 7 estadual, 8 distrital. Retorna fonte, horários e metadados disponíveis.',schema:z.object(scope).strict(),handler:results,path:'/api/resultados'},
 {name:'consultar_historico',description:'Versões arquivadas, paginadas pelo cursor before. id consulta uma versão; original=true inclui a resposta original e hash. exterior=false exclui exterior do total presidencial BR.',schema:z.object({...scope,...cursor,id:positive.optional(),original:z.boolean().optional(),exterior:z.boolean().optional()}).strict(),handler:history,path:'/api/historico'},
 {name:'consultar_alteracoes',description:'Alterações de totais entre capturas, inclusive reduções e geração anterior. candidate filtra identificador; alerts filtra alertas. Consulta factual, sem inferir fraude.',schema:z.object({...scope,...cursor,candidate:z.string().max(80).optional(),alerts:z.boolean().optional(),exterior:z.boolean().optional()}).strict(),handler:audit,path:'/api/auditoria'},
 {name:'consultar_logs',description:'Metadados das tentativas de coleta, horários, HTTP e hashes. cargo também aceita urna ou municipal. Não expõe credenciais ou cabeçalhos privados.',schema:z.object({...electionArg,uf,cargo:z.enum(['1','3','5','6','7','8','urna','municipal']).default('1'),...cursor}).strict(),handler:logs,path:'/api/logs'},
 {name:'consultar_urnas',description:'Inventário paginado de BU, RDV, logs e índices, cobertura e pendências. Filtros territoriais são códigos TSE. Não baixa arquivos binários dentro da conversa.',schema:z.object({...electionArg,uf,...cursor,municipio:z.string().regex(/^\d{1,5}$/).optional(),zona:z.string().regex(/^\d{1,4}$/).optional(),secao:z.string().regex(/^\d{1,4}$/).optional()}).strict(),handler:urns,path:'/api/urnas'},
 {name:'consultar_municipios',description:'Votos presidenciais arquivados por município de uma UF para um identificador de candidato. Ausência de captura aparece como null, nunca como zero inventado.',schema:z.object({...electionArg,uf,candidato:z.string().min(1).max(80)}).strict(),handler:municipalities,path:'/api/auditoria/mapa/municipios'},
 {name:'consultar_acervo',description:'Eleição arquivada, quantidade, bytes, cobertura de índices, pendências e disponibilidade do ZIP completo.',schema:z.object(electionArg).strict(),handler:null,path:''}
];
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return new Response('Origem não permitida',{status:403});
 let msg:any;try{const text=await request.text();if(text.length>32768)return new Response('Requisição muito grande',{status:413});msg=JSON.parse(text);}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'JSON inválido'}});}
 const respond=(result:unknown)=>Response.json({jsonrpc:'2.0',id:msg?.id??null,result},{headers:{'Cache-Control':'no-store'}});
 const error=(code:number,message:string)=>Response.json({jsonrpc:'2.0',id:msg?.id??null,error:{code,message}});
 if(!msg||Array.isArray(msg)||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return error(-32600,'Requisição JSON-RPC inválida');
 if(msg.method==='notifications/initialized'||(msg.id===undefined&&msg.method.startsWith('notifications/')))return new Response(null,{status:202});
 if(msg.id===undefined)return error(-32600,'ID obrigatório');
 if(msg.method==='initialize')return respond({protocolVersion:['2024-11-05','2025-03-26','2025-06-18'].includes(msg.params?.protocolVersion)?msg.params.protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'apuracao-tse',version:'1.0.0'},instructions:'Dados públicos arquivados do TSE. Apenas leitura. Preserve fonte, horário de geração e recebimento; não confunda ausência de dados com zero votos. Hash verifica integridade da cópia, não assinatura do TSE.'});
 if(msg.method==='ping')return respond({});
 if(msg.method==='tools/list')return respond({tools:tools.map(t=>({name:t.name,description:t.description,inputSchema:z.toJSONSchema(t.schema,{target:'draft-7'}),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}))});
 if(msg.method!=='tools/call')return error(-32601,'Método não suportado');
 const tool=tools.find(t=>t.name===msg.params?.name);if(!tool)return error(-32602,'Ferramenta desconhecida');
 const parsed=tool.schema.safeParse(msg.params?.arguments??{});if(!parsed.success)return error(-32602,'Argumentos inválidos: '+parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
 try{
  if(parsed.data.eleicao==='2026-2'){if(!env.DB)throw Error('Armazenamento indisponível');await initializeSecondStorage(env.DB);}
  const context=parsed.data.eleicao==='2026-2'?await loadSecondContext():firstElection;
  return await runElection(context,async()=>{let data:unknown,isError=false;
  if(!tool.handler)data={election:electionInfo(),...await exportStatus()};
  else {const url=new URL(tool.path,request.url);for(const [key,value]of Object.entries(parsed.data)){if(key==='eleicao')continue;if(key==='original'){if(value)url.searchParams.set('download','1');}else url.searchParams.set(key,typeof value==='boolean'?(value?'1':'0'):String(value));}const response=await tool.handler(new Request(url));isError=!response.ok;data=await response.json();}
  return respond({content:[{type:'text',text:JSON.stringify(data)}],isError});});
 }catch{return respond({content:[{type:'text',text:'Consulta indisponível. Tente novamente; nenhum dado foi modificado.'}],isError:true});}
}
export function GET(){return new Response(null,{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});}
