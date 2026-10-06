import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../lib/candidate-colors.ts',import.meta.url),'utf8');
assert.match(source,/'LULA':'#CC092F'/);
assert.match(source,/'FLAVIO BOLSONARO':'#005CA9'/);
assert.match(source,/'ZEMA':'#EC671C'/);
assert.match(source,/PARTY_COLORS/);
assert.match(source,/hash%FALLBACK_COLORS\.length/);
console.log('candidate color mappings: ok');
