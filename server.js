
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

app.listen(3000, function(){
    console.log('server start at 3000');
})