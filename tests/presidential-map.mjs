import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const tse=url(compile('lib/tse.ts'));
const source=compile('lib/presidential-map.ts').replace("'./tse'",JSON.stringify(tse));
const {presidentialMap}=await import(url(source));
const candidate=(id,name,votes,percent)=>({id,name,number:id,party:'P'+id,votes,percent,status:'',destination:'Válido',elected:false});
const result=(candidates)=>({id:'1',generated:'04/10/2026 18:00:00',generationTime:1,totalization:'',progress:50,sections:5,totalSections:10,total:100,valid:100,blank:0,nullVotes:0,status:'Apuração em andamento',candidates});
const rows=[
 {id:1,uf:'AC',generated:'g1',received:'r1',hash:'h1',normalized:JSON.stringify(result([candidate('1','A',60,60),candidate('2','B',40,40)]))},
 {id:2,uf:'SP',generated:'g2',received:'r2',hash:'h2',normalized:JSON.stringify(result([candidate('1','A',20,20),candidate('2','B',80,80)]))},
];
const data=presidentialMap(rows,value=>({...value,candidates:value.candidates.map(item=>({...item,photo:'/foto/'+item.id}))}));
assert.deepEqual(data.candidates.map(candidate=>[candidate.id,candidate.votes]),[['2',120],['1',80]]);
assert.equal(data.states.find(state=>state.uf==='AC').results.find(item=>item.candidateId==='1').percent,60);
assert.equal(data.states.find(state=>state.uf==='SP').results.find(item=>item.candidateId==='2').votes,80);
assert.equal(data.candidates[0].photo,'/foto/2');
assert.equal(data.missingStates.length,25);
console.log('PASS: mapa presidencial agrega candidatos, preserva votos e percentuais estaduais, ordena totais e informa UFs ausentes.');
