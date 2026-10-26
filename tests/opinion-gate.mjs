import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const js=ts.transpileModule(fs.readFileSync('lib/opinion-gate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {opinionGate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(opinionGate(5013).stage,0);assert.equal(opinionGate(5014).stage,90);assert.equal(opinionGate(5570).stage,90);assert.equal(opinionGate(5571).stage,100);assert.equal(opinionGate(0).stage,0);assert.equal(opinionGate(4645).stage,0);
console.log('PASS: exact 90% threshold at 5,014 completed municipalities, 100% at 5,571; no rounding-based early publication.');
