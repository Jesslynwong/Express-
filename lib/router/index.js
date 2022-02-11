// 路由系统
const Route = require('./route');
const Layer = require('./layer.js');
const url = require('url')


function Router() {
    this.stack = [];
}
//创建route和Layer的关系
Router.prototype.route = function(path) {
    let route = new Route();
    //如果不绑，直接到window或者Router，所以指向route
    //如果Layer匹配到了，放到route处理 route.dispatch.bind(route)
    let layer = new Layer(path, route.dispatch.bind(route));
    layer.route = route; // 把route放到layer上
    this.stack.push(layer); //layer放到数组中
    return route;
}

//创造layer,每个Layer上有个route,将get的handler传入route，在route种存起来
Router.prototype.get = function(path,handlers) {
    //方法引用也得整this *****************
    let route = this.route(path);
    route.get(handlers);
}

//out就是done
Router.prototype.handle = function(req,res,out) {
    //请求的时候执行此方法
    let {pathname} = url.parse(req.url);
    let idx = 0;
    let next = () =>{

        if(idx >= this.stack.length) {
            return out();
        }

        let layer = this.stack[idx++];
        if (layer.match(pathname)) {
            // layer.handler()
            //route.dispatch方法 route.dispatch.bind(route)(res,req,out)
            layer.handle_request(res,req,next); // next是外层的下一层,跳出来
            //这里只判断了路径没有判断方法
        }else {
            next()
        }
    }

    next()
}

module.exports = Router;