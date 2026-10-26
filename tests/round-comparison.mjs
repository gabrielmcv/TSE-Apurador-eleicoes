import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
const js=ts.transpileModule(fs.readFileSync('lib/round-comparison.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {comparisonQuery,compareMunicipality}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const first={ibge:'1',votes:100,percent:20,progress:100},second={ibge:'1',votes:180,percent:60,progress:100};
assert.deepEqual({...compareMunicipality(first,second),first:null,second:null},{first:null,second:null,comparable:true,secondData:true,complete:true,delta:80,points:40,growth:80});
assert.equal(compareMunicipality(first,{...second,progress:50}).complete,false);
assert.equal(compareMunicipality(first,undefined).delta,null);
assert.equal(compareMunicipality(first,{...second,votes:null}).delta,null);
assert.equal(compareMunicipality({...first,votes:0},second).growth,null);
assert.equal(compareMunicipality(first,{...second,votes:0}).growth,null);
const db=new DatabaseSync(':memory:');
for(const prefix of ['', 'r2_']){db.exec(`CREATE TABLE ${prefix}municipal_jobs(ibge TEXT,snapshot_id INTEGER);CREATE TABLE ${prefix}municipal_snapshots(id INTEGER,normalized TEXT,generated TEXT,received TEXT,hash TEXT);`);db.prepare(`INSERT INTO ${prefix}municipal_jobs VALUES('1',1)`).run();const raw={progress:100,candidates:[{id:'a',votes:prefix?180:100,percent:prefix?60:20},{id:'b',votes:10,percent:5}]};db.prepare(`INSERT INTO ${prefix}municipal_snapshots VALUES(1,?,'date','received','hash')`).run(JSON.stringify(raw));}
const a=db.prepare(comparisonQuery('')).get('a'),b=db.prepare(comparisonQuery('r2_')).get('a');assert.equal(compareMunicipality(a,b).delta,80);assert.equal(a.snapshotId,1);assert.equal(a.hash,'hash');assert.equal(db.prepare(comparisonQuery('')).get('missing').votes,null);
assert.equal(db.prepare(comparisonQuery('')).get('b').votes,10);
console.log('PASS: separate turn tables, candidate-specific votes, deltas, percentage points, zero baseline, missing data, partial totals and provenance.');
const {compareRanking,comparisonColor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const rankRows=[{name:'ÁGUA',uf:'ES',first:{votes:30},second:{votes:100},delta:70,growth:200,points:10},{name:'BARRA',uf:'ES',first:{votes:10},second:{votes:90},delta:80,growth:800,points:20},{name:'CIDADE',uf:'ES',first:null,second:{votes:150},delta:null,growth:null,points:null}];
for(const key of ['name','first','second','delta','growth','points']){
 for(const descending of [false,true]){const sorted=[...rankRows].sort((a,b)=>compareRanking(a,b,key,descending));assert.equal(sorted.length,3);if(key!=='name'&&key!=='second')assert.equal(sorted[2].name,'CIDADE');}
}
assert.equal([...rankRows].sort((a,b)=>compareRanking(a,b,'name',false))[0].name,'ÁGUA');
assert.equal([...rankRows].sort((a,b)=>compareRanking(a,b,'first',true))[0].first.votes,30);
assert.equal([...rankRows].sort((a,b)=>compareRanking(a,b,'second',true))[0].second.votes,150);
assert.equal([...rankRows].sort((a,b)=>compareRanking(a,b,'delta',false))[0].delta,70);
const luminance=hex=>[1,3,5].reduce((sum,i)=>sum+parseInt(hex.slice(i,i+2),16),0);
for(const direction of [-1,1])assert.ok(luminance(comparisonColor(direction*100,100))<luminance(comparisonColor(direction*50,100)));
assert.equal(comparisonColor(100,100),'#085339');assert.equal(comparisonColor(-100,100),'#8b1b1a');assert.equal(comparisonColor(null,100),'#59636a');assert.equal(comparisonColor(0,100),'#99aaa9');
console.log('PASS: every column sorts both directions, numeric sorting, nulls last and linear darker colors for larger vote differences.');
for(const direction of [-1,1]){
 const values=[1,252,8399,100000,1387219].map(n=>luminance(comparisonColor(direction*n,1387219,'log')));
 assert.ok(values.every((n,i)=>i===0||n<values[i-1]));
 assert.ok(luminance(comparisonColor(direction*252,1387219,'log'))<luminance(comparisonColor(direction*252,1387219,'linear'))-100);
 assert.equal(comparisonColor(direction*1387219,1387219,'log'),comparisonColor(direction*1387219,1387219,'linear'));
}
assert.equal(comparisonColor(null,100,'log'),'#59636a');assert.equal(comparisonColor(0,100,'log'),'#99aaa9');
console.log('PASS: logarithmic scale reveals typical municipal differences, preserves monotonic darkness, endpoints, zero and missing data.');

const zero=compareMunicipality(first,{...second,votes:0,percent:0,progress:0});
assert.equal(zero.comparable,false);assert.equal(zero.secondData,false);assert.equal(zero.complete,false);assert.equal(zero.delta,null);assert.equal(zero.points,null);assert.equal(zero.growth,null);assert.equal(zero.second.votes,0);assert.equal(comparisonColor(zero.delta,100,'log'),'#59636a');
const missing=compareMunicipality(first,undefined);assert.equal(missing.secondData,false);
assert.equal(compareMunicipality(first,{...second,votes:1}).comparable,true);
assert.equal(compareMunicipality({...first,votes:0},second).comparable,true);
console.log('PASS: second-round zero excluded from comparison and ranking; gray map, no false decrease, original zero retained, genuine first-round zero still comparable.');
