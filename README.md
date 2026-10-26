# Apurador de Eleições 2026

Painel independente para consultar e arquivar resultados publicados pelo Tribunal Superior Eleitoral (TSE), com histórico, auditoria, mapa municipal e acesso por inteligência artificial via MCP.

**Site:** https://eleicoes.3ree.org  
**Integração MCP:** https://eleicoes.3ree.org/integracoes/mcp

Esta versão substitui a aplicação PHP antiga. O histórico anterior permanece nos commits do repositório. O projeto não é um serviço oficial do TSE.

## Funcionalidades

- Resultados nacionais, estaduais e exterior para presidente, governador, senador e deputados federal, estadual e distrital, conforme disponibilidade oficial.
- Seletor de eleição com acervos separados para o primeiro e o segundo turno de 2026.
- Badges de eleito, suplente e não eleito conforme a situação informada pelo TSE.
- Histórico paginado, alterações de votos, gráficos de evolução e downloads de respostas originais.
- Mapa presidencial colorido pela liderança municipal; interação por estado e lista municipal do candidato ordenada por percentual decrescente, com votos como desempate.
- Arquivamento de BU, RDV, imagens, logs e demais arquivos anunciados nos índices oficiais, com filas persistentes e novas tentativas.
- Seção de exportação com quantidade de arquivos e tamanho total. A geração do ZIP64 é bloqueada enquanto a coleta não cumprir os critérios de conclusão.
- Auditoria comparativa dos turnos, com mapa municipal, ranking ordenável, filtros fixos e identificação de bases ainda incompletas.
- Parecer de IA versionado, com fontes, métricas reproduzíveis, hashes, limites e questões para investigação. Seu conteúdo publicado é entregue no HTML inicial e atualizado pelo cliente.
- Metadados por página e turno, dados estruturados, 16 imagens Open Graph de 1200 × 630, Twitter Cards, sitemap, robots.txt e guia textual llms.txt.
- Consultas MCP públicas e publicação autenticada do parecer pelo proprietário.

## Turnos e coleta

O primeiro turno está identificado como **1º turno - 2026**. A coleta de resultados está encerrada; o arquivamento de arquivos de urnas possui controle separado e pode continuar após a totalização dos votos.

O segundo turno de **25/10/2026** utiliza acervo separado, com configuração própria do pleito. A cobertura municipal e o recebimento dos arquivos de urna são acompanhados separadamente; ter um arquivo recebido não significa ter todas as seções totalizadas. A programação das tarefas na hospedagem é externa ao Git e precisa ser recriada em outra implantação.

Com o painel aberto, os coletores habilitados executam ciclos frequentes. Sem navegador, uma tarefa da hospedagem chama o endpoint autenticado `/api/coleta/automatica` em lotes horários, por até dez minutos por execução. Isso não equivale a um serviço permanente de atualização em segundos.

Respostas indisponíveis e limites do TSE são tratados com pausas e novas tentativas. A fila de arquivos usa intervalos progressivos e reserva capacidade para tentativas elegíveis. Consulte a interface para a cobertura atual; o código não contém o acervo de produção.

## Arquitetura

- React, TypeScript e Vinext, com rotas compatíveis com o App Router do Next.js.
- Cloudflare Workers para renderização e APIs.
- D1 (`DB`) para metadados, resultados normalizados, filas e logs.
- R2 (`BUCKET`) para originais, arquivos de urnas e exportações.
- Zod para validar os argumentos das ferramentas MCP.

| Diretório | Conteúdo |
| --- | --- |
| `app/` | Páginas, componentes, APIs e endpoint MCP |
| `lib/` | Integração TSE, arquivo, filas e isolamento por turno |
| `db/` | Acesso ao armazenamento e esquema |
| `drizzle/` | Migrações SQL do banco |
| `public/` | Malha municipal, fontes cartográficas e recursos visuais |
| `tests/` | Verificações e fixtures |
| `scripts/` | Instalação, execução, build e preparação da malha |

## Desenvolvimento

Requer Node.js **22.13 ou superior** e o gerenciador indicado em `package.json` (pnpm 11.25.0).

```sh
git clone https://github.com/gabrielmcv/TSE-Apurador-eleicoes.git
cd TSE-Apurador-eleicoes
npm run install:ci
npm run dev
```

Build de produção:

```sh
npm run build
```

Os scripts escolhem o perfil de execução disponível. As rotas que consultam o acervo precisam dos bindings D1/R2 e de seu esquema inicializado; a instalação de dependências não copia os dados do site publicado. Consulte `db/`, `drizzle/`, os scripts e a configuração do Worker antes de executar uma implantação própria.

## Código sem acervo

Este repositório distribui o sistema, não os dados coletados em produção. Resultados arquivados, BUs, RDVs, logs de coleta e ZIPs permanecem no armazenamento do site. A malha geográfica, o catálogo de municípios e os recursos visuais são incluídos para a interface funcionar. As fixtures de teste não são o acervo eleitoral.

Uma instalação nova começa sem histórico. A configuração atual encerra a coleta de resultados do primeiro turno em `lib/election-context.ts`; para uma instalação destinada a realizar sua própria coleta, revise os controles de encerramento e as configurações de eleição antes de ativar o coletor. Clonar o código não recupera versões anteriores à primeira captura dessa instalação.

## Hospedagem e configuração

A publicação atual utiliza Sites do ChatGPT. `.openai/hosting.json` identifica o projeto existente e declara D1, R2 e a capacidade MCP. Não reutilize esse identificador para criar um site diferente.

Para uma implantação independente, configure o Worker, os bindings `DB` e `BUCKET`, o esquema SQL, os segredos e o agendador. `COLLECTOR_KEY` é um segredo de runtime usado pelo coletor automático; não deve entrar no Git ou no frontend. OAuth, domínio, tarefa recorrente e dados de produção não são provisionados apenas por clonar este repositório.

## MCP para ferramentas de IA

**Endpoint funcional provisionado pela plataforma:**

```text
https://apuracao-eleicoes-2026.useup.chatgpt.site/mcp
```

Transporte Streamable HTTP, com OAuth gerenciado pela hospedagem Sites. O domínio público das páginas é `eleicoes.3ree.org`; o MCP/OAuth permanece vinculado ao endpoint acima. `https://eleicoes.3ree.org/mcp` ainda não foi habilitado. Um CNAME sozinho não configura roteamento, SSL ou o recurso OAuth.

No ChatGPT, abra **Plugins → Personal → Created by you** para instalar/conectar o aplicativo do site. Outros clientes precisam suportar o transporte e a autenticação oferecidos pela plataforma.

| Ferramenta | Consulta |
| --- | --- |
| `consultar_resultados` | Último resultado por UF e cargo |
| `consultar_historico` | Versões, originais e hashes |
| `consultar_alteracoes` | Diferenças entre capturas e alertas |
| `consultar_municipios` | Votos presidenciais municipais por candidato |
| `consultar_urnas` | Inventário territorial, cobertura e pendências |
| `consultar_logs` | Tentativas de coleta e metadados |
| `consultar_acervo` | Eleição, quantidade, tamanho e situação do ZIP |
| `consultar_parecer_ia` | Parecer publicado, versão, evidências e horários |
| `consultar_evidencias_parecer` | Recálculo das métricas, restrito ao proprietário |
| `publicar_parecer_ia` | Publicação versionada, restrita ao proprietário autenticado |

Use `eleicao="2026-1"` ou `eleicao="2026-2"`. As consultas de resultados e do acervo são de leitura. O proprietário autenticado também pode recalcular evidências e publicar o parecer de IA; isso não modifica votos ou os documentos originais.

Exemplos de perguntas:

- Em qual intervalo o candidato X teve o maior aumento de votos? Quais estados registraram os maiores aumentos nesse intervalo?
- Quando X ultrapassou Y no total nacional? Como os totais estaduais mudaram nesse período?
- Em quais municípios X teve os maiores percentuais? Mostre os votos e agrupe por estado.
- Qual foi a última alteração de votos de X em cada estado? Diferencie o horário do TSE do horário de captura.

## Fontes, integridade e limites

Documentação técnica do TSE: https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados. A integração utiliza os formatos de resultados e os índices oficiais EA11, EA16 e EA18 para localizar os arquivos de urnas.

Os arquivos preservam os bytes entregues pelo Fetch, com SHA-256, URL original e horários disponíveis de geração, totalização, recebimento e armazenamento. Não há validação criptográfica das assinaturas oficiais do TSE nem decodificação completa de BU/RDV. O hash verifica a integridade da cópia, não a autenticidade da assinatura.

O TSE publica totais acumulados. A coleta não garante todas as versões intermediárias nem permite reconstruir a sequência individual de votos. Capturas nacionais e estaduais podem ter horários distintos. Recebimento pelo site não é o instante em que um candidato recebeu um voto.

Brasil presidencial já inclui exterior; não some BR e ZZ. Municípios sem captura permanecem sem dados, sem preenchimento pelos totais estaduais. Diferenças ou reduções entre versões não constituem, por si só, evidência de fraude.

## Comparativo e parecer de IA

A página `/comparativo` compara a quantidade de votos, crescimento percentual e participação em pontos percentuais. A intensidade do mapa usa escala logarítmica. Dados incompletos são identificados e não devem ser tratados como perdas reais de votos. O rodapé fixo facilita a troca de candidato, estado e métrica.

O parecer é uma análise assistida por IA, vinculada a uma versão de evidências. Não é laudo oficial ou auditoria forense. A consistência das somas, o comportamento político e as condições de votação têm limites de verificação próprios; o texto distingue constatações, interpretações e pendências. Os dados e o parecer publicados ficam no armazenamento de produção, não neste repositório.

## Validação

A versão sincronizada corresponde ao código publicado no site, incluindo SEO, imagens de compartilhamento e melhorias de interface. Passou pelo build de produção, pela verificação TypeScript e pelos testes específicos de SEO. Os 16 endereços canônicos e suas imagens também foram conferidos em produção.

```sh
node tests/seo.mjs
```

As imagens sociais podem ser regeneradas com `node scripts/generate-og.mjs`, usando o renderizador Sharp instalado com as dependências do projeto.
 `tests/` reúne verificações de normalização, histórico, isolamento e comportamento de componentes/filas. A disponibilidade do TSE, a conexão OAuth e o agendador também dependem da infraestrutura de implantação; o build não valida esses serviços externos.

## Licença

Consulte [LICENSE](LICENSE), preservada do repositório original.
