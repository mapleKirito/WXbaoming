/**
 * created by qbyu2 2018-11-15
 * 原生方法实现埋点(可扩展到第三方使用，添加对应map和埋点参数格式化方法即可)
 * */
(function () {
  var url
  var token
  var resType
  var timeOut = 5000
  var group

  /**
   * 智学埋点方法参数格式化
   * @param userAction:埋点参数
   * @return Object
   * */
  var zhixueParamsFormat = function (userAction) {
    var otherInfo = Object.assign({}, userAction.otherInfo)
    try {
      otherInfo.module = userAction.module
      otherInfo.opCode = userAction.opCode
      otherInfo.userId = userAction.userId
    } catch (e) {
      errorTips('埋点参数不合法~')
    }
    return otherInfo
  }

  /**
   * 获取当前埋点使用组名称
   * */
  function getUseGroup () {
    group = 'zhixue'
  }

  /**
   * 配置参数表
   * @return Object
   * */
  function configMap () {
    getUseGroup()

    return {
      zhixue: {
        test: 'https://test.zhixue.com/log/userActionLog/create',
        pro: 'https://www.zhixue.com/log/userActionLog/create',
        web: getToken('web'),
        app: getToken('app'),
        userParamsFormat: zhixueParamsFormat
      }
      // 可扩展第三方使用 map新增 与group名对应
    }
  }

  /**
   * 实例化埋点方法对象参数错误提示
   * @paras msg:要提示的内容
   * */
  function errorTips (msg) {
    var text = '来自[ActionLogCommon]:'
    throw new Error(text + msg)
  }

  /**
   * 获取token
   * @param equ:设备参数
   * @return string
   * */
  function getToken (equ) {
    if (equ === 'web') {
      // zhixue WEB端暂无统一token方案，有token方案后可在此扩展
      return ''
    } else if (equ === 'app') {
      try {
        if (window.AppCommonInterface && window.AppCommonInterface.getToken) {
          return window.AppCommonInterface.getToken()
        } else if (window.AppInterface) {
          return window.AppInterface.getToken()
        } else {
          return window.zxappGetToken()
        }
      } catch (e) {
        return ''
      }
    }
  }

  /**
   * 检测配置参数-运行环境参数是否合法并给url赋值
   * @param config:配置参数对象
   * */
  function checkConfEnv (config) {
    if (config.env && Object.keys(configMap()[group]).indexOf(config.env) > -1) {
      url = configMap()[group][config.env]
    } else {
      errorTips('执行环境参数不存在or不合法~')
    }
  }

  /**
   * 检测配置参数-运行设备参数是否合法并给对应设备token赋值
   * @param config:配置参数对象
   * */
  function checkConfEqu (config) {
    if (config.equ && Object.keys(configMap()[group]).indexOf(config.equ) > -1) {
      token = configMap()[group][config.equ]
    } else {
      errorTips('执行设备参数不存在or不合法~')
    }
  }

  /**
   * 检测配置参数-请求超时时间参数是否合法并给默认timeOut赋值
   * @param config:配置参数对象
   * */
  function checkTimeOut (config) {
    var configTimeOut
    if (config.timeOut) {
      configTimeOut = config.timeOut
    }
    if (configTimeOut && typeof configTimeOut === 'number' && configTimeOut > 0) {
      timeOut = configTimeOut
    } else {
      errorTips('请求超时参数不存在or不合法~')
    }
  }

  /**
   * 检测配置参数是否合法
   * @param config:配置参数对象
   * */
  function checkConfig (config) {
    if (!config && Object.keys(config).length) {
      errorTips('未传入配置对象or配置为空对象~')
    }

    // 判断运行环境
    checkConfEnv(config)

    // 判断运行设备
    checkConfEqu(config)

    // 请求方式赋值
    resType = config.resType.toUpperCase()

    // 判断请求超时时间
    checkTimeOut(config)
  }

  /**
   * 埋点方法(支持跨域)
   * config: 配置参数
   * config.env:      执行网络环境(String, 必须, 可选值:'test'/'pro')
   * config.equ:      执行设备(String, 必须, 可选值:'web'/'app')
   * config.resType:  请求类型(String, 必须, 可选值:'POST'/'GET')
   * config.timeOut:  请求超时时间(Number, 必须, 单位: ms, 范围: 1000~20000)
   * */
  var ActionCommon = function (config) {
    this.version = '1.0.0'
    checkConfig(config)
  }

  // 原型
  ActionCommon.prototype = {
    /**
     * 埋点方法
     * @param userAction: 用户参数对象
     * @param userAction.module:模块名称
     * @param userAction.opCode:操作码
     * @param userAction.userId：用户id
     * @param userAction.otherInfo: 其他信息
     * */
    userActionLog: function (userAction) {
      var that = this

      var otherInfo = configMap()[group].userParamsFormat(userAction)

      otherInfo.sessionId = that.getCookie('tlsysSessionId') || that.getCookie('JSESSIONID') || {}

      if (token) {
        otherInfo.token = token
      }

      that.ajax({
        url: url,
        type: resType,
        time: timeOut,
        data: otherInfo,
        dataType: 'json'
      })
    },

    /**
     * 获取cookie
     * @param: cName：key
     * @return string   jq.cookie
     * */
    getCookie: function (cName) {
      if (!cName) {
        return null
      }
      /* eslint-disable */
      return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(cName).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null
    },

    /**
     * 封装原生js ajax方法
     * */
    ajax: function (params) {
      params = params || {}
      params.data = params.data || {}

      // 请求方式，默认是GET
      params.type = (params.type || 'GET').toUpperCase()

      // 避免有特殊字符，必须格式化传输数据
      params.data = formatParams(params.data)

      // 实例化XMLHttpRequest对象
      try {
        var xhr = window.XMLHttpRequest && new XMLHttpRequest()
      } catch (e) {
        console.error(e)
      }

      // 监听事件，只要 readyState 的值变化，就会调用 readystatechange 事件
      xhr.onreadystatechange = function () {
        //  readyState属性表示请求/响应过程的当前活动阶段，4为完成，已经接收到全部响应数据
        if (xhr.readyState === 4) {
          var status = xhr.status
          //  status：响应的HTTP状态码，以2开头的都是成功
          if (status >= 200 && status < 300) {
            var response = ''
            // 判断接受数据的内容类型
            var type = xhr.getResponseHeader('Content-type')
            try {
              if (type.indexOf('xml') !== -1 && xhr.responseXML) {
                response = xhr.responseXML // Document对象响应
              } else if (type === 'application/json') {
                response = JSON.parse(xhr.responseText) // JSON响应
              } else {
                response = xhr.responseText // 字符串响应
              }
            } catch (e) {

            }
            // 成功回调函数  promise
            params.success && params.success(response)

            // xhr释放
            xhr = undefined
          } else {
            params.error && params.error(status)
          }
        }
      }
      // 连接和传输数据
      if (params.type === 'GET') {
        // 三个参数：请求方式、请求地址(get方式时，传输数据是加在地址后的)、是否异步请求(同步请求的情况极少)；
        xhr.open(params.type, params.url + '?' + params.data, true)
        xhr.send(null)
      } else {
        xhr.open(params.type, params.url, true)

        // 必须，设置提交时的内容类型
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')

        // 传输数据
        xhr.send(params.data)
      }

      /**
       * 格式化参数
       * @param data:需要格式化的数据
       * @return string
       * */
      function formatParams (data) {
        var arr = []
        for (var name in data) {
          if (data.hasOwnProperty(name)) {
            arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
          }
        }
        // 添加时间戳，防止缓存
        arr.push('t=' + new Date().getTime())
        return arr.join('&')
      }
    }
  }
  window.ActionLogCommon = ActionCommon
})()
