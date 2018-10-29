<?php

/*
Arquivo para obteção dos dados disponibilizados pelo TSE
*/

// Arquivo de configuração
require("config.php");

$estados = array('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

// A partir daqui começa a obtenção de dados, existem três tipos de obtenção: Estadual, Brasil e Exterior. Cada uma das querys recebe de cada classe seus dados técnicos (como número de eleitores, votos totais, brancos, nulos e etc) e dados de votação.

if($atualizar_dados == 1){

	// ESTADOS	
	foreach ($estados as $key => $value) {

		$uf = strtolower($key);
		// URL XHR obtida em http://divulga.tse.jus.br/oficial/index.html
	    $url = "http://divulga.tse.jus.br/2018/divulgacao/oficial/296/dadosdivweb/".$uf."/".$uf."-c0001-e000296-w.js";
	    $result = json_decode(file_get_contents($url), true);

		$est = "INSERT IGNORE INTO `eleicao`.`estatisticas_estados`
				(`uf`,
				`eleitorado`,
				`e_apurado`,
				`e_nao_apurado`,
				`e_abstencao`,
				`e_comparecimento`,
				`secoes`,
				`s_totalizadas`,
				`s_nao_totalizadas`,
				`v_total`,
				`v_brancos`,
				`v_nulos`,
				`v_anulados`,
				`v_pendentes`,
				`validos`,
				`timestamp`)
				VALUES (
				'".$uf."',
				'".$result['e']."',
				'".$result['ea']."',
				'".$result['ena']."',
				'".$result['a']."',
				'".$result['c']."',
				'".$result['s']."',
				'".$result['st']."',
				'".$result['snt']."',
				'".$result['tv']."',
				'".$result['vb']."',
				'".$result['vn']."',
				'".$result['van']."',
				'".$result['vp']."',
				'".$result['vv']."',
				now());
				";

		$conn->query($est);

		foreach ($result["cand"] as $ckey => $cvalue) {

			$votos = "INSERT IGNORE INTO `eleicao`.`votos_estados`
					(`id_candidato`,
					`uf`,
					`votos_raw`,
					`votos_int`,
					`timestamp`)
					VALUES (
					'".$cvalue['seq']."',
					'".$uf."',
					'".$cvalue['v']."',
					'".$cvalue['v']."',
					NOW())";

			$conn->query($votos);

		}

	}

	// BRASIL

	$uf = strtolower($key);
	// URL XHR obtida em http://divulga.tse.jus.br/oficial/index.html
	$url = "http://divulga.tse.jus.br/2018/divulgacao/oficial/296/dadosdivweb/br/br-c0001-e000296-w.js";
	$result = json_decode(file_get_contents($url), true);

	$query = "INSERT IGNORE INTO `eleicao`.`estatisticas_brasil`
			(`eleitorado`,
			`e_apurado`,
			`e_nao_apurado`,
			`e_abstencao`,
			`e_comparecimento`,
			`secoes`,
			`s_totalizadas`,
			`s_nao_totalizadas`,
			`v_total`,
			`v_brancos`,
			`v_nulos`,
			`v_anulados`,
			`v_pendentes`,
			`validos`,
			`timestamp`)
			VALUES (
			'".$result['e']."',
			'".$result['ea']."',
			'".$result['ena']."',
			'".$result['a']."',
			'".$result['c']."',
			'".$result['s']."',
			'".$result['st']."',
			'".$result['snt']."',
			'".$result['tv']."',
			'".$result['vb']."',
			'".$result['vn']."',
			'".$result['van']."',
			'".$result['vp']."',
			'".$result['vv']."',
			now())";

	$conn->query($query);

	foreach ($result["cand"] as $ckey => $cvalue) {

		$votos = "INSERT IGNORE INTO `eleicao`.`votos_brasil`
				(`id_candidato`,
				`votos_raw`,
				`votos_int`,
				`timestamp`)
				VALUES (
				'".$cvalue['seq']."',
				'".$cvalue['v']."',
				'".$cvalue['v']."',
				NOW())";

		$conn->query($votos);

	}

	// EXTERIOR

	$uf = strtolower($key);
	// URL XHR obtida em http://divulga.tse.jus.br/oficial/index.html
	$url = "http://divulga.tse.jus.br/2018/divulgacao/oficial/296/dadosdivweb/zz/zz-c0001-e000296-w.js";
	$result = json_decode(file_get_contents($url), true);

	$ext = "INSERT IGNORE INTO `eleicao`.`estatisticas_exterior`
			(`eleitorado`,
			`e_apurado`,
			`e_nao_apurado`,
			`e_abstencao`,
			`e_comparecimento`,
			`secoes`,
			`s_totalizadas`,
			`s_nao_totalizadas`,
			`v_total`,
			`v_brancos`,
			`v_nulos`,
			`v_anulados`,
			`v_pendentes`,
			`validos`,
			`timestamp`)
			VALUES (
			'".$result['e']."',
			'".$result['ea']."',
			'".$result['ena']."',
			'".$result['a']."',
			'".$result['c']."',
			'".$result['s']."',
			'".$result['st']."',
			'".$result['snt']."',
			'".$result['tv']."',
			'".$result['vb']."',
			'".$result['vn']."',
			'".$result['van']."',
			'".$result['vp']."',
			'".$result['vv']."',
			now())";

	$conn->query($ext);

	foreach ($result["cand"] as $ckey => $cvalue) {

		$votos = "INSERT IGNORE INTO `eleicao`.`votos_exterior`
				(`id_candidato`,
				`votos_raw`,
				`votos_int`,
				`timestamp`)
				VALUES (
				'".$cvalue['seq']."',
				'".$cvalue['v']."',
				'".$cvalue['v']."',
				NOW())";

		$result = $conn->query($votos);

	}

}

$conn->close();

?>