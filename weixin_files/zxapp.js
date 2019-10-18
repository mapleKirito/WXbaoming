'use strict';

/**
 * 基础交互方法
 */

(function (window) {
	var zxApp = {};
	zxApp.version = '2.0.0';

	/**
   * 根据指定的命名空间，挂载子空间
   *
   * @param namespace 挂载到zxApp的命名空间
   * @param o 挂载的对象
   */
	zxApp.extend = function (namespace, o) {
		var that = this;

		// 扩展子命名空间，若存在直接拷贝，否则创建新的对象
		var cspace = that[namespace] = that[namespace] || {};

		if (o != null) {
			for (var key in o) {
				if (o.hasOwnProperty(key)) {
					cspace[key] = o[key];
				}
			}
		}
	};

	/**
   * 获取最上层的window
   *
   * @returns {Window}
   */
	zxApp.getWindows = function () {
		if (!window.AppZxbInterface && top.window.AppZxbInterface) {
			return top.window;
		}
		return window;
	};

	/**
   * 自定义event
   *
   * @type {{_listeners: {}, on: on, trigger: trigger, include: include, off: off}}
   */
	zxApp.Event = {
		_listeners: {},
		// 添加
		on: function (type, fn) {
			if (typeof this._listeners[type] === 'undefined') {
				this._listeners[type] = [];
			}
			if (typeof fn === 'function') {
				this._listeners[type].push(fn);
			}
			return this;
		},
		// 触发
		trigger: function (type, data) {
			var arrayEvent = this._listeners[type];
			if (arrayEvent instanceof Array) {
				for (var i = 0, length = arrayEvent.length; i < length; i += 1) {
					if (typeof arrayEvent[i] === 'function') {
						// arrayEvent[i]({ type: type, data: data });
						arrayEvent[i](data);
						// arrayEvent[i].apply(data);
					}
				}
			}
			return this;
		},
		// 是否存在
		include: function (type) {
			return type in this._listeners;
		},
		// 删除
		off: function (type, fn) {
			var arrayEvent = this._listeners[type];
			if (typeof type === 'string' && arrayEvent instanceof Array) {
				if (typeof fn === 'function') {
					// 清除当前type类型事件下对应fn方法
					for (var i = 0, length = arrayEvent.length; i < length; i += 1) {
						if (arrayEvent[i] === fn) {
							this._listeners[type].splice(i, 1);
							break;
						}
					}
				}
				else {
					// 如果仅仅参数type, 或参数fn邪魔外道，则所有type类型事件清除
					delete this._listeners[type];
				}
			}
			return this;
		}
	};

	/**
   * 与app交互的具体实现方法
   *
   * @param message
   * @param callbackName
   * @param callback
   */
	zxApp.callNativeFun = function (message, callbackName, callback) {
		// 判断 callback，并加入到队列中
		// === 'function' 等价 api 被 components 调用
		// !== 'function' 等价 api 被 native 调用

		if (this.Event.include(callbackName)) {
			if (typeof callback !== 'function') {
				this.Event.trigger(callbackName, callback);
				this.Event.off(callbackName);
			}
		}
		else {
			if (typeof callback === 'function') {
				this.Event.on(callbackName, callback);
			}

			var paramArr = message.paramArr;
			var win = this.getWindows();
			if (win.webkit && win.webkit.messageHandlers) {
				var args = {};

				if (paramArr instanceof Array) {
					if (callbackName && message.iosInfo.returnType === 'callback') {
						paramArr = message.paramArr.concat(callbackName);
					}
					for (var i = 0; i < paramArr.length; i++) {
						args['arg' + i] = paramArr[i];
					}
				}

				win.webkit.messageHandlers[message.interfaceName].postMessage({
					functionName: message.iosInfo.methodName,
					args: args,
					callback: callbackName
				});
			}
			else if (win[message.interfaceName] && win[message.interfaceName][message.androidInfo.methodName]) {
				if (callbackName && paramArr instanceof Array && message.androidInfo.returnType === 'callback') {
					paramArr = message.paramArr.concat(callbackName);
				}
				var ret = win[message.interfaceName][message.androidInfo.methodName].apply(win[message.interfaceName], paramArr);
				if (ret && message.androidInfo.returnType === 'return' && callbackName) {
					this.Event.trigger(callbackName, ret);
					this.Event.off(callbackName);
				}
			} else {
				if (callbackName){
					var error = {"domain": "AppCommonInterface", "code": -1, "info": "不支持该方法" };
					this.Event.trigger(callbackName, error);
					this.Event.off(callbackName);
				}
			}
		}
	};

	zxApp.isiOSClient = function () {
		var u = navigator.userAgent;
		return !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // iOS终端
	};

	zxApp.extend('common', {
		version: '2.0.0',

		/**
     * 获取app版本号
     *
     */
		getAppVersionWithCallback: function (callback) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getAppVersion',
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getAppVersionWithCallback',
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getAppVersionWithCallback', // app回调方法名
			callback);
		},

		/**
     * 设置标题
     * @param title
     */
		setTitle: function (title) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'setTitle' // Android 方法名
				},
				iosInfo: {
					methodName: 'setTitle' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},

		/**
     * 更新token, 更新结束回调 onTokenAccess(success, token)
     */
		updateToken: function () {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'updateToken' // Android 方法名
				},
				iosInfo: {
					methodName: 'updateToken' // iOS ZXJSExport协议中的方法名
				},
				paramArr: [] // 传给app的参数数组
			}, null, null);
		},

		/**
     * 更新token, 更新结束回调 callback
     */
		updateTokenWithCallback: function (callback) {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'updateTokenWithCallback', // Android 方法名
					returnType: 'callback'
				},
				iosInfo: {
					methodName: 'updateTokenWithCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			},
			'ZXApp.common.updateTokenWithCallback', // app回调方法名
			callback);
		},

		/**
     * 获取UserId
     */
		getUserIdWithCallback: function (callback) {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getUserId', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getUserIdWithCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getUserIdWithCallback', // app回调方法名
			callback);
		},

		/**
     * 获取Token
     */
		getTokenWithCallback: function (callback) {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getToken', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getTokenWithCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getTokenWithCallback', // app回调方法名
			callback);
		},

		/**
     * 关闭当前窗口
     */
		close: function () {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'close' // Android 方法名
				},
				iosInfo: {
					methodName: 'close' // iOS ZXJSExport协议中的方法名
				},
				paramArr: [] // 传给app的参数数组
			}, null, null);
		},
		/**
     * 设置返回类型
     * @param {function} callback - 回调方法
     * @param {int} backType - 返回类型 0：close, 1: history back, 2: callback
     */
		setGoBackType: function (backType, callback) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun(
				{
					interfaceName: 'AppCommonInterface', // app注入的接口对象名
					androidInfo: {
						methodName: 'setGoBackType' // Android 方法名
					},
					iosInfo: {
						methodName: 'setBackTypeWithBackCallbackMethod' // iOS ZXJSExport协议中的方法名
					},
					paramArr: paramArr // 传给app的参数数组
				},
				null, null
			);
		},
		/**
     * 返回
     */
		goBack: function () {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'goBack' // Android 方法名
				},
				iosInfo: {
					methodName: 'goBack' // iOS ZXJSExport协议中的方法名
				},
				paramArr: [] // 传给app的参数数组
			}, null, null);
		},

		/**
     * 跳转app内部页面
     * @param {String} internalLink - 符合banner的内部跳转参数格式
     */
		productEntry: function (internalLink) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'productEntry' // Android 方法名
				},
				iosInfo: {
					methodName: 'productEntry' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},

		/**
     * 浏览器打开链接
     * @param {String} url - 需要打开的链接
     */
		openBrowseWithUrl: function (url) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'openBrowser' // Android 方法名
				},
				iosInfo: {
					methodName: 'openBrowser' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 设置当前Native导航栏显示状态
     * @param {int} state - 0: GONE, 1: VISIBLE, 2: INVISIBLE
     */
		setToolbarVisibility: function (state) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'setToolbarVisibility' // Android 方法名
				},
				iosInfo: {
					methodName: 'setToolbarVisibility' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 弹出Toast提示
     * @param {String} toast - 提示信息
     */
		showToast: function (state) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'showToast' // Android 方法名
				},
				iosInfo: {
					methodName: 'showToast' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 打开内部浏览器
     * @param {String} url
     * @param {String} title
     */
		openInnerBrowserWithUrlAndTitle: function (url, title) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'openInnerBrowser' // Android 方法名
				},
				iosInfo: {
					methodName: 'openInnerBrowserTitle' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},

		/**
     * 第三方分享
     * @param {String} callback - 分享成功后回调的JS方法名称
     * @param {String} type - 分享类型，传空则表示客户端弹出分享选择界面
     * @param {String} title - 分享标题
     * @param {String} content - 分享信息内容
     * @param {String} target - 分享链接
     * @param {String} imgUrl - 分享图片链接
     */
		share: function (type, title, content, targetUrl, imgUrl, callbackName) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'share' // Android 方法名
				},
				iosInfo: {
					methodName: 'shareWithTitleContentTargetUrlImageUrlCallback' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},

		/**
     * 第三方分享
     * @param {String} callback - 分享成功后回调的JS方法
     * @param {String} type - 分享类型，传空则表示客户端弹出分享选择界面
     * @param {String} title - 分享标题
     * @param {String} content - 分享信息内容
     * @param {String} target - 分享链接
     * @param {String} imgUrl - 分享图片链接
     */
		shareWithCallback: function (callback, type, title, content, targetUrl, imgUrl) {
			var callbackName = 'ZXApp.common.shareWithCallback';
			if (typeof callback === 'function' && zxApp.Event.include(callbackName)) {
				zxApp.Event.off(callbackName);
			}
			var paramArr = [type, title, content, targetUrl, imgUrl];
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'share', // Android 方法名
					returnType: 'callback'
				},
				iosInfo: {
					methodName: 'shareWithTitleContentTargetUrlImageUrlCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: paramArr // 传给app的参数数组
			}, callbackName, // app回调方法名
			callback);
		},
		/**
     * 保存图片到相册
     * @param {String} url - 图片文件链接
     * @param {String} imageName - 图片文件名（ios不保存文件名称）
     */
		saveImageWithUrl: function (url, imageName) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'saveImageWithUrl' // Android 方法名
				},
				iosInfo: {
					methodName: 'saveImageWithUrlImageName' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 获取网络状态
     * @returns {String} - 当前网络状态：“wifi”，“wwan” 蜂窝，“none” 没有网络
     */
		getNetworkStateWithCallback: function (callback) {
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getNetWorkState', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getNetworkStateWithCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getNetworkStateWithCallback', // app回调方法名
			callback);
		},
		/**
     * 打开智批改相机，拍照成功后回调javascript: takePhotoDoneAppCallback
     * @param {String} parameters - 回传参数
     */
		openMarkingCamera: function (parameters) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'openMarkingCamera' // Android 方法名
				},
				iosInfo: {
					methodName: 'openMarkingCamera' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 跳转客户端支付
     * @param type
     * @param params
     * @param payFinishedCallback
     */
		zxappPay: function (type, params, payFinishedCallback) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'zxappPay' // Android 方法名
				},
				iosInfo: {
					methodName: 'payWithTypeParamsFinishedCallback' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
		/**
     * 跳转客户端统一支付
     * @param type
     * @param params
     * @param payFinishedCallback
     */
		payWithUrl: function (url, type, orderId, payFinishedCallback) {
			var win = zxApp.getWindows();
			if (win.AppCommonInterface) {
				if (win.AppCommonInterface.pay && !zxApp.isiOSClient()) {
					win.AppCommonInterface.pay(type, orderId, payFinishedCallback);
				}
				else {
					this.iOSStartPay(url, type, orderId, payFinishedCallback);
				}
			}
			else if(win.webkit && win.webkit.messageHandlers) {
				this.iOSStartPay(url, type, orderId, payFinishedCallback);
			}
			else {
				win[payFinishedCallback]('-1', '请稍后重试~');
			}
		},

		// iOS 开始支付
		iOSStartPay: function (url, type, orderId, payFinishedCallback) {
			var win = zxApp.getWindows();
			var _this = this;
			this.getTokenWithCallback(function (token) {
				var content = 'orderId=' + orderId + '&payType=' + type + '&token=' + token + '&sdkVersion=' + '1.0';

				var request = new XMLHttpRequest();
				if (request != null) {
					var isTimeOut = false;// 是否超时
					var timer = setTimeout(function () {
						isTimeOut = true;

						win[payFinishedCallback]('-1', '网络请求失败，请稍后重试~');
						request.abort();// 请求中止
					}, 15000);

					request.open('POST', url, true);
					request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

					request.onreadystatechange = function () {
						if (isTimeOut) {
							return;
						}
						clearTimeout(timer);
						if (request.readyState == 4) {// 执行完成
							if (request.status == 200) {// 执行成功
								var response = JSON.parse(request.response);

								if (response.errorCode != 0) {
									win[payFinishedCallback](response.errorCode.toString(), response.errorInfo);
									return;
								}

								var result = JSON.parse(request.response).result;
								if (type == 'alipay') {
									result.alipaySign = result.orderInfo;
									result.orderId = orderId;
								}
								else if (type == 'wechat') {
									result = result.signParam;
									result.orderId = orderId;
								}

								_this.zxappPay(type, JSON.stringify(result), payFinishedCallback);
								return true;
							}
							return false;

						}
					};
					request.send(content);
				}
			});
		},
		payAtDebug: function (type, orderId, payFinishedCallback) {
			this.payWithUrl('https://test.zhixue.com/apipayment/apppay/getPayInfo', type, orderId, payFinishedCallback);
		},

		pay: function (type, orderId, payFinishedCallback) {
			this.payWithUrl('https://www.zhixue.com/apipayment/apppay/getPayInfo', type, orderId, payFinishedCallback);
		},

		/**
     * 浏览器跳转客户端
     * @param urlScheme
     * @param externalLink
     * @param internalLink
     */
		getUrlScheme: function (urlScheme, externalLink, internalLink) {
			var win = zxApp.getWindows();
			var urlHost = 'app.zhixue.com?';
			if (internalLink) {
				return urlScheme + urlHost + 'internalLink=' + win.btoa(internalLink);
			}
			else if (externalLink) {
				return urlScheme + urlHost + 'externalLink=' + win.btoa(externalLink);
			}
			return urlScheme + 'app.zhixue.com';
		},

		/** 埋点
     * @param module
     * @param opCode
     * @param otherInfo
     */
		saveActionLog: function (module, opCode, otherInfo) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'saveActionLog' // Android 方法名
				},
				iosInfo: {
					methodName: 'addActionLogWithModuleNameOpCodeOtherInfo' // iOS ZXJSExport协议中的方法名
				},
				paramArr: paramArr // 传给app的参数数组
			}, null, null);
		},
/*	*//**
     * 获取渠道号
     *//*
		getChannelNoWithCallback: function (callback) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getChannelNo', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getChannelNo', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getChannelNoWithCallback',
			callback);
		},

    *//**
     * 获取包名
     *//*
		getPackageNameWithCallback: function (callback) {
			var paramArr = [].slice.call(arguments); // 将具有length属性的对象转成数组
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getPackageName', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getChannelNo', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, 'ZXApp.common.getPackageNameWithCallback',
			callback);
		},*/

    /**
     * 获取App信息
     */
		getAppInfoWithCallback: function (callback) {
			var callbackName = 'ZXApp.common.getAppInfoWithCallback';
			if (typeof callback === 'function' && zxApp.Event.include(callbackName)) {
				zxApp.Event.off(callbackName);
			}
			
			zxApp.callNativeFun({
				interfaceName: 'AppCommonInterface', // app注入的接口对象名
				androidInfo: {
					methodName: 'getAppInfo', // Android 方法名
					returnType: 'return'
				},
				iosInfo: {
					methodName: 'getAppInfoWithCallback', // iOS ZXJSExport协议中的方法名
					returnType: 'callback'
				},
				paramArr: [] // 传给app的参数数组
			}, callbackName,
			callback);
		}

	});

	window.ZXApp = zxApp;
})(window);

