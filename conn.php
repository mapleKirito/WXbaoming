<?php

$servername = "bdm288811480.my3w.com";
$username = "bdm288811480";
$password = "XIAOmaple+660603";
$databasename="bdm288811480_db";
 
// 创建连接
$conn = new mysqli($servername, $username, $password,$databasename);
 
// 检测连接
if ($conn->connect_error) {
    die("连接失败: " . $conn->connect_error);
} 
//echo "连接成功";
$conn->set_charset('utf8');
?>