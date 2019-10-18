<?php

$servername = "bdm288811480.my3w.com";
$username = "bdm288811480";
$password = "XIAOmaple+660603";
 
// 创建连接
$conn = new mysqli($servername, $username, $password);
 
// 检测连接
if ($conn->connect_error) {
    die("连接失败: " . $conn->connect_error);
} 
echo "连接成功";
?>