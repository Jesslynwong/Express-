# Express源码解析

![image-20220211213742888](C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20220211213742888.png)

![image-20220211183648141](C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20220211183648141.png)

**个人认为该框架可以主要分为两个部分理解**

1、初始化阶段（把路由回调函数存入对应的路由中的栈）

2、匹配以及触发路由回调函数阶段

说明：

引入express的时候实际上引入的是Application这个应用。在Application中，创建Router，router中用stack来存放layer，一开始在应用的时候引入的app.get('/', handlers) 每遇到一个就创建一个layer，layer中以路径，以及触发进入router的dispatch函数为变量。

当路径匹配到的时候，触发dispatch进入route， route中也存在一个stack存放layer，但是这里的layer在初始化的时候就得加上method，因为到时匹配的时候，该层主要通过method来匹配，而现在里面layer触发的是handler也就是app.get('/', handlers) 中的callback执行。

而当路径匹配不到的时候，跳到下一层layer进行匹配，重复上面的步骤。





## express使用（不详细说，这个看文档调API即可）

```

let express = require('./lib/express.js')

let app = express();

app.get('/', function(req, res, next){
    console.log('1');
    next(); 
})

app.get('/', function(req, res,next){
    console.log('2');
    next();
},function(req, res){
    res.end('3');
})
// 1 2 3 

app.listen(3000, function(){
    console.log('server start at 3000');
})
```

## 源码解析

### express.js

```
const Application = require('./application')

function createApplication() {
    return new Application()
}

module.exports = createApplication;

```

### application.js（创建应用）

这里只演示get方法，其他方法都异曲同工

```
let http = require('http');
let Router = require('./router/index')
//Application是express的整个应用系统

//应用和路由分离
function Application() {
    //私有变量用下划线
    //创建路由系统
    this._router = new Router()
}

//1、初始化阶段：初始化阶段（把路由回调函数存入对应的路由中的栈）
// 把路由也就是app.get('/', function这些),放进router的stack里面
Application.prototype.get = function(path, ...handlers) {
    this._router.get(path, handlers);
}

//2、匹配以及触发路由回调函数阶段
Application.prototype.listen = function() {
    let server = http.createServer((req, res) => {
    
    // 如果匹配不到所有的路由触发done
        function done(){
            res.end(`Cannot ${req.url} ${req.method}`);
        }
     // 匹配路由并执行对应的回调函数
        this._router.handle(res,req,done);
    })

    server.listen(...arguments);
    // http.createServer的listen是内置方法，以上路由handler完了之后的调callback
}


module.exports = Application;
```

### ./router/index.js

```
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

//创造layer,每个Layer上有个route,将get的handler传入route，在route中存起来
Router.prototype.get = function(path,handlers) {
    //方法引用也得整this *****************
    let route = this.route(path);
    route.get(handlers);
}

// 匹配路由并执行对应的回调函数
//out就是done(找不到路由就跳出)
Router.prototype.handle = function(req,res,out) {
    //请求的时候执行此方法
    let {pathname} = url.parse(req.url);
    let idx = 0;
    
    //遍历router中的stack，匹配符合与请求符合的路由
    let next = () =>{
    
        if(idx >= this.stack.length) {
            return out();
        }
        
        let layer = this.stack[idx++];
        
        //判断请求路径是否路由匹配
        if (layer.match(pathname)) {
            // 返回的是layer.handler() 即 第14行 上面的Router.prototype.route中route.dispatch方法 route.dispatch.bind(route)(res,req,out)
       
            layer.handle_request(res,req,next); // next是外层的下一层（也就是该层）
            
            //这里只判断了路径没有判断方法，等到下一层才判断方法
        }else {
            next()
        }
    }

    next()
}

module.exports = Router;
```

### layer.js

```
function Layer(path,handler) {
    this.path = path;
    this.handler = handler;
}

//路径匹配
Layer.prototype.match = function(pathname) {
    return pathname === this.path;
     
}

Layer.prototype.handle_request = function(req, res,next){
    //。。。。to do
    //包装切片
    this.handler();
}
module.exports = Layer;
```

route.js

```
let Layer = require('./layer.js')
function Route() {
    this.stack = [];
}

Route.prototype.get = function(handlers) {
    handlers.forEach(handler => {
    //给route中添加layer，这个层中需要存放方法名和handler
        let layer = new Layer('/',handler);
        layer.method = 'get';
        //挂方法，因为之后在第二阶段，这个时候只需要判断方法即可
        this.stack.push(layer);
    });
    
}

// 该层判断方法（上一层已经判断过路径了）
Route.prototype.dispatch = function(res,req,out) {
    let idx = 0;
    let next = () => { //用户调用的next， 如果调用next，会执行内层中的next方法，如果没有匹配会调用外层的next方法
        if (idx >= this.stack.length) return out();
        let layer = this.stack[idx++];
    
        if(layer.method === req.method.toLowerCase()){
            //layer外层存的是dispatch，里层存的是handler（这里存的就是handler并且执行）
            layer.handle_request(req, res, next); 
        }else{
            next();
        }
    }
    
    next()
}

module.exports = Route;
```

