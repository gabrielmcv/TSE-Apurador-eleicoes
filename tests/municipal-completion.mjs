import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const js=ts.transpileModule(fs.readFileSync('lib/municipal-completion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {municipalCompletion}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const result=municipalCompletion([{sections:100,totalSections:100},{sections:1,totalSections:10},{sections:0,totalSections:90}],4);
assert.equal(result.sectionPercent,50.5);assert.equal(result.municipalityPercent,25);assert.equal(result.complete,1);assert.equal(result.partial,1);assert.equal(result.withoutTotalization,1);assert.equal(result.missing,1);
assert.equal(municipalCompletion([],5571).sectionPercent,null);
assert.equal(municipalCompletion([{sections:null,totalSections:null}],2).complete,0);
console.log('PASS: section-weighted progress, municipal completion, zero/partial/missing captures and unknown denominators.');
