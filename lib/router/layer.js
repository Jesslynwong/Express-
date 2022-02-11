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