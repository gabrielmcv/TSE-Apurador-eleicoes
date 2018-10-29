<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="Sistema simples para contabilidade, audição básica e apuração dos dados sobre votação disponibilizados pelo TSE">
    <meta name="author" content="Gabriel Matosinhos">

    <title>Apuração Eleitoral - 2018</title>

    <!-- Bootstrap core CSS -->
    <link href="https://getbootstrap.com/docs/4.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="http://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="https://getbootstrap.com/docs/4.0/examples/dashboard/dashboard.css" rel="stylesheet">
</head>

<body>
    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
        <a class="navbar-brand col-sm-3 col-md-2 mr-0" href="#">#APURACAOELEITORAL</a>
        <ul class="navbar-nav px-3">
            <li class="nav-item text-nowrap">
                <a class="nav-link" href="#"></a>
            </li>
        </ul>
    </nav>

    <div class="container-fluid">
        <div class="row">

            <main role="main" class="col-md-12 ml-sm-auto col-lg-12 pt-3 px-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                    <h1 class="h2">Eleições 2018</h1>
                </div>

                <div class="row">
                    <section class="col-md-5 py-5 order-md-1 bg-light">

                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-6 box-shadow">
                                    <img class="card-img-top" data-src="img/1.jpg" alt="Fernando Haddad" src="img/1.jpg" data-holder-rendered="true">
                                    <div class="card-body">
                                        <h3>Fernando Haddad</h3>            
                                        <h5 class="votos-2" style="font-weight: 100;"></h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-6 box-shadow">
                                    <img class="card-img-top" data-src="img/2.jpg" alt="Jair Bolsonaro" src="img/2.jpg" data-holder-rendered="true">
                                    <div class="card-body">
                                        <h3>Jair Bolsonaro</h3>
                                        <h5 class="votos-1" style="font-weight: 100;"></h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" class="last_id" value="0"> <!-- Armazena o último id -->
                    </section>
                    <section class="col-md-7 order-md-2">
                        <canvas id="barChart" width="400" height="220"></canvas>

                        <h2>Atualização da apuração</h2>
                        <div class="table-responsive">
                            <table class="table table-striped table-sm" id="updateTable">
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th>Candidato</th>
                                        <th>Votos adicionados</th>
                                        <th>Hora</th>
                                    </tr>
                                </thead>
                                <tbody class="updateApu"></tbody>
                            </table>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    </div>

<!-- Bootstrap core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
<script src="https://getbootstrap.com/docs/4.0/assets/js/vendor/popper.min.js"></script>
<script src="https://getbootstrap.com/docs/4.0/dist/js/bootstrap.min.js"></script>

<!-- Graphs -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.min.js"></script>
<script src="http://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js"></script>
<script>

var ctx = document.getElementById("barChart").getContext("2d");

// Variáveis iniciais do gráfico de barras

var horizontalBarChartData = {
    labels: [],
    datasets: [{
        backgroundColor: "#CCCCCC",
        data: []
    }]

};

// Cria o gráfico de barras

var chart = new Chart(ctx, {
    type: "horizontalBar",
    data: horizontalBarChartData,
    options: {

        scales: {
            xAxes: [{
                ticks: {
                    min: 0,
                    max: 100,
                }
            }],                
            yAxes:[{
                barThickness: 5,                    
                ticks: {
                    beginAtZero:true,
                    mirror: false
                },
            }],
        },
        responsive: true,
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: 'Apuração nos Estados/Exterior e Brasil (Total)'
        },
        animation: {
            duration: 1
        }
    }
});

// Cria a tabela recebendo o último id processado para poder buscar resultados novos

var last_id = $(".last_id").val();

$('#updateTable').DataTable( {
    "bLengthChange": false,
    "bInfo": false,
    "bFilter": false,
    "bAutoWidth": false,  
    ajax: "service.php?p=getNewVote&t=1&id="+last_id,
    "order": [[ 3, "desc" ]]
} );

updatePage(last_id);

function updatePage(last_id){

    // Atualiza os dados com a base do TSE

        $.ajax({
                type: 'GET',
                url: 'get_data.php',
                dataType: "json",
                success: function (result){
                    console.log("Requisição feita com sucesso");
                }
        });

    // Retorna o estado da apuração de votos nos estados

        $.ajax({
                type: 'GET',
                url: 'service.php?p=getApuResults',
                dataType: "json",
                success: function (result){
                    var horizontalBarChartData = {
                        labels: result["label"],
                        datasets: [{
                            backgroundColor: "#3e8fe0",
                            data: result["data"]
                        }]

                    };
                    chart.data = horizontalBarChartData;
                    chart.update();
                }
        });

    // Retorna os votos de cada candidato

        $.ajax({
                type: 'GET',
                url: 'service.php?p=getVoteResults',
                dataType: "json",
                success: function (result){
                    $( result ).each(function() {
                        $(".votos-"+this.candidato).text(this.valores.votos+" ("+this.valores.perc+" %)")
                    });
                }
        });

    // Adiciona à tabela o número de votos recebidos pelo candidato desde a última checagem

        $.ajax({
                type: 'GET',
                url: 'service.php?p=getNewVote&id='+last_id,
                dataType: "json",
                success: function (result){
                    last_id = result["last_id"];
                    result.splice($.inArray("last_id", result),1);

                    if(last_id) $(".last_id").val(last_id);
                }
        });

        $('#updateTable').DataTable().ajax.reload(null, false);

}

setInterval(updatePage(last_id), 15000); // Atualiza os dados de 15 em 15 segundos

</script>
</body>
</html>