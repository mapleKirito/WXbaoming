
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
					<input type="hidden" id="studentID" value="<?php echo $id ?>" />
					<input type="hidden" id="isMathState" value="<?php echo $isMath ?>" />
					<input type="hidden" id="isEnglState" value="<?php echo $isEngl ?>" />
					<input type="hidden" id="isPhysState" value="<?php echo $isPhys ?>" />
					<input type="hidden" id="isChemState" value="<?php echo $isChem ?>" />
				
					<p style="margin-top:12px;"></p>
					<a id="okBtn" >付款成功</a>
					<p style="margin-bottom:12px;"></p>
				</div>
				<div class="formDiv" style="    margin-top: 0.2rem;">
				
					<p style="margin-top:12px;"></p>
					<a id="cancelBtn" >付款失败</a>
					<p style="margin-bottom:12px;"></p>
				</div>
			</div>
		</div>
	</div>
</div>

</body>
</html>