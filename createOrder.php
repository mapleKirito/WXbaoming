<?php
include_once('conn.php');

//预处理sql
$prepareSql='insert into order_list(order_id,order_parent,order_phone,order_date,order_state,order_studentID,order_openID,order_payment) VALUES(?,?,?,now(),0,?,?,?)';
//echo $prepareSql;
//接收前台发送的分页数据
$studentID = $_POST['studentID'];
$parentName = $_POST['parentName'];
$phoneNum = $_POST['phoneNum'];
$finalMoney = $_POST['finalMoney'];
//openID通过对接微信获取
$openID='aafff';
//计算订单号
$order_id=date('Ymd') . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);


$stmt = $conn->prepare($prepareSql);
$stmt->bind_param("sssisi", $order_id,$parentName,$phoneNum,$studentID,$openID,$finalMoney);
$result=$stmt->execute();

//echo $arr;
ob_clean();
if($result){
	echo json_encode($order_id,JSON_UNESCAPED_UNICODE);
	
}else{
	echo json_encode('0',JSON_UNESCAPED_UNICODE);
}




$stmt->close();
$conn->close();
?>