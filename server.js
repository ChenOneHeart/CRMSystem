/**
 * 前端路由
 * 在浏览器输入localhost:1234/index.html观察network中的信息
 * */

var http = require("http"),
    url = require("url"),
    fs = require("fs");
//创建一个服务
var server1 = http.createServer(function (req, res) {
    var urlObj = url.parse(req.url, true),
        pathname = urlObj["pathname"],
        query = urlObj["query"];//存储的是客户端请求的URL地址中问号传参后面的信息，并且是以对象的键值对方式存储的
    //处理静态资源文件的请求（HTML/CSS/JS...）
    var reg = /\.(HTML|JS|CSS|JSON|TXT|ICO)/i;//后面可以自己扩展需要的MIME类型
    if(reg.test(pathname)){
        //获取请求文件的后缀名
        var suffix = reg.exec(pathname)[1].toUpperCase();
        //根据请求文件的后缀名获取到当前文件的MIME类型
        var suffixMIME = "text/plain";
        switch (suffix) {
            case "HTML":
                suffixMIME = "text/html";
                break;
            case "CSS":
                suffixMIME = "text/css";
                break;
            case "JS":
                suffixMIME = "text/javascript";
                break;
            case "JSON":
                suffixMIME = "application/json";
                break;
            case "ICO":
                suffixMIME = "application/octet-stream";
                break;
        }
        try{
            //按照指定的目录读取文件中的内容或者代码（读取出来的内容都是字符串格式的）
            var conFile = fs.readFileSync("." + pathname, "utf-8");
            //重写响应头信息：告诉客户端的浏览器我返回的内容是什么样的MIME类型,指定返回的内容格式是UTF-8编码的，返回的中文汉字就不会出现乱码了
            res.writeHead(200, {'content-type':suffixMIME + ';charset=utf-8;'})
            //服务器端向客户端返回的内容应该也是字符串
            res.end(conFile);
        }catch (e) {
            res.writeHead(404, {'content-type':'text/plain;charset=utf-8;'});
            res.end("request file is not found!");
        }

    }
    //API数据接口的处理
    var con = null,
        result = null,
        customId = null,
        customPath = "./json/custom.json";
    //从【原json文件】中获取 【全部的客户信息】
    con = fs.readFileSync(customPath, "utf-8");
    con.length === 0 ? con = '[]' : null;//为了防止我们custom.json什么都没有，con是一个空字符串，JSON.parse会报错
    con = JSON.parse(con);//将con（JSON格式字符串）转换为对象

     //获取所有的客户信息
    if (pathname === '/getList'){
        result = {
            code:1,
            msg:"没有任何信息",
            data:null
        };
        if (con.length > 0){
            result = {
                code:0,
                msg:"成功",
                data:con
            };
        }
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
        res.end(JSON.stringify(result));
        return;
    }
    //获取某一个具体的客户信息
    if (pathname === '/getInfo'){
        customId = query["id"];
        result = {
            code:1,
            msg:"客户不存在",
            data:null
        };
       for(var i = 0; i < con.length; i++){
           if(con[i]["id"] == customId){
               result = {
                   code:0,
                   msg:"成功",
                   data:con[i]
               };
               break;
           }
       }
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
        res.end(JSON.stringify(result));
        return;
    }
    //根据传递进来的客户ID删除这个客户
    if(pathname === '/removeInfo'){
        customId = query["id"];
        var flag = false;
        for (var i = 0; i < con.length; i++) {
            if(con[i]["id"] == customId){
                con.splice(i, 1);
                flag = true;
                break;
            }
        }
        result = {
            code:1,
            msg:"删除失败"
        };
        if (flag){
            //将删除后的【全部客户信息】写入【原json文件】
            fs.writeFileSync(customPath, JSON.stringify(con, null, 4), "utf-8");
            result = {
                code:0,
                msg:"删除成功"
            };
        }
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
        res.end(JSON.stringify(result));//将【返回信息】输出到浏览器
        return;
    }
     //增加客户信息
    if (pathname === '/addInfo'){
        //获取客户端通过请求主体传递过来的内容
        var str = '';
        //给req绑定data事件,data:服务器一点点接收客户端传递的内容，每接收一点执行该函数
        req.on("data", function (chunk) {
            str += chunk;
        });
        //服务器端接收结束
        req.on("end", function () {
            //str='{"name":"","age":"","phone":"","address":""}'

            if (str.length === 0) {
                res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
                res.end(JSON.stringify( result = {
                    code:1,
                    msg:"增加失败，没有传递任何需要增加的信息"
                }));//将【返回信息】输出到浏览器
                return;
            }
            var data =JSON.parse(str);
            //在现有的DATA中追加一个ID：获取CON中最后一项的ID，新的ID是在原有基础上加一即可,如果之前一项都没有，我们这一项的ID就是1
            data["id"] = ( con.length === 0 ) ? 1 : parseFloat(con[con.length - 1]["id"]) + 1;
            con.push(data);//con是一个对象，也是数组
            fs.writeFileSync(customPath, JSON.stringify(con), "utf-8");
            res.end(JSON.stringify(result = {
                code:0,
                msg:"增加成功！"
            }, null, 4));
        });
        return;
    }
    //修改客户信息
    if(pathname === '/updateInfo'){
        str = '';
        req.on("data", function (chunk) {
            str += chunk;
        });
        req.on("end", function (chunk) {
            if (str.length === 0){
                res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
                res.end(JSON.stringify({
                    code:1,
                    msg:"修改失败，没有传递任何需要修改的信息"
                }));
                return;
            }
            var flag = false,//有没有修改
                data = JSON.parse(str);
            for (var i = 0; i < con.length; i++) {
                if(con[i]["id"] == data["id"]){
                    con[i] = data;
                    flag = true;
                }
            }
            result = {
                code:1,
                msg:"修改失败"
            };
            result.msg = "修改失败，需要修改的客户不存在";//传值成功但是修改的客户不存在
            if (flag){
                fs.writeFileSync(customPath, JSON.stringify(con), "utf-8")
                result = {
                    code:0,
                    msg:"修改成功"
                };
            }
            res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'})//防止浏览器乱码
            res.end(JSON.stringify(result));
        });
        return;
    }
    //如果请求的地址不是上述地址
    res.writeHead(404, {'content-type':'text/plain;charset=utf-8;'});
    res.end("请求的数据接口不存在");
});
server1.listen(81, function () {
    console.log("server is sucess,linstening on 81 port");//端口号监听成功
});