<?php
include_once('conn.php');

//预处理sql
$prepareSql='select DISTINCT class from baoming_List where school=? and grade=?';
//echo $prepareSql;
//接收前台发送的分页数据
$school = $_POST['school'];
$grade = $_POST['grade'];
//echo $school;


$stmt = $conn->prepare($prepareSql);
$stmt->bind_param("ss", $school,$grade);
$stmt->execute();
// 获取全部结果到php
$stmt->store_result();
//echo "查询grade结果：".$stmt->num_rows."条记录";
$stmt->bind_result($result);
$arr=array();
while($stmt->fetch()){
	$arr[]=$result;
}
//echo $arr;
ob_clean();
echo json_encode($arr,JSON_UNESCAPED_UNICODE);


$stmt->close();
$conn->close();
?>