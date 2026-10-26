export function GET(){return new Response(`# Eleições 2026 · 3ree

> Painel independente com cópias dos dados públicos disponibilizados pelo Tribunal Superior Eleitoral (TSE). Domínio principal: https://eleicoes.3ree.org. Não é um site oficial do TSE.

## Conteúdo
- [Presidente e primeiro turno](https://eleicoes.3ree.org/?eleicao=2026-1): resultados arquivados de 04/10/2026.
- [Segundo turno](https://eleicoes.3ree.org/segundo-turno): resultados e documentos arquivados de 25/10/2026, com cobertura e pendências próprias.
- [Outros resultados](https://eleicoes.3ree.org/painel?aba=resultados): cargos e abrangências.
- [Exterior](https://eleicoes.3ree.org/painel?aba=exterior&uf=ZZ&cargo=1): votação presidencial no exterior.
- [Auditoria](https://eleicoes.3ree.org/painel?aba=auditoria): alterações entre versões recebidas, séries e situação do pacote ZIP.
- [Histórico](https://eleicoes.3ree.org/painel?aba=historico): versões e originais com metadados.
- [Urnas](https://eleicoes.3ree.org/painel?aba=urnas): BU, RDV, logs e índices efetivamente obtidos.
- [Logs](https://eleicoes.3ree.org/painel?aba=logs): tentativas, HTTP e horários.
- [MCP](https://eleicoes.3ree.org/integracoes/mcp): ferramentas de consulta com autenticação gerenciada pela plataforma. O endereço de conexão OAuth provisionado pode permanecer no domínio da plataforma.

## Segundo turno e comparação
- [Auditoria comparativa](https://eleicoes.3ree.org/comparativo): mapa e ranking municipal; comparação entre turnos e parecer de IA com evidências, fontes e limitações.
- [Auditoria do segundo turno](https://eleicoes.3ree.org/segundo-turno/painel?aba=auditoria): cobertura das capturas, seções totalizadas, municípios concluídos e versões recebidas.
- [Urnas do segundo turno](https://eleicoes.3ree.org/segundo-turno/painel?aba=urnas): arquivos efetivamente recebidos e pendências.
- [Histórico do segundo turno](https://eleicoes.3ree.org/segundo-turno/painel?aba=historico): originais, versões e horários.

## Consultas de dados
GET /api/resultados?uf=BR&cargo=1
GET /api/historico?uf=BR&cargo=1
GET /api/auditoria?uf=BR&cargo=1
GET /api/urnas?uf=BR
GET /api/acervo/zip
GET /api/comparativo
GET /api/parecer-ia
GET /api/parecer-ia?evidencias=1
GET /api/municipios?ibge=3550308&eleicao=2026-2
Selecione o segundo turno com eleicao=2026-2. BR presidencial inclui exterior; exterior=0 nas consultas compatíveis usa a composição das UFs sem exterior. Cargos: 1 presidente, 3 governador, 5 senador, 6 deputado federal, 7 deputado estadual, 8 distrital. O segundo turno contempla apenas presidente e governadores onde houver disputa oficial.

## Parecer de IA
O parecer é análise assistida por IA, não laudo oficial ou certificação forense. Consulte a versão publicada, generatedAt, evidenceHash, analysisHash, fontes e cobertura. Não trate expectativas de transferência política como fluxos individuais demonstrados. O percentual de municípios concluídos não equivale ao percentual de boletins de urna reconciliados. Não infira a conclusão atual a partir deste guia: consulte o JSON publicado. A publicação do parecer é restrita ao proprietário autenticado; consultas públicas são de leitura.

## Interpretação e proveniência
Os resultados são totais acumulados das capturas recebidas, não votos individuais. Preserve a fonte, geração no TSE, recebimento e armazenamento quando presentes. Não é possível reconstruir versões intermediárias que não foram capturadas. Ausência de dados não significa zero votos. SHA-256 verifica integridade da cópia, não autenticidade de assinatura do TSE. Reduções ou alterações não demonstram fraude por si mesmas. Dados de municípios e UFs podem ter horários distintos. A coleta fechada funciona em tarefas horárias por lotes; a consulta em segundos depende do painel aberto. O ZIP só fica disponível após a conclusão das pendências e da preparação. Use como fonte primária os originais arquivados e https://resultados.tse.jus.br/.
`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});}
