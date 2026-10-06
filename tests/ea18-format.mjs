import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const tse=url(compile('lib/tse.ts'));const {filesFromAux}=await import(url(compile('lib/urn-paths.ts').replace("'./tse'",JSON.stringify(tse))));
// Original TSE response captured 2026-10-04 from AC, municipality 01074, zone 0004, section 0291.
const raw=JSON.parse(fs.readFileSync('tests/fixtures/ea18-official-uppercase.json','utf8'));const scope={prefix:'https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/3220',pleito:'3220',uf:'AC'};
const read=x=>filesFromAux(x,scope,'01074','0004','0291');const files=read(raw);assert.equal(files.length,5);assert.deepEqual(files.map(f=>f.type),['imgbu','bu','rdv','vota','log']);assert.equal(files[0].tseReceived,'04/10/2026 17:15:34');assert.ok(files.every(f=>f.source.includes('/'+raw.hashes[0].hash+'/')));assert.deepEqual(read({...raw,f:'o'}),files);
for(const f of ['s','S','',null,undefined])assert.throws(()=>read({...raw,f}),/não oficial/);assert.throws(()=>read({...raw,hashes:null}));assert.throws(()=>read({...raw,hashes:[{hash:'../bad',arq:[]}]}));assert.throws(()=>read({...raw,hashes:[{hash:'abc',arq:[{nm:'../bad'}]}]}));
console.log('PASS: real official EA18 uppercase O; lowercase preserved; all 5 artifact types/timestamps/paths; simulated and malformed payloads rejected.');
