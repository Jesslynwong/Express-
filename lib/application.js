// 创建应用
let http = require('http');
let Router = require('./router/index')
//Application是express的整个应用系统

//应用和路由分离
function Application() {
    //私有变量用下划线
    //内部防止路由系统
    this._router = new Router()
}


Application.prototype.get = function(path, ...handlers) {
    //把路由也就是app.get('/', function这些),放进router的stack里面
    this._router.get(path, handlers);
    // this._router.push({
    //     path,
    //     method:'get',
    //     handler
    // })
}

Application.prototype.listen = function() {
    let server = http.createServer((req, res) => {

        function done(){
            res.end(`Cannot ${req.url} ${req.method}`)
        }

        this._router.handle(res,req,done);
        // let  {pathname} = url.parse(req, res);
        // for(let i=0; i < this_router.length; i++) {
        //     let {path, method, handler} = this._router[i];
        //     if(path === pathname && method === req.method.toLocaleLowerCase()){
        //         return handler(req, res)
        //     }
        // }

        // return this._router[0].handler(req, res);
    })

    server.listen(...arguments);
    // http.createServer的listen是内置方法，以上路由handler完了之后的调callback
}


module.exports = Application;