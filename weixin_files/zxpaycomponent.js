'use strict';

var payWay = {
	none: "",
	alipay: "alipay",
	weChatPay: "wechat",
	unionPay: "unionpay",//暂不支持
	inWechat: "inWechat",//微信支付统一用weChat
	umsAlipay: "umsalipay",//银联商务 支付宝支付
	umsWechat: "umswechat",//银联商务 微信支付
	free: "free",
};

var payErrorCode = {
	success: 0,
	failed: 1,
	waiting: 2,
	cancel: 3,
	confirming: 4,
	overtime: 5,
	refundSuccess: 6,
	refunding: 7,
};

(function () {
	var payState = {
		waiting: 0,//	int	待支付
		success: 1,//	int	支付成功
		overtime: 2,//	int	订单超时导致交易失败
		cancel: 3,//	int	订单取消（未支付）
		confirming: 4,//	int	支付确认中
		failed: 5,//	int	支付失败
		refundSuccess: 6,//	int	退款成功
		refunding: 7,//	int	退费处理中
		none: -1,//	int	状态未知
	};

	var paymentBaseUrl = "//www.zhixue.com/zxpayment/";//"https://www.zhixue.com/zxpayment/";
	var zhixueBaseUrl = "//www.zhixue.com/";//"https://www.zhixue.com/";

	var wapPayInfoUrl = "apipayment/wappay/getPayInfo";
	var inWeChatPayInfoUrl = "apipayment/inwechatpay/getPayInfo";
	var webPayInfoUrl = "apipayment/webpay/getPayInfo";
	var weChatAuthUrl = "apipayment/inwechatpay/getAuthUrl";

	var payStateUrl = "apipayment/apppay/confirmPayStatus";

	var timeOut = 15000;

	var myInterval = null;
	var remainTime = 0;

	function ZXPay() {
		this.version = '1.0.0';
	}

	function ZXPayComponent() {
	}

	function confirmPayStateCallBack(callBack, state) {
		var error = paymentError(state, null);
		if (callBack) {
			callBack(error);
		}
	}

	//获取query string
	function getQueryString(item) {
		var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)", "i"));
		return svalue ? svalue[1] : svalue;
	}

	//请求微信app内H5支付的授权url
	function requestWeChatAuthUrl(orderId, returnUrl, detail, callBack) {
		var url = document.location.protocol + zhixueBaseUrl + weChatAuthUrl;

		var content = "orderId=" + orderId + "&returnUrl=" + returnUrl;
		content = makeContent(content, detail);
		postRequest(url, content, doResult);

		function doResult(response) {
			

			if (response.errorCode != 0) {
				var error = paymentError(response.errorCode, response.errorInfo);
				callBack(error);
				return;
			}
			callBack(null);

			window.location.href = response.result.authUrl;//fix frame 加载url 集成文档说明一定要跳转
		}
	}

	//处理请求支付签名等信息的接口的返回数据
	function processingPaymentResponse(payWayStr, returnUrl, response) {
		returnUrl = decodeURIComponent(returnUrl);
		switch (response.result.payType) {
			case payWay.none:
				return;
			case payWay.alipay:
				makeForm(response.result.payUrl, response.result.formData, "alipay");
				break;
			case payWay.inWechat:
			case payWay.weChatPay:
				weChatPay(response, returnUrl);
				break;
			case payWay.unionPay:
				makeForm(response.result.payUrl, response.result.formData, "unionpay");
				break;
			case payWay.umsAlipay:
			case payWay.umsWechat:
				window.location.href = response.result.submitUrl;
				break;
			case payWay.free:
				window.location.href = returnUrl;
				break;
			default:
				window.location.href = returnUrl;
		}
	}

	function payInfoUrl() {
		var url = document.location.protocol + zhixueBaseUrl + wapPayInfoUrl;
		if (isWeChatBrower()) {
			url = document.location.protocol + zhixueBaseUrl + inWeChatPayInfoUrl;
		} else if (isPC()) {
			url = document.location.protocol + zhixueBaseUrl + webPayInfoUrl;
		}
		return url;
	}

	//H5页面调用微信支付
	function weChatPay(response, returnUrl) {
		if (isPC()) {
			var scanCodeUrl = document.location.protocol + paymentBaseUrl + "scancode.html?qrUrl=" + response.result.qrUrl + "&orderId=" + response.result.orderId + "&returnUrl=" + window.btoa(returnUrl);
			window.location.href = scanCodeUrl;//fix 可以做成弹框
			return;
		}
		if (!isWeChatBrower()) {
			makeForm(response.result.payUrl, null, "wechat");
			return;
		}

		var result = response.result;
		if (typeof WeixinJSBridge == "undefined") {
			if (document.addEventListener) {
				document.addEventListener('WeixinJSBridgeReady', function () {
					inWeChatPayWithResponse(response, returnUrl);
				}, false);
			} else if (document.attachEvent) {
				document.attachEvent('WeixinJSBridgeReady', function () {
					inWeChatPayWithResponse(respons, returnUrl);
				});
				document.attachEvent('onWeixinJSBridgeReady', function () {
					inWeChatPayWithResponse(response, returnUrl);
				});
			}
		} else {
			inWeChatPayWithResponse(response, returnUrl);
		}
	}

	function inWeChatPayWithResponse(response, returnUrl) {
		var result = response.result;
		if (typeof WeixinJSBridge != "undefined") {
			WeixinJSBridge.invoke(
				'getBrandWCPayRequest', {
					"appId": result.signData.appId,     //公众号名称，由商户传入
					"timeStamp": result.signData.timeStamp,         //时间戳，自1970年以来的秒数
					"nonceStr": result.signData.nonceStr, //随机串
					"package": result.signData.package,
					"signType": result.signData.signType,         //微信签名方式:
					"paySign": result.signData.paySign,   //微信签名
				}, function (res) {
					if (res.err_msg == "get_brand_wcpay_request:ok") {
						window.location.href = returnUrl;
					} else if (res.err_msg == "get_brand_wcpay_request:cancel") {
						window.location.href = returnUrl;
					} else {
						window.location.href = returnUrl;
					}
				});
		}
	}

	//是否是微信内置浏览器
	function isWeChatBrower() {
		var ua = navigator.userAgent.toLowerCase();
		var isWeixin = ua.indexOf('micromessenger') != -1;
		if (isWeixin) {
			return true;
		}
		return false;
	}

	//是否是pc 
	function isPC() {
		var userAgentInfo = navigator.userAgent;
		var Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
		var isPCEnd = true;
		for (var v = 0; v < Agents.length; v++) {
			if (userAgentInfo.indexOf(Agents[v]) > 0) { isPCEnd = false; break; }
		}
		return isPCEnd;
	}

	// get请求
	// get请求添加查询参数
	function urlParam(url, name, value) {
		url += (url.indexOf('?') == -1) ? '?' : '&';
		url += encodeURIComponent(name) + "=" + encodeURIComponent(value);
		return url;
	}

	//表单跳转
	function makeForm(url, PARAMS, payType) {
		var alpayConfig = eval(PARAMS);
		var form1 = document.createElement("form");
		form1.id = "form1";
		form1.name = "form1";
		document.body.appendChild(form1);
		if (alpayConfig) {
			for (var i = 0; i < alpayConfig.length; i++) {
				var input = document.createElement("input");
				var item = alpayConfig[i];
				input.name = item.name;
				input.value = item.value;
				form1.appendChild(input);
			}
		}
		form1.acceptCharset = 'utf-8';
		form1.method = "POST";
		form1.action = url;
		form1.submit();
		document.body.removeChild(form1);
	}

	function paymentError(name, message) {
		var error = new Error();
		error.name = name;
		if (message) {
			error.message = message;
		}

		return error;
	}

	function postRequest(url, content, callback) {
		var request = new XMLHttpRequest();
		if (request != null) {
			var isTimeOut = false;//是否超时
			var timer = setTimeout(function () {
				isTimeOut = true;
				callback({"errorCode":-1, "errorInfo":"网络请求失败，请稍后重试~"});
				request.abort();//请求中止
			}, timeOut);

			request.open("POST", url, true);
			request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			request.withCredentials = true;
			request.onreadystatechange = function () {
				if (isTimeOut) {
					return;
				}
				clearTimeout(timer);
				if (request.readyState == 4) {//执行完成
					if (request.status == 200) {//执行成功
						var response = JSON.parse(request.response);
						callback(response);
						return true;
					} else {
						return false;
					}
				}
			}
			request.send(content);
		}
	}

	function makeContent(content, detail) {
		for (var name in detail) {
			if (detail[name]) {
				content += "&" + name + "=" + detail[name];
			}
		}
		return content;
	}

	ZXPayComponent.prototype = {
		//获取支付信息，调取支付
		pay: function (payType, orderId, detail, returnUrl, completionHandler) {
			returnUrl = encodeURIComponent(returnUrl);

			//微信的支付需要特殊处理
			if (payType == payWay.weChatPay) {
				returnUrl = document.location.protocol + paymentBaseUrl + "paymentcompleted.html?returnUrl=" + window.btoa(returnUrl);


				if (isWeChatBrower()) {
					requestWeChatAuthUrl(orderId, returnUrl, detail, completionHandler);
					return;
				}
				if (detail) {
					window.location.href = document.location.protocol + paymentBaseUrl + "weChatPay.html?payType=" + payType + "&orderId=" + orderId + "&detail=" + JSON.stringify(detail) + "&returnUrl=" + returnUrl;
				} else {
					window.location.href = document.location.protocol + paymentBaseUrl + "weChatPay.html?payType=" + payType + "&orderId=" + orderId + "&returnUrl=" + returnUrl;
				}
				return;
			}
			ZXPay.prototype.pay.directPay(payType, orderId, detail, returnUrl, completionHandler);
		},

		//轮询请求支付状态
		queryPayState: function (orderId, detail, callBack) {
			remainTime = 5;
			ZXPay.prototype.pay.queryPayStateHandler(orderId, detail, callBack);
		},

		//查询支付状态，业务方不需要调用
		queryPayStateHandler: function (orderId, detail, callBack) {
			ZXPay.prototype.pay.confirmPayState(orderId, detail, function(error) {
				if ((error.name == payErrorCode.confirming || error.name == payErrorCode.waiting) && remainTime >= 1) {
					remainTime -= 1;
					setTimeout(function(){
						ZXPay.prototype.pay.queryPayStateHandler(orderId, detail, callBack);
					}, 1000);
					return;
				}
				callBack(error)
				remainTime = 0;
			});
		},

		//请求一次支付状态
		confirmPayState: function (orderId, detail, callBack) {
			var url = document.location.protocol + zhixueBaseUrl + payStateUrl;
			var content = "orderId=" + orderId;
			content = makeContent(content, detail);

			postRequest(url, content, doResult);
			
			function doResult(response) {
				
				if (response.errorCode != 0) {
					confirmPayStateCallBack(callBack, payErrorCode.failed);
					return;
				}

				switch (response.result.orderStatus) {
					case payState.waiting:
						confirmPayStateCallBack(callBack, payErrorCode.waiting);
						break;
					case payState.cancel:
						confirmPayStateCallBack(callBack, payErrorCode.cancel);
						break;
					case payState.success:
						confirmPayStateCallBack(callBack, payErrorCode.success);
						break;
					case payState.overtime:
						confirmPayStateCallBack(callBack, payErrorCode.overtime);
						break;
					case payState.failed:
						confirmPayStateCallBack(callBack, payErrorCode.failed);
						break;
					case payState.confirming:
						confirmPayStateCallBack(callBack, payErrorCode.confirming);
						break;
					case payState.refundSuccess:
						confirmPayStateCallBack(callBack, payErrorCode.refundSuccess);
						break;
					case payState.refunding:
						confirmPayStateCallBack(callBack, payErrorCode.refunding);
						break;
					default:
						confirmPayStateCallBack(callBack, payErrorCode.failed);
						break;
				}
			}
		},

		//业务方不需要调用
		directPay: function (payType, orderId, detail, returnUrl, completionHandler) {
			var url = payInfoUrl();
			var content = "orderId=" + orderId + "&payType=" + payType + "&returnUrl=" + returnUrl;
			content = makeContent(content, detail);

			postRequest(url, content, doResult);

			function doResult(response) {	
					if (response.errorCode != 0) {
						var error = paymentError(response.errorCode, response.errorInfo);
						completionHandler(error);
						return;
					}
					completionHandler(null);
					processingPaymentResponse(payType, returnUrl, response);
					return true;
			}
		},

		//微信内部支付，业务方不需要调用
		inWeChatPay: function (orderId, openId, returnUrl, token, completionHandler) {
			returnUrl = paymentBaseUrl + "paymentcompleted.html?returnUrl=" + window.btoa(returnUrl);

			var url = document.location.protocol + zhixueBaseUrl + inWeChatPayInfoUrl;
			var content = "orderId=" + orderId + "&openId=" + openId + "&returnUrl=" + returnUrl + "&token=" + token;
			postRequest(url, content, doResult);

			function doResult(response) {
				if (response.errorCode != 0) {
					var error = paymentError(response.errorCode, response.errorInfo);
					completionHandler(error);
					return;
				}
				processingPaymentResponse(payWay.weChatPay, returnUrl, response);
			}
		},
	};

	ZXPay.prototype.pay = new ZXPayComponent()
	window.ZXPay = ZXPay;
})();






