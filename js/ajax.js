/**
 * @author nightedblue
 *
 * */
~function(){
    /**利用惰性思想创建AJAX对象
     * @function 创建一个AJAX对象，使其支持IE6浏览器，兼容所有浏览器
     * @param xhr:AJAX对象
     * flag:AJAX对象是否被创建
     * ary:不同浏览器所用的创建AJAX对象的函数组成的数组
     * @return
     *  xhr:返回一个创建好的AJAX对象
     * */
    function createXHR() {
        var xhr = null,
            flag = false,
            ary = [
                function () {
                    return new XMLHttpRequest;
                },
                function () {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                },
                function () {
                    return new ActiveXObject("Msxml2.XMLHTTP");
                },
                function () {
                    return new ActiveXObject("Msxml3.XMLHTTP");
                }
            ];
        for (var i = 0; i < ary.length; i++) {
            var curFn = ary[i];
            try{
                xhr = curFn();
                //本次循环获取的方法执行没有出现错误：说明此方法是我想要的，我们下一次直接执行这个消防法即可，这就需要我们把createXHR重写为小方法
                createXHR = curFn;
                flag = true;
                break;
            }catch (e) {
                //本次循环获取的方法执行出现错误：继续执行下一次的循环
            }
        }
        if (!flag){
            throw new Error("您的浏览器不支持AJAX,请更换浏览器并重试")
        }
        return xhr;
    }
    /**
     * @return
     * open中的三个参数和ajax状态码为2,4要做的操作不确定
     * 需要传入多个参数
     * 实现AJAX请求的公共方法;当一个方法传递的参数值过多，而且还不固定，我们使用对象统一传值法
     * 把需要传递的参数都放在一个对象中
     * */
    function ajax(options) {
        var _default = {
            url:"", //请求的地址
            type:"get", //请求的方式
            dataType:"json", //设置请求回来的内容格式，"json"：json格式的对象，“txt”:txt格式的对象
            async:true, //请求是否为异步
            data:null,  //放在请求主体中的内容
            getHead:null,   //当READSTATE===2时执行的回调方法
            success:null    //当READSTATE===4时执行的回调方法
        };
        //使用用户自己传递进来的值覆盖我们的默认值
        for (var key in options){
            if (options.hasOwnProperty(key)){
                _default[key] = options[key];
            }
        }
        //如果当前的请求方式是GET，清除缓存
        if(_default.type === "get"){
            //如果URL中已经有？部分加&_=否则加问号传参
            if (_default.url.indexOf("?") >= 0){
                _default.url += '&_=' + Math.random();
            }
            _default.url += '?_=' + Math.random();

        }

        var xhr = createXHR();
        xhr.open(_default.type, _default.url, _default.async);
        xhr.onreadystatechange = function(){
            if (/^2\d{2}$/.test(xhr.status)){
                if (xhr.readyState === 2){
                    if (typeof _default.getHead === "function")
                        _default.getHead().call(xhr);//把getHead的this指向ajax对象
                }
                if (xhr.readyState === 4){
                    var val = xhr.responseText;//从服务器传来的字符串格式的响应主体
                    //如果传递的参数值是json，说明获取的应该是JSON格式的对象
                    if (_default.dataType === "json"){
                        //IE浏览器不支持JSON.parse
                        val = "JSON" in window ? JSON.parse(val):eval("("+val + ")");//eval将文本流转化为对象
                    }
                    _default.success && _default.success.call(xhr,val);//把success的this指向xhr（创建的ajax对象）
                }
            }
        };
        xhr.send(_default.data);//括号内为请求主题传递的内容
    }
    window.ajax = ajax;
}();

