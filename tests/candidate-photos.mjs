import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
process.chdir(new URL('..',import.meta.url).pathname);
const catalog=JSON.parse(fs.readFileSync('lib/candidate-photos.json','utf8'));
const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const photosUrl=moduleUrl(fs.readFileSync('lib/photos.ts','utf8').replace("import catalog from './candidate-photos.json';",'const catalog='+JSON.stringify(catalog)+';'));
const {withCandidatePhotos}=await import(photosUrl);
const candidates=catalog.photos.map(p=>({id:p.sqcand,name:p.name,number:'13',party:'Fixture',votes:0,percent:0,status:'',destination:'',elected:false}));
const archived={id:'old',generated:'',generationTime:1,totalization:'',progress:0,sections:0,totalSections:1,total:0,valid:0,blank:0,nullVotes:0,status:'Aguardando totalização',candidates};const before=JSON.stringify(archived);
const projected=withCandidatePhotos(archived,'1');assert.equal(projected.candidates.length,12);assert.equal(JSON.stringify(archived),before);
for(const [i,photo] of catalog.photos.entries()){assert.equal(projected.candidates[i].photo,photo.url);const bytes=fs.readFileSync('public'+photo.url);assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.equal(bytes.length,photo.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photo.sha256);assert.ok(photo.source.startsWith('https://resultados.tse.jus.br/oficial/ele2026/6257/fotos/br/'));}
assert.equal(withCandidatePhotos(archived,'3'),archived);
for(const cargo of ['3','5','6','7','8']){const uf=cargo==='8'?'DF':'ES';const projected=withCandidatePhotos(archived,cargo,uf);assert.ok(projected.candidates[0].photo.startsWith('https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/'+uf.toLowerCase()+'/'));assert.equal(JSON.stringify(archived),before);}
assert.equal(withCandidatePhotos({...archived,candidates:[{...candidates[0],id:'99'}]},'1').candidates[0].photo,undefined);
assert.ok(withCandidatePhotos({...archived,candidates:[{...candidates[0],id:'280009999999'}]},'1').candidates[0].photo.endsWith('/280009999999.jpeg'));
// The collector can return a historical normalized result with no photo field.
globalThis.photoCollection={result:archived,error:null,source:'official',archive:{id:1,hash:'unchanged'}};
const tseUrl=moduleUrl(fs.readFileSync('lib/tse.ts','utf8'));
const route=fs.readFileSync('app/api/resultados/route.ts','utf8').replace("import {collect} from '../../../lib/archive';",'const collect=async()=>globalThis.photoCollection;').replace("from '../../../lib/photos'",'from '+JSON.stringify(photosUrl)).replace("from '../../../lib/tse'",'from '+JSON.stringify(tseUrl));
const {GET}=await import(moduleUrl(route));const response=await GET(new Request('https://test/api/resultados?uf=BR&cargo=1'));assert.equal(response.status,200);const data=await response.json();assert.ok(data.result.candidates.every(c=>c.photo.startsWith('/candidate-photos/')));assert.equal(data.archive.hash,'unchanged');assert.equal(JSON.stringify(archived),before);
assert.deepEqual(JSON.parse(fs.readFileSync('public/candidate-photos/provenance.json','utf8')),catalog);
console.log('PASS: 12 official JPEG assets and hashes, photo restoration for old snapshots, API presentation, safe fallback, unchanged archived results and provenance.');
