import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {DatabaseSync} from 'node:sqlite';
const code=ts.transpileModule(fs.readFileSync('lib/urn-retry.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {urnRetry,urnClaimQuery,urnFailuresQuery,urnRetryClaimQuery,urnRepairPauseQuery}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(urnRetry(404,1).delay,300000);assert.equal(urnRetry(404,2).delay,600000);assert.equal(urnRetry(404,100).delay,21600000);assert.equal(urnRetry(403,1).pauseMs,60000);assert.equal(urnRetry(429,20).pauseMs,60000);assert.equal(urnRetry(404,1).pauseMs,0);
const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE urn_jobs(id INTEGER PRIMARY KEY,kind TEXT,uf TEXT,payload TEXT,state TEXT,attempts INTEGER,next_ms INTEGER,lease_until INTEGER,updated TEXT,error TEXT);CREATE TABLE urn_files(id INTEGER PRIMARY KEY,type TEXT);INSERT INTO urn_files VALUES(1,'imgbu');INSERT INTO urn_files VALUES(2,'imgbu');INSERT INTO urn_jobs VALUES(1,'file','AC','{"fileId":1}','retry',12,0,0,'a','TSE respondeu HTTP 404');INSERT INTO urn_jobs VALUES(2,'file','AC','{"fileId":2}','retry',3,0,0,'b','TSE respondeu HTTP 404');INSERT INTO urn_jobs VALUES(3,'file','AL','{}','pending',0,0,0,'c',NULL);`);
let groups=db.prepare(urnFailuresQuery).all();assert.equal(groups.length,1);assert.equal(groups[0].count,2);assert.equal(groups[0].type,'imgbu');assert.equal(db.prepare(urnClaimQuery).get(10000,'now',1000,1000).id,3);
db.exec("INSERT INTO urn_jobs VALUES(4,'index','ES','{}','pending',1,0,0,'d',NULL)");assert.equal(db.prepare(urnClaimQuery).get(10000,'now',1000,1000).id,4);assert.equal(db.prepare('SELECT state FROM urn_jobs WHERE id=1').get().state,'retry');
console.log('PASS: 404 bounded backoff, 403/429 cooldown, first downloads before retries, index refresh priority, grouped warnings and preservation of failed jobs.');

// Regression: untouched territorial indices and repeated import batches cannot
// be starved by thousands of fresh downloads from the first discovered UF.
db.exec("INSERT INTO urn_jobs VALUES(5,'index','SP','{}','pending',0,0,0,'e',NULL);INSERT INTO urn_jobs VALUES(6,'import','SP','{}','pending',30,0,0,'f',NULL);INSERT INTO urn_jobs VALUES(7,'aux','AC','{}','pending',0,0,0,'g',NULL)");
assert.equal(db.prepare(urnClaimQuery).get(10000,'now',1000,1000).id,5);
assert.equal(db.prepare(urnClaimQuery).get(10000,'now',1000,1000).id,6);
assert.equal(db.prepare(urnRetryClaimQuery).get(10000,'now',1000,1000).id,2);
assert.equal(db.prepare('SELECT state FROM urn_jobs WHERE id=1').get().state,'retry');
console.log('PASS: new UF discovery, repeated import continuation, dedicated due retry and retained failures.');

// A local cooldown must never become a failed network attempt.
db.exec("INSERT INTO urn_jobs VALUES(8,'index','RR','{}','retry',20,999999,0,'original','Consultas ao TSE pausadas por limite de acesso. Nova tentativa em 60 segundos.')");
db.prepare(urnRepairPauseQuery).run(12345);
const repaired=db.prepare('SELECT * FROM urn_jobs WHERE id=8').get();
assert.equal(repaired.state,'pending');assert.equal(repaired.next_ms,12345);assert.equal(repaired.attempts,19);assert.equal(repaired.updated,'original');assert.equal(repaired.error,null);
assert.equal(db.prepare('SELECT error FROM urn_jobs WHERE id=1').get().error,'TSE respondeu HTTP 404');
db.prepare(urnRepairPauseQuery).run(99999);assert.equal(db.prepare('SELECT attempts FROM urn_jobs WHERE id=8').get().attempts,19);
let wait=5000;class TsePausedError extends Error{constructor(retryAt){super('paused');this.retryAt=retryAt;}}
const adapter={prepare(sql){let values=[];return {bind(...v){values=v;return this},async run(){return db.prepare(sql).run(...values)},async first(){return db.prepare(sql).get(...values)??null}}}};
globalThis.urnPauseTest={db:adapter,tsePause:async()=>wait,TsePausedError};
let queue=fs.readFileSync('lib/urn-queue.ts','utf8').replace(/import .* from .*;\n/g,'');
queue=`const {db,tsePause,TsePausedError}=globalThis.urnPauseTest;const getStorage=()=>({db});const internationalOnly=()=>false;const capture=async()=>{throw new TsePausedError(Date.now()+3000)};const urnRepairPauseQuery=${JSON.stringify(urnRepairPauseQuery)};const urnClaimQuery=${JSON.stringify(urnClaimQuery)};const urnRetryClaimQuery=${JSON.stringify(urnRetryClaimQuery)};\n`+queue;
const queueJs=ts.transpileModule(queue,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {tick}=await import('data:text/javascript;base64,'+Buffer.from(queueJs).toString('base64'));
const before=db.prepare('SELECT id,attempts,updated FROM urn_jobs ORDER BY id').all();
const paused=await tick();assert.equal(paused.processed,false);assert.equal(paused.pauseMs,5000);assert.deepEqual(db.prepare('SELECT id,attempts,updated FROM urn_jobs ORDER BY id').all(),before);
wait=0;const race=await tick();assert.equal(race.processed,false);assert.ok(race.pauseMs>0&&race.pauseMs<=3000);const raced=db.prepare('SELECT * FROM urn_jobs WHERE id=?').get(race.id);assert.equal(raced.error,null);assert.equal(raced.state,'pending');assert.equal(raced.attempts,before.find(j=>j.id===race.id).attempts);
console.log('PASS: legacy local pauses repaired once, HTTP failures retained, pause claims no jobs, concurrent pause rolls back attempt without failure.');
