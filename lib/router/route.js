let Layer = require('./layer.js')
function Route() {
    this.stack = [];
}

Route.prototype.get = function(handlers) {
    //给route中添加层，这个层中需要存放方法名和handler
    handlers.forEach(handler => {
        let layer = new Layer('/',handler);
        layer.method = 'get';
        this.stack.push(layer);
    });
    
}

Route.prototype.dispatch = function(res,req,out) {
    let idx = 0;
    let next = () => { //用户调用的next， 如果调用next，会执行内层中的next方法，如果没有匹配会调用外层的next方法
        if (idx >= this.stack.length) return out();
        let layer = this.stack[idx++];
        if(layer.method === req.method.toLowerCase()){
            //layer外层存的是dispatch，里层存的是handler
            layer.handle_request(req, res, next); 
        }else{
            next();
        }
    }
    next()
}

module.exports = Route;