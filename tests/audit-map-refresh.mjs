import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('app/PresidentialMap.tsx','utf8');
const effect=source.slice(source.indexOf('  let active=true,inFlight=false;'),source.indexOf('\n },[round]);'));
const events={},windowEvents={},timers=[];let calls=0,data=null,error='',cleanup;
const context={AbortController,AbortSignal,Date,document:{visibilityState:'visible',addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]},window:{addEventListener:(k,v)=>windowEvents[k]=v,removeEventListener:k=>delete windowEvents[k]},setInterval:(fn,ms)=>{assert.equal(ms,60000);timers.push(fn);return 1;},clearInterval:()=>timers.pop(),roundFetch:async()=>({ok:true,json:async()=>({checked:String(++calls),municipalities:[]})}),setData:v=>data=v,setError:v=>error=v};
vm.createContext(context);
// Remove only the TypeScript assertion to run the production effect unchanged.
cleanup=vm.runInContext('(function(){'+effect.replace(' as MapData','')+'})()',context);
await new Promise(setImmediate);assert.equal(data.checked,'1');
await timers[0]();await new Promise(setImmediate);assert.equal(data.checked,'2');
await windowEvents.focus();await new Promise(setImmediate);assert.equal(data.checked,'3');
context.roundFetch=async()=>{throw Error('offline');};await timers[0]();await new Promise(setImmediate);assert.equal(data.checked,'3');assert.match(error,/últimos dados/);
cleanup();assert.equal(timers.length,0);assert.equal(Object.keys(events).length,0);assert.equal(Object.keys(windowEvents).length,0);
console.log('PASS: independent minute polling, focus refresh, preserved data on failure and cleanup.');
