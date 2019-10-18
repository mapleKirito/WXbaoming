<?php
include_once('conn.php');

//预处理sql
$prepareSql='select DISTINCT grade from baoming_List where school=';
echo $prepareSql;
//接收前台发送的分页数据
$school = $_POST['school'];


//sql拼接
$prepareSql.="'".$school."'";
echo "拼接后的sql:";
echo $prepareSql;
$prepareSql="select DISTINCT grade from baoming_List where school='第一小学'";
$result=$conn->query($prepareSql);
//判断sql是否执行成功
if($result===false){
	die('执行sql出错');
}
$arr=array();
while($row=$result->fetch_array(MYSQLI_ASSOC)){
	$arr[]=$row;
}
echo $arr;
echo json_encode($arr);


$stmt->close();
$conn->close();
?>