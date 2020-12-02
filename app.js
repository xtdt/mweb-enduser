const Koa = require('koa');
const app = new Koa();

const bodyParser = require('koa-bodyparser');
app.use(bodyParser({
  extendTypes: {
    text: ['application/json','text/xml'],
  },
  enableTypes: ['text'],
}));

var jwt = require('jsonwebtoken');
const allowpage = ['/mweb/enduser/svcno/jsapi_ticket','/mweb/enduser/svcno/login','/mweb/enduser/search_merchant_shop']
function loginFilter(ctx) {
    body = ctx.request.body
    let url = ctx.originalUrl
    console.log(url,'query:',body)
    let uri = url.split('?')[0]
    if (allowpage.indexOf(uri) > -1) {
        console.info('passthrough')
    } else {
    	var token = ctx.headers.token
	    console.log("token: ",token)
	    try{
	    	var decoded = jwt.verify(token, config.enduser_secret)
	    	ctx.jwt = decoded
	    	console.log("decoded: ",decoded)
		} catch (e){
			console.log("failed to valid jwt: ",e)
			return false
		}
    }
    return true
}
//登录拦截
app.use(async (ctx, next) => {
    if(loginFilter(ctx)){
    	await next()
    } else {
    	ctx.set("Content-Type", "application/json")
      	ctx.body = JSON.stringify({code:401,msg:'登录过期'})
    }
    const rt = ctx.response.get('X-Response-Time');
    let url = ctx.originalUrl
  	console.log(url,'resp:',ctx.response.body);
})

var enduserRouter = require('./enduser');
app.use(enduserRouter.routes())
app.use(enduserRouter.allowedMethods())

// var miniprogramMerchantRouter = require('./miniprogram_merchant');
// app.use(miniprogramMerchantRouter.routes())
// app.use(miniprogramMerchantRouter.allowedMethods())

const config = require('./config.json');
app.listen(config.port, () => {
    console.log("server started,port:"+config.port);
})

