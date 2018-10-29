# Apurador para Eleições

Sistema simples para contabilidade, audição básica e apuração dos dados eleitorais disponibilizados pelo TSE.

## Sobre o sistema

Este é um sistema simples para obtenção de dados eleitorais divulgados pelo TSE. O código permite a visulização em tempo real da apuração em todos os estados, dos votos recebidos (com o estado procedente) e do resultado final da votação. Além dos dados de votação, as estatísticas gerais da eleição também ficam salvas no banco.

Tenha em mente que o sistema foi feito em menos de 24h utilizando Bootstrap, Chart.js, PHP e Mysql com o objetivo de ser rápido, não robusto.

A princípio não tenho interesse para levar esse projeto a frente (que foi feito apenas para observar possíveis inconsistências nas eleições presidenciais brasileiras de 2018). O código pode ser otimizado e melhor trabalhado para trazer informações mais profundas e precisas já que os dados são obtidos e concatenados (ao invés de sobrepostos).

### Pré-requisitos

PHP e Mysql em um servidor HTTP de sua preferência.

### Instalação

Instale o [Backup do Banco](apuracao.sql) (que já inclui os dados do segundo turno da Eleição de 2018) e modifique o arquivo [Config.ini](Config.ini) com as credenciais de acesso do Mysql

### Observações

Por algum motivo o TSE utiliza um id móvel (eq) baseado na posição do candidato durante as eleições. Isso torna a visualização dos dados inconsistente se não for observado e tratado no momento. Obviamente, é possível reparar esse "erro".

## Feito com

* [Bootstrap](https://getbootstrap.com/) - Framework Front-end
* [EasyPHP](http://www.easyphp.org/) - Webserver
* [Chart.js](https://www.chartjs.org/) - Gráficos
* [Mysql](https://www.mysql.com/) - Banco de Dados

## Contribuição

Sinta-se livre para contribuir com o projeto mas não se esqueça de descrever os requests.

## Autor

* **Gabriel Matosinhos** - [Linkedin](https://www.linkedin.com/in/gabrielmatosinhos/)

## Licença

Este projeto está sob a Licença MIT - [LICENSE.md](LICENSE.md)
