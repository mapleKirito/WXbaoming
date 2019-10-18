<?php
include_once('conn.php');

$sql='select DISTINCT school from baoming_List ';
//执行sql指令
$result=$conn->query($sql);
//判断sql是否执行成功
if($result===false){
	die('执行sql出错');
}
$arr=array();
while($row=$result->fetch_array(MYSQLI_ASSOC)){
	$arr[]=$row;
}

//释放结果集
$result->free();
 
//关闭数据库
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
	//加载年级信息
	$("#school").change(function(){
		console.log($(this).val());
		$("#schoolChoose").val($(this).val());
		//加载关联信息
		$.ajax({
            type: "POST",
            url: "getGrade2.php",
            data: {'school': $("#schoolChoose").val()}, //传递参数，作为后台返回页码的依据
            dataType: "json",   //返回的数据为json
            beforeSend: function () {
                console.log("ajax正在加载中...");
            },
            //成功获取数据后，返回的是json二位数组
            success: function (msg) {
				console.log(msg.length);
				if(msg!=null){
					$("#grade").html('<option value="" disabled selected hidden>请选择年级</option>');
					//遍历list数组，index是下标0,1..，array是这个下标对应的键值
					$.each(msg, function (index, content) {
						console.log(content);
						var str='<option value="'+content+'">'+content+'</option>';
						$("#grade").append(str);
						
					});
				}
                
            },
            error: function () {
                console.log("ajax加载错误");
            }
        });
		
	});
	
	//加载班级信息
	$("#grade").change(function(){
		console.log($(this).val());
		$("#gradeChoose").val($(this).val());
		//加载关联信息
		$.ajax({
            type: "POST",
            url: "getClass.php",
            data: {'school': $("#schoolChoose").val(),'grade':$("#gradeChoose").val()}, //传递参数，作为后台返回页码的依据
            dataType: "json",   //返回的数据为json
            beforeSend: function () {
                console.log("ajax正在加载中...");
            },
            //成功获取数据后，返回的是json二位数组
            success: function (msg) {
				console.log(msg.length);
				if(msg!=null){
					$("#classSelect").html('<option value="" disabled selected hidden>请选择班级</option>');
					//遍历list数组，index是下标0,1..，array是这个下标对应的键值
					$.each(msg, function (index, content) {
						console.log(content);
						var str='<option value="'+content+'">'+content+'</option>';
						$("#classSelect").append(str);
						
					});
				}
                
            },
            error: function () {
                console.log("ajax加载错误");
            }
        });
		
	});
	
	$("#classSelect").change(function(){
		console.log($(this).val());
		$("#classChoose").val($(this).val());
	});
	
	//验证学生信息跳转
	$("#okBtn").click(function(){
		//整理验证参数
		var schoolVal=$("#schoolChoose").val();
		var gradeVal=$("#gradeChoose").val();
		var classVal=$("#classChoose").val();
		var studentName=$("#studentName").val();
		//加载关联信息
		$.ajax({
            type: "POST",
            url: "checkStudentInfo.php",
            data: {'school': schoolVal,'grade':gradeVal,'classVal':classVal,'studentName':studentName}, //传递参数，作为后台返回页码的依据
            dataType: "json",   //返回的数据为json
            beforeSend: function () {
                console.log("ajax正在加载中...");
            },
            //成功获取数据后，返回的是json二位数组
            success: function (msg) {
				console.log(msg.length);
				if(msg!=null&&msg.length>0){
					$(".msgP").hide();
					//遍历msgP数组，index是下标0,1..，array是这个下标对应的键值
					console.log(msg[0]);
					window.location.href="page3.php?id="+msg[0];
				}else{
					//没找到对应学生
					$(".msgP").show();
				}
                
            },
            error: function () {
                console.log("ajax加载错误");
            }
        });
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
				<div class="formDiv">
					<div >
						<span>学校</span> 
						<select id="school" >
							<option value="" disabled selected hidden>请选择学校</option>
							<?php foreach($arr as $row){ ?>
								<option value="<?php echo $row['school'] ?>"><?php echo $row['school'] ?></option>
							<?php } ?>
						</select>
					</div>
				</div>
				<div class="formDiv">
					<div >
						<span>年级</span> 
						<select id="grade">
						  <option value="" disabled selected hidden>请选择年级</option>
						</select>
					</div>
				</div>
				<div class="formDiv">
					<div >
						<span>班级</span> 
						<select id="classSelect">
						  <option value="" disabled selected hidden>请选择班级</option>
						</select>
					</div>
				</div>
				<div class="formDiv">
					<div >
						<span>姓名</span> 
						<input type="text" id="studentName" >
					</div>
				</div>
				<div class="formDiv">
					<input type="hidden" id="schoolChoose" />
					<input type="hidden" id="gradeChoose" />
					<input type="hidden" id="classChoose" />
				
					<p class="msgP">没找到学生信息</p>
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