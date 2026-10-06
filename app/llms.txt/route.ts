export function GET(){return new Response(`# Eleições 2026 · 3ree

> Painel independente com cópias dos dados públicos disponibilizados pelo Tribunal Superior Eleitoral (TSE). Domínio principal: https://eleicoes.3ree.org. Não é um site oficial do TSE.

## Conteúdo
- [Presidente e primeiro turno](https://eleicoes.3ree.org/): resultados arquivados de 04/10/2026.
- [Segundo turno](https://eleicoes.3ree.org/segundo-turno): acervo separado; coleta programada para 25/10/2026 às 15h de Brasília, condicionada à publicação oficial.
- [Outros resultados](https://eleicoes.3ree.org/painel?aba=resultados): cargos e abrangências.
- [Exterior](https://eleicoes.3ree.org/painel?aba=exterior&uf=ZZ&cargo=1): votação presidencial no exterior.
- [Auditoria](https://eleicoes.3ree.org/painel?aba=auditoria): alterações entre versões recebidas, séries e situação do pacote ZIP.
- [Histórico](https://eleicoes.3ree.org/painel?aba=historico): versões e originais com metadados.
- [Urnas](https://eleicoes.3ree.org/painel?aba=urnas): BU, RDV, logs e índices efetivamente obtidos.
- [Logs](https://eleicoes.3ree.org/painel?aba=logs): tentativas, HTTP e horários.
- [MCP](https://eleicoes.3ree.org/integracoes/mcp): ferramentas de consulta com autenticação gerenciada pela plataforma. O endereço de conexão OAuth provisionado pode permanecer no domínio da plataforma.

## Consultas de dados
GET /api/resultados?uf=BR&cargo=1
GET /api/historico?uf=BR&cargo=1
GET /api/auditoria?uf=BR&cargo=1
GET /api/urnas?uf=BR
GET /api/acervo/zip
Selecione o segundo turno com eleicao=2026-2. BR presidencial inclui exterior; exterior=0 nas consultas compatíveis usa a composição das UFs sem exterior. Cargos: 1 presidente, 3 governador, 5 senador, 6 deputado federal, 7 deputado estadual, 8 distrital. O segundo turno contempla apenas presidente e governadores onde houver disputa oficial.

## Interpretação e proveniência
Os resultados são totais acumulados das capturas recebidas, não votos individuais. Preserve a fonte, geração no TSE, recebimento e armazenamento quando presentes. Não é possível reconstruir versões intermediárias que não foram capturadas. Ausência de dados não significa zero votos. SHA-256 verifica integridade da cópia, não autenticidade de assinatura do TSE. Reduções ou alterações não demonstram fraude por si mesmas. Dados de municípios e UFs podem ter horários distintos. A coleta fechada funciona em tarefas horárias por lotes; a consulta em segundos depende do painel aberto. O ZIP só fica disponível após a conclusão das pendências e da preparação. Use como fonte primária os originais arquivados e https://resultados.tse.jus.br/.
`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});}
