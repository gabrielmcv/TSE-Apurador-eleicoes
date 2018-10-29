<?php

require("config.php");

$p = isset($_GET["p"]) ? $_GET["p"] : NULL;
$id = isset($_GET["id"]) ? $_GET["id"] : NULL;
$t = isset($_GET["t"]) ? 1 : 0;

if($p == "getApuResults"){

	$query = "SELECT * FROM(

			(SELECT f.uf, (SELECT MAX(e_apurado)/MAX(e_nao_apurado)*100 FROM estatisticas_estados WHERE uf = f.uf) as perc FROM estatisticas_estados f
			ORDER BY f.timestamp DESC)
			UNION ALL
			(SELECT 'brasil', (MAX(e_apurado)/MAX(e_nao_apurado))*100 as perc FROM estatisticas_brasil
			ORDER BY timestamp DESC)
			UNION ALL
			(SELECT 'exterior', (MAX(e_apurado)/MAX(e_nao_apurado))*100 as perc FROM estatisticas_exterior
			ORDER BY timestamp DESC)
			) as estatisticas
			GROUP BY uf";

	$result = $conn->query($query);

	$label = array();
	$data = array();

	foreach ($result as $key => $value) {

		array_push($label, strtoupper($value["uf"]));
		array_push($data, $value["perc"]);
		
	}

	$end = array("label" => $label, "data" => $data);
	echo json_encode($end);

}

if($p == "getVoteResults"){

	$query = "SELECT id_candidato, votos_int as votos, (votos_int/(SELECT validos FROM estatisticas_brasil ORDER BY timestamp DESC LIMIT 1))*100 as perc FROM votos_brasil ORDER BY timestamp DESC LIMIT 2";

	$result = $conn->query($query);

	$end = array();

	foreach ($result as $key => $value) {

		$array = array("candidato" => $value["id_candidato"], "valores" => ["votos" => number_format($value["votos"]), "perc" => number_format($value["perc"], 2)]);
		
		array_push($end, $array);
		
	}

	echo json_encode($end);

}

if($p == "getNewVote" && isset($id) && isset($t)){

	$query = "SELECT f.id_votos_uf, c.nome, f.uf, f.votos_int, IF(votos_int > 0, f.votos_int-(SELECT votos_int FROM votos_estados WHERE id_candidato = f.id_candidato AND uf = f.uf AND id_votos_uf < f.id_votos_uf ORDER BY id_votos_uf DESC LIMIT 1), 0) as votos_ganhos, timestamp FROM votos_estados f INNER JOIN candidato c ON c.id_candidato = f.id_candidato WHERE f.id_votos_uf > '".$id."' ORDER BY f.timestamp DESC";

	$result = $conn->query($query);
	$total = $result->num_rows;

	$end = array();

	if($t == 1){

		foreach ($result as $key => $value) {
			$array = array(strtoupper($value["uf"]), $value["nome"], $value["votos_ganhos"], $value["timestamp"]);
			array_push($end, $array);
		}

		echo json_encode(array("data" => $end));

	} else {

		foreach ($result as $key => $value) {
			$array = array("uf" => $value["uf"], "dados" => ["candidato" => $value["nome"], "votos_ganhos" => $value["votos_ganhos"], "hora" => $value["timestamp"]]);
			
			array_push($end, $array);
			if($key == $total-1) array_push($end, array("last_id" => $value["id_votos_uf"]));		
		}

		echo json_encode($end);

	}

}

$conn->close();

?>