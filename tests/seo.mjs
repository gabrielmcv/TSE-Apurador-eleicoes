import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const tse=url(compile('lib/tse.ts'));
const view=url(compile('lib/panel-view.ts').replace("'./tse'",JSON.stringify(tse)));
const {sitemapPages,pageMetadata,pageStructuredData,panelSEO}=await import(url(compile('lib/seo.ts').replace("'./panel-view'",JSON.stringify(view))));
const pages=sitemapPages();assert.equal(pages.length,16);assert.equal(new Set(pages.map(p=>p.path)).size,16);assert.equal(new Set(pages.map(p=>p.image)).size,16);
assert(pages.some(p=>p.path==='/?eleicao=2026-1'));assert(!pages.some(p=>p.path==='/'));
for(const p of pages){const meta=pageMetadata(p);assert.equal(meta.alternates.canonical,meta.openGraph.url);assert.equal(meta.title,meta.openGraph.title);assert.equal(meta.title,meta.twitter.title);assert.equal(meta.description,meta.twitter.description);assert.equal(meta.openGraph.images[0].url,meta.twitter.images[0].url);assert(meta.openGraph.images[0].alt);const image=fs.readFileSync(`public/og/${p.image}.png`);assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);const schema=pageStructuredData(p);assert.equal(schema['@graph'][0].url,meta.alternates.canonical);assert.equal(schema['@graph'][0].name,p.title);}
assert.equal(panelSEO({aba:'exterior',uf:'SP'},2).path,'/segundo-turno/painel?aba=exterior&uf=ZZ&cargo=1');
assert.equal(panelSEO({aba:'auditoria',uf:'SP',candidate:'123'},2).path,'/segundo-turno/painel?aba=auditoria');
const sitemap=compile('app/sitemap.xml/route.ts').replace("'../../lib/seo'",JSON.stringify(url(compile('lib/seo.ts').replace("'./panel-view'",JSON.stringify(view)))));
const xml=await (await import(url(sitemap))).GET().text();assert.equal((xml.match(/<loc>/g)||[]).length,16);assert(xml.includes('&amp;uf=ZZ&amp;cargo=1'));
const guide=fs.readFileSync('app/llms.txt/route.ts','utf8');assert(!guide.includes('coleta programada'));assert(guide.includes('/api/parecer-ia'));assert(guide.includes('/comparativo'));
console.log('PASS: 16 distinct canonicals and OG images, Twitter parity, PNG dimensions, structured data, filter consolidation, complete sitemap and current AI guide.');
