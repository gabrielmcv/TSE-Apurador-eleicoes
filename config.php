<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "eleicao";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

// Delimita se os dados do TSE devem ser consultados ou não
$atualizar_dados = 0;

?>