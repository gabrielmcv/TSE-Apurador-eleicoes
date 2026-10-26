// Deterministic social cards: exact typography and the site's existing IBGE map.
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const sharpFolder=(await readdir('node_modules/.pnpm')).find(name=>name.startsWith('sharp@'));
if(!sharpFolder)throw new Error('Installed sharp renderer unavailable');
const sharp=require(resolve('node_modules/.pnpm',sharpFolder,'node_modules/sharp'));
const geometry=JSON.parse(await readFile('public/municipal-map.json','utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const pages=[
 ['primeiro-turno','1º TURNO · 04 OUT 2026',['Resultados do','primeiro turno'],'Votos, mapas e histórico das capturas.'],
 ['segundo-turno','2º TURNO · 25 OUT 2026',['Resultados do','segundo turno'],'Votos, mapas e histórico das capturas.'],
 ['comparativo','1º TURNO × 2º TURNO',['Auditoria','comparativa','dos turnos'],'Mapa municipal, evidências e parecer de IA.'],
 ['mcp','DADOS ELEITORAIS PARA IA',['O acervo eleitoral','na sua ferramenta','de inteligência artificial'],'Resultados e documentos via MCP.'],
];
const tabs=[['resultados',['Outros resultados'],'Votação por estado e cargo.'],['exterior',['Votação no','exterior'],'Resultados presidenciais fora do Brasil.'],['auditoria',['Auditoria de','alterações'],'Versões, cobertura e dados municipais.'],['historico',['Histórico de','resultados'],'Originais, fontes e horários preservados.'],['urnas',['Arquivos de urna'],'Boletins de urna, RDV, logs e pendências.'],['logs',['Logs de coleta'],'Tentativas, respostas HTTP e horários.']];
for(const round of [1,2])for(const [id,title,subtitle] of tabs)pages.push([`${id}-${round}`,`${round}º TURNO · ELEIÇÕES 2026`,title,subtitle]);
for(const [id,kicker,lines,subtitle] of pages){
 const max=Math.max(...lines.map(s=>s.length)),size=max>23?46:max>19?52:62;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#f4f6f6"/><rect x="22" y="22" width="1156" height="586" rx="24" fill="white" stroke="#e2e8e7"/>
 <rect x="66" y="62" width="40" height="40" rx="11" fill="#254b46"/><path d="M77 83h18m-9-9v18" stroke="#e5cc6e" stroke-width="3"/>
 <text x="120" y="90" font-family="DejaVu Sans,Arial" font-size="25" font-weight="bold" fill="#243d3a">apuração <tspan font-weight="normal" fill="#708078">2026</tspan></text>
 <text x="68" y="169" font-family="DejaVu Sans,Arial" font-size="15" font-weight="bold" letter-spacing="2" fill="#8c792d">${escape(kicker)}</text>
 ${lines.map((line,i)=>`<text x="66" y="${246+i*73}" font-family="DejaVu Sans,Arial" font-size="${size}" font-weight="bold" letter-spacing="-1.5" fill="#213e39">${escape(line)}</text>`).join('')}
 <text x="68" y="${lines.length>2?458:406}" font-family="DejaVu Sans,Arial" font-size="21" fill="#637772">${escape(subtitle)}</text>
 <svg x="832" y="166" width="290" height="300" viewBox="${geometry.viewBox}">${geometry.states.map(s=>`<path d="${s.path}" fill="#e9e0b5" stroke="white" stroke-width="4"/>`).join('')}</svg>
 <path d="M68 516H1132" stroke="#e5ebe8"/><text x="68" y="559" font-family="DejaVu Sans,Arial" font-size="16" fill="#657771">Painel independente · Dados públicos do TSE</text><text x="1132" y="559" text-anchor="end" font-family="DejaVu Sans,Arial" font-size="17" font-weight="bold" fill="#35574d">eleicoes.3ree.org</text>
 </svg>`;
 await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`public/og/${id}.png`);
}
console.log(`Generated ${pages.length} social cards (1200 × 630).`);
