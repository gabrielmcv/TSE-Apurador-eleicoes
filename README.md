# Apurador para Eleições

Sistema simples para contabilidade, audição básica e apuração dos dados sobre votação disponibilizados pelo TSE.

## Sobre o sistema

Este é um sistema simples para obtenção de dados eleitorais divulgados pelo TSE. O código permite a visulização em tempo real do estado da apuração em todos os estados, dos votos recebidos (com o estado procedente) e do resultado final da votação. Além dos dados de votação, as estatísticas gerais da eleição também ficam salvas no banco.

O sistema foi feito em menos de 24h utilizando Bootstrap, Chart.js, PHP e Mysql.

A princípio não tenho interesse para levar esse projeto a frente (que foi feito apenas para observar possíveis inconsistências nas eleições presidenciais brasileiras de 2018). O código pode ser otimizado e melhor trabalhado para trazer informações mais fundas e precisas já que os dados são obtidos e concatenados (ao invés de sobrepostos).

### Pré-requisitos

PHP e Mysql em um servidor HTTP de sua preferência.

### Instalação

Instale o backup do banco (apuracao.sql) - que já inclui os dados do segundo turno da Eleição de 2018- e modifique o arquivo Config.ini com as credenciais de acesso do Mysql

### Observações

Por algum motivo o TSE utiliza um id móvel (eq) baseado na posição do candidato durante as eleições. Isso torna a visualização dos dados inconsistente se não for observado. É possível reparar esse "erro", mas não tenho tempo para isso.

## Feito com

* [Bootstrap](https://getbootstrap.com/) - Framework Front-end
* [EasyPHP](http://www.easyphp.org/) - Webserver
* [Chart.js](https://www.chartjs.org/) - Gráficos
* [Mysql](https://www.mysql.com/) - Banco de Dados

## Contribuição

Sinta-se livre para contribuir com o projeto, mas não se esqueça de descrever muito bem seus requests.

## Autor

* **Gabriel Matosinhos** [Linkedin](https://www.linkedin.com/in/gabrielmatosinhos/)

## Licença

Este projeto está sob a Licença MIT [LICENSE.md](LICENSE.md)
