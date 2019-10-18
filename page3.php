<?php
include_once('conn.php');


//预处理sql
$prepareSql='select name,isMath,isEngl,isPhys,isChem from baoming_List where id=?';
//echo $prepareSql;
//接收前台发送的分页数据
$id = $_GET['id'];


$stmt = $conn->prepare($prepareSql);
$stmt->bind_param("i", $id);
$stmt->execute();
// 获取全部结果到php
$stmt->store_result();
//echo "查询grade结果：".$stmt->num_rows."条记录";
$stmt->bind_result($name,$isMath,$isEngl,$isPhys,$isChem);
$arr=array();
if($stmt->fetch()){
	//echo $name.$isMath.$isEngl.$isPhys.$isChem;
}


$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html data-dpr="1" >
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>个性化学习手册</title>
<link href="./weixin_files/style.css" type="text/css" rel="stylesheet" >
<script src="./js/jquery-2.2.3.min.js"></script>
<script>
//designWidth:设计稿的实际宽度值，需要根据实际设置
//maxWidth:制作稿的最大宽度值，需要根据实际设置
//这段js的最后面有两个参数记得要设置，一个为设计稿实际宽度，一个为制作稿最大宽度，例如设计稿为750，最大宽度为750，则为(750,750)
;(function(designWidth, maxWidth) {
	var doc = document,
	win = window,
	docEl = doc.documentElement,
	remStyle = document.createElement("style"),
	tid;

	function refreshRem() {
		var width = docEl.getBoundingClientRect().width;
		maxWidth = maxWidth || 540;
		width>maxWidth && (width=maxWidth);
		var rem = width * 100 / designWidth;
		remStyle.innerHTML = 'html{font-size:' + rem + 'px;}';
	}

	if (docEl.firstElementChild) {
		docEl.firstElementChild.appendChild(remStyle);
	} else {
		var wrap = doc.createElement("div");
		wrap.appendChild(remStyle);
		doc.write(wrap.innerHTML);
		wrap = null;
	}
	//要等 wiewport 设置好后才能执行 refreshRem，不然 refreshRem 会执行2次；
	refreshRem();

	win.addEventListener("resize", function() {
		clearTimeout(tid); //防止执行两次
		tid = setTimeout(refreshRem, 300);
	}, false);

	win.addEventListener("pageshow", function(e) {
		if (e.persisted) { // 浏览器后退的时候重新计算
			clearTimeout(tid);
			tid = setTimeout(refreshRem, 300);
		}
	}, false);

	if (doc.readyState === "complete") {
		doc.body.style.fontSize = "16px";
	} else {
		doc.addEventListener("DOMContentLoaded", function(e) {
			doc.body.style.fontSize = "16px";
		}, false);
	}
})(700, 700);
</script>

<script>
$(function(){
	var chooseNum=0;
	var money=0;
	$("input:checkbox").change(function(){
		console.log($(this).attr('id'));
		if($(this).is(':checked')){
			chooseNum++;
			if($(this).attr('id')=='isMath'){
				//数学
				$("#isMathState").val(1);
			}
			if($(this).attr('id')=='isEngl'){
				//英语
				$("#isEnglState").val(1);
			}
			if($(this).attr('id')=='isPhys'){
				//物理
				$("#isPhysState").val(1);
			}
			if($(this).attr('id')=='isChem'){
				//化学
				$("#isChemState").val(1);
			}
		}else{
			chooseNum--;
			if($(this).attr('id')=='isMath'){
				//数学
				$("#isMathState").val(0);
			}
			if($(this).attr('id')=='isEngl'){
				//英语
				$("#isEnglState").val(0);
			}
			if($(this).attr('id')=='isPhys'){
				//物理
				$("#isPhysState").val(0);
			}
			if($(this).attr('id')=='isChem'){
				//化学
				$("#isChemState").val(0);
			}
		}
		//计算金额 300每门每学期
		money=chooseNum*300;
		$("#finalMoney").val(money);
		$("#chooseNum").html('当前选择'+chooseNum+'门学科');
		$("#money").html('共计'+money+'元');
	});
	
	
	
	//确定按钮
	$("#okBtn").click(function(){
		/*检查提交条件 学生ID(studentID)，家长名称(parentName)，电话号码(phoneNum)，
		金额(finalMoney)，学科状态(isMathState,isEnglState,isPhysState,isChemState)*/
		console.log("学生ID:"+$("#studentID").val()+"=家长姓名:"+$("#parentName").val()+"=电话号码:"+$("#phoneNum").val()+
		"=金额:"+$("#finalMoney").val()+
		"=学科状态:"+$("#isMathState").val()+$("#isEnglState").val()+$("#isPhysState").val()+$("#isChemState").val());
		console.log($("#studentID").val()!=''&&$("#parentName").val()!=''&&$("#phoneNum").val()!=''&&$("#finalMoney").val()!=null);
		if($("#studentID").val()!=''&&$("#parentName").val()!=''&&$("#phoneNum").val()!=''&&$("#finalMoney").val()!=null){
			//创建订单(未完成订单)，发起付款请求
			$.ajax({
				type: "POST",
				url: "createOrder.php",
				data: {'studentID': $("#studentID").val(),'parentName': $("#parentName").val(),
				'phoneNum': $("#phoneNum").val(),'finalMoney': $("#finalMoney").val()}, //传递参数，作为后台返回页码的依据
				dataType: "json",   //返回的数据为json
				beforeSend: function () {
					console.log("ajax正在加载中...");
				},
				//成功获取数据后，返回的是json二位数组
				success: function (msg) {
					console.log(msg.length);
					if(msg!=null&&msg.length>0){
						if(msg[0]!=0){
							console.log(msg[1]);
							//创建订单完成，跳转付款
							
							//付款成功后更新订单状态，以及学生表状态
							
						}else{
							console.log("创建订单失败");
						}
					}
					
				},
				error: function () {
					console.log("ajax加载错误");
				}
			});
			//根据付款结算处理	
			//付款完成：更新订单信息(付款状态)，更新学生表(学科报名状态)，跳转付款成功页面，微信推送消息
			//付款未完成(失败)：显示付款失败页面，跳转到上一层验证学生信息页面
			
		}
	});
})
</script>
</head>
<body>
<div id="app">
	<div id="home">
		<div >
			<p class="title"></p>
			<div class="component-uls">
				<div class="formDiv" style="    margin-top: 0.2rem;">
					<div >
						<span>学生姓名</span> 
						<input style="width: 3rem;" type="text" readonly value="<?php echo  $name ?>" />
					</div>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;">
					<div >
						<span>家长姓名</span> 
						<input style="width: 3rem;    background: white;" type="text" id="parentName" >
					</div>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;">
					<div >
						<span>电话号码</span> 
						<input style="width: 3rem;    background: white;" type="text" id="phoneNum" >
					</div>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;">
					<div >
						<span>学科选择</span>
						<div style="    text-align: left;margin-left: 2rem;    font-size: 0.35rem;">
							<input <?php echo ($isMath==1) ? ('disabled') : (''); ?> style="width: auto;" type="checkbox" id="isMath" >
							<?php echo ($isMath==1) ? 
							('<label style="color: gray;" for="isMath" >数学(已报名)</label>') 
							: ('<label for="isMath" >数学</label>'); ?><br/>
							<input <?php echo ($isEngl==1) ? ('disabled') : (''); ?> style="width: auto;" type="checkbox" id="isEngl" >
							<?php echo ($isEngl==1) ? 
							('<label style="color: gray;" for="isEngl" >英语(已报名)</label>') 
							: ('<label for="isEngl" >英语</label>'); ?><br/>
							<input <?php echo ($isPhys==1) ? ('disabled') : (''); ?> style="width: auto;" type="checkbox" id="isPhys" >
							<?php echo ($isPhys==1) ? 
							('<label style="color: gray;" for="isEngl" >物理(已报名)</label>') 
							: ('<label for="isPhys" >物理</label>'); ?><br/>
							<input <?php echo ($isChem==1) ? ('disabled') : (''); ?> style="width: auto;" type="checkbox" id="isChem" >
							<?php echo ($isChem==1) ? 
							('<label style="color: gray;" for="isEngl" >化学(已报名)</label>') 
							: ('<label for="isChem" >化学</label>'); ?>
						</div>
						
					</div>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;background:white;    font-size: 0.35rem;">
					<p >每门学科每学期300元</p>
					<p id="chooseNum" >当前选择0门学科</p>
					<p id="money" >共计0000元</p>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;">
					<input type="hidden" id="studentID" value="<?php echo $id ?>" />
					<input type="hidden" id="isMathState" value="<?php echo $isMath ?>" />
					<input type="hidden" id="isEnglState" value="<?php echo $isEngl ?>" />
					<input type="hidden" id="isPhysState" value="<?php echo $isPhys ?>" />
					<input type="hidden" id="isChemState" value="<?php echo $isChem ?>" />
					<input type="hidden" id="finalMoney" value="0" />
				
					<p style="margin-top:12px;"></p>
					<a id="okBtn" >确定</a>
					<p style="margin-bottom:12px;"></p>
				</div>
			</div>
		</div>
	</div>
</div>

</body>
</html>