const Koa = require('koa');
const axios = require('axios');
const Router = require('koa-router');
const router = new Router({
  prefix: '/mweb/enduser'
});
const sha1 = require('sha1');
const parser = require('fast-xml-parser');

const config = require('./config.json');
const { promisify } = require('util');

var jwt = require('jsonwebtoken');
const randomstring = require("randomstring");

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');

// Suggested options for similarity to existing grpc.load behavior
var ORDER_PROTO_PATH = __dirname + '/proto/order/order_api.proto';
var orderPackageDefinition = protoLoader.loadSync(
    ORDER_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var orderProtoDescriptor = grpc.loadPackageDefinition(orderPackageDefinition);
var order = orderProtoDescriptor.xtdt.order;
var orderApi = new order.OrderApi(config.orderAddr, grpc.credentials.createInsecure());

var MERCHANT_PROTO_PATH = __dirname + '/proto/merchant/merchant_api.proto';
var merchantPackageDefinition = protoLoader.loadSync(
    MERCHANT_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var merchantProtoDescriptor = grpc.loadPackageDefinition(merchantPackageDefinition);
var merchant = merchantProtoDescriptor.xtdt.merchant;
var merchantApi = new merchant.MerchantApi(config.merchantAddr, grpc.credentials.createInsecure());

var WECHAT_PROTO_PATH = __dirname + '/proto/wechat/wechat_api.proto';
var wechatPackageDefinition = protoLoader.loadSync(
    WECHAT_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var wechatProtoDescriptor = grpc.loadPackageDefinition(wechatPackageDefinition);
var wechat = wechatProtoDescriptor.xtdt.wechat;
var wechatApi = new wechat.WechatApi(config.wechatAddr, grpc.credentials.createInsecure());

var USER_PROTO_PATH = __dirname + '/proto/user/user_api.proto';
var userPackageDefinition = protoLoader.loadSync(
    USER_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var userProtoDescriptor = grpc.loadPackageDefinition(userPackageDefinition);
var user = userProtoDescriptor.xtdt.user;
var userApi = new user.UserApi(config.userAddr, grpc.credentials.createInsecure());

var DELIVERY_PROTO_PATH = __dirname + '/proto/delivery/delivery_api.proto';
var deliveryPackageDefinition = protoLoader.loadSync(
    DELIVERY_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var deliveryProtoDescriptor = grpc.loadPackageDefinition(deliveryPackageDefinition);
var delivery = deliveryProtoDescriptor.xtdt.delivery;
var deliveryApi = new delivery.DeliveryApi(config.deliveryAddr, grpc.credentials.createInsecure());

var ACTIVITY_PROTO_PATH = __dirname + '/proto/activity/activity_api.proto';
var activityPackageDefinition = protoLoader.loadSync(
    ACTIVITY_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var activityProtoDescriptor = grpc.loadPackageDefinition(activityPackageDefinition);
var activity = activityProtoDescriptor.xtdt.activity;
var activityApi = new activity.ActivityApi(config.activityAddr, grpc.credentials.createInsecure());


const userApiGetUserAddrByUserId = promisify(userApi.GetUserAddrByUserId).bind(userApi);
const userApiCreateUser = promisify(userApi.CreateUser).bind(userApi);
const userApiGetUserAddrByAddrId = promisify(userApi.GetUserAddrByAddrId).bind(userApi);
const userApiGetUserAddrByLocation = promisify(userApi.GetUserAddrByLocation).bind(userApi);
const userApiGetUserByOpenId = promisify(userApi.GetUserByOpenId).bind(userApi);
const userApiCreateUserAddr = promisify(userApi.CreateUserAddr).bind(userApi);

const merchantApiGetMerchantShopByMerchantShopId = promisify(merchantApi.GetMerchantShopByMerchantShopId).bind(merchantApi);
const merchantApiSearchMerchantShop = promisify(merchantApi.SearchMerchantShop).bind(merchantApi);

const orderApiCheckOrderPaid = promisify(orderApi.CheckOrderPaid).bind(orderApi);
const orderApiGetOrderByOrderId = promisify(orderApi.GetOrderByOrderId).bind(orderApi);
const orderApiGetOrdersByUserId = promisify(orderApi.GetOrdersByUserId).bind(orderApi);
const orderApiPrepareOrder = promisify(orderApi.PrepareOrder).bind(orderApi);
const orderApiCreateOrder = promisify(orderApi.CreateOrder).bind(orderApi);
const orderApiUserSetDeliveried = promisify(orderApi.UserSetDeliveried).bind(orderApi);
const orderApiUserSetCanceled = promisify(orderApi.UserSetCanceled).bind(orderApi);

const wechatApiGetSvcnoEnduserJsapiTicket = promisify(wechatApi.GetSvcnoEnduserJsapiTicket).bind(wechatApi);
const wechatApiSvcnoEnduserLogin = promisify(wechatApi.SvcnoEnduserLogin).bind(wechatApi);

const deliveryApiGetDeliveryLocation = promisify(deliveryApi.GetDeliveryLocation).bind(deliveryApi);

const activityApiActivity1GetRecommender = promisify(activityApi.Activity1GetRecommender).bind(activityApi);
const activityApiActivity1SetRecommender = promisify(activityApi.Activity1SetRecommender).bind(activityApi);
const activityApiActivityEnabled = promisify(activityApi.ActivityEnabled).bind(activityApi);
const activityApiActivity1CreateDetail = promisify(activityApi.Activity1CreateDetail).bind(activityApi);
const activityApiActivity1SetDetailOrderId = promisify(activityApi.Activity1SetDetailOrderId).bind(activityApi);

router.post('/get_merchant_shop', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {merchantShopId: jsonObj.merchantShopId}
    var resp = await merchantApiGetMerchantShopByMerchantShopId(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:{name:resp.merchantShop.name}})
});

router.post('/search_merchant_shop', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {lat: jsonObj.lat, lng: jsonObj.lng, name: jsonObj.name, curPage: jsonObj.curPage };
    var resp = await merchantApiSearchMerchantShop(req,propagateZipkinHeaders(ctx))
    console.log(resp);
    var now = new Date()
    var datestr = now.toLocaleDateString()
    console.log('datestr: '+datestr)
    for(var i=0;i<resp.merchantShops.length;i++){
      if(resp.merchantShops[i].businessHours){
        var tmp = resp.merchantShops[i].businessHours.split("-")
        var start = Date.parse(datestr + " " + tmp[0])
        var end = Date.parse(datestr + " " + tmp[1])
        resp.merchantShops[i].isInBusiness = false
        if(start <= now.getTime() && now.getTime() <= end) {
          resp.merchantShops[i].isInBusiness = true
        }
      }
      if(parseInt(resp.merchantShops[i].distance)<1000){
        resp.merchantShops[i].distance = resp.merchantShops[i].distance + 'm'
      } else {
        resp.merchantShops[i].distance = (parseInt(resp.merchantShops[i].distance)/1000).toFixed(1) + 'km'
      }
    }
    ctx.body = JSON.stringify({code:0,data:resp})
});

router.post('/check_order_paid', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {orderId: jsonObj.orderId};
    var resp = await orderApiCheckOrderPaid(req,propagateZipkinHeaders(ctx))
    console.log(resp)
    ctx.body = JSON.stringify({code:0,data:resp})
})

router.post('/get_orderinfo', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {orderId: jsonObj.orderId};
    var resp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
    console.log(resp);
    ctx.body = JSON.stringify({code:0,data:resp.order})
})

router.post('/get_orderinfos', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, curPage: jsonObj.curPage, pageSize: jsonObj.pageSize};
    var resp = await orderApiGetOrdersByUserId(req,propagateZipkinHeaders(ctx))
    var orders = []
    for(var i=0;i<resp.orders.length;i++){
      var merchantReq = {merchantShopId:  resp.orders[i].merchantShopId}
      var merchantResp = await merchantApiGetMerchantShopByMerchantShopId(merchantReq,propagateZipkinHeaders(ctx))
      var o = resp.orders[i]
      orders.push({orderId:o.orderId,merchantShopName:merchantResp.merchantShop.name,userPrice:o.userPrice,originUserPrice:o.originUserPrice,createdAt:o.createdAt,state:o.state})
    }
    resp.orders = orders
    ctx.body = JSON.stringify({code:0,data:resp})
})

router.post('/get_order_state', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {orderId: jsonObj.orderId};
    var resp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:{state:resp.order.state,subState:resp.order.subState,tags:resp.order.tags}})
})

router.post('/prepare_order', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, addrId: jsonObj.addrId, pics: jsonObj.pics, merchantShopId: jsonObj.merchantShopId};
    var resp = await orderApiPrepareOrder(req,propagateZipkinHeaders(ctx))
    console.log(resp)
    if(resp.result=='not_enough_budget'){
      ctx.body = JSON.stringify({code:0,data:{result: resp.result}})
    } else if(resp.result=='succeed'){
      var r = {result: resp.result, prepareId: resp.prepareOrderInfo.prepareId, userPrice: resp.prepareOrderInfo.userPrice, originUserPrice: resp.prepareOrderInfo.originUserPrice}
      req = {activityId: 1};
      var activityResp = await activityApiActivityEnabled(req,propagateZipkinHeaders(ctx))
      if(activityResp.enabled){
        req = {userId: ctx.jwt.userId}
        var activityRecommenderResp = await activityApiActivity1GetRecommender(req,propagateZipkinHeaders(ctx))
        //如果有推荐人，且其推荐人获得的彩蛋数量小于5个
        console.log(activityRecommenderResp)
        if(activityRecommenderResp.recommender&&parseInt(activityRecommenderResp.recommender.eggsAcquired)<5){
          //原来的彩蛋
          var eggPrice = parseInt(r.originUserPrice) - parseInt(r.userPrice)
          //需要将彩蛋分20%给推荐人
          var recommenderPrice = Math.floor(eggPrice * 0.2)
          //意味着支付价提高20%（本质上就是多支付点儿钱给到推荐人）
          r.userPrice = parseInt(r.userPrice) + parseInt(recommenderPrice)
          req = {userId: ctx.jwt.userId, recommenderId:activityRecommenderResp.recommender.recommenderId,recommenderPrice:recommenderPrice,prepareId:r.prepareId};
          var activityCreateDetailResp = await activityApiActivity1CreateDetail(req,propagateZipkinHeaders(ctx))
        }
      }
      ctx.body = JSON.stringify({code:0,data:r})
    }
})

router.post('/create_order', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, from: jsonObj.from, addrId: jsonObj.addrId, prepareId: jsonObj.prepareId, comments: jsonObj.comments};
    var resp = await orderApiCreateOrder(req,propagateZipkinHeaders(ctx))
    var r = {orderId: resp.order.orderId, userPrice: resp.order.userPrice, originUserPrice: resp.order.originUserPrice}
    ctx.body = JSON.stringify({code:0,data:r})
})

router.get('/svcno/jsapi_ticket', async ctx => {
    var req = {url:ctx.query.url}
    var resp = await wechatApiGetSvcnoEnduserJsapiTicket(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:resp.ticketInfo})
})

router.post('/svcno/login', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {code:jsonObj.code}
    var loginResp = await wechatApiSvcnoEnduserLogin(req)
    req = { openId:loginResp.openId }
    var userResp = await userApiGetUserByOpenId(req,propagateZipkinHeaders(ctx))
    console.log('userApiGetUserByOpenId:',userResp);
    var user = userResp.user
    if(!user){
      req = {from:'svcno_enduser',openId:loginResp.openId}
      var createResp = await userApiCreateUser(req,propagateZipkinHeaders(ctx))
      console.log('userApiCreateUser:',createResp);
      user = createResp.user
    }
    var key = randomstring.generate({length: 8,charset: 'alphabetic'})
    ctx.body = JSON.stringify({code:0,data:{userId: user.userId, token:jwt.sign({ userId: user.userId, key: key }, config.enduser_secret,{ expiresIn: '365d' })}})
})

router.post('/get_user_addr', async ctx => {
    var body = ctx.request.body;
    var req = {}
    var resp = {}
    try {
      var jsonObj = JSON.parse(body);
      if (jsonObj.lat&&jsonObj.lng){
        req = {userId:ctx.jwt.userId,lat:jsonObj.lat,lng:jsonObj.lng}
        resp = await userApiGetUserAddrByLocation(req,propagateZipkinHeaders(ctx))
      } else if (jsonObj.addrId) {
        req = {addrId:jsonObj.addrId}
        resp = await userApiGetUserAddrByAddrId(req,propagateZipkinHeaders(ctx))
      }
    } catch (e){
      req = {userId:ctx.jwt.userId}
      resp = await userApiGetUserAddrByUserId(req,propagateZipkinHeaders(ctx))
    }
    ctx.body = JSON.stringify({code:0,data:resp})
})

router.post('/create_user_addr', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    req = {
        id:jsonObj.id,
        userId:ctx.jwt.userId,
        name:jsonObj.name,
        gender:jsonObj.gender,
        mobile:jsonObj.mobile,
        addrShortName:jsonObj.addrShortName,
        addr:jsonObj.addr,
        roomNo:jsonObj.roomNo,
        lat:jsonObj.lat,
        lng:jsonObj.lng,
        province:jsonObj.province,
        district:jsonObj.district,
        cityCode:jsonObj.cityCode,
        adcode:jsonObj.adcode,
        street:jsonObj.street,
        streetNumber:jsonObj.streetNumber,
        township:jsonObj.township
    }
    var resp = await userApiCreateUserAddr(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:{id:resp.addr.id}})
})

router.post('/get_deliveryinfo', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {orderId: jsonObj.orderId};
    var orderResp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
    if (orderResp.order.state !== 'delivery_accepted' && orderResp.order.state !== 'meal_ready' 
      && orderResp.order.state !== 'deliverying' && orderResp.order.state  !== 'arrived'){
      ctx.body = JSON.stringify({code:0,data:{
        orderInfo:{state:orderResp.order.state,subState:orderResp.order.subState},
      }})
      return
    }
    req = {addrId:orderResp.order.addrId}
    var userAddrResp = await userApiGetUserAddrByAddrId(req,propagateZipkinHeaders(ctx))
    req = {merchantShopId: orderResp.order.merchantShopId}
    var merchantResp = await merchantApiGetMerchantShopByMerchantShopId(req,propagateZipkinHeaders(ctx))
    req = {deliveryId: orderResp.order.deliveryId}
    var deliveryResp = await deliveryApiGetDeliveryLocation(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:{
      orderInfo:{state:orderResp.order.state,subState:orderResp.order.subState},
      poi:{
        userAddrLngLat:{lat:userAddrResp.addr.lat,lng:userAddrResp.addr.lng},
        deliveryLngLat:{lat:deliveryResp.location.lat,lng:deliveryResp.location.lng},
        merchantLngLat:{lat:merchantResp.merchantShop.lat,lng:merchantResp.merchantShop.lng}
      }
    }})
})

router.post('/set_deliveried', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, orderId: jsonObj.orderId};
    var orderResp = await orderApiUserSetDeliveried(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:orderResp})
})

router.post('/set_canceled', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, orderId: jsonObj.orderId};
    var orderResp = await orderApiUserSetCanceled(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:orderResp})
})

router.post('/activity/enabled', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {activityId: jsonObj.activityId};
    var activityResp = await activityApiActivityEnabled(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:activityResp})
})

router.post('/activity1/set_recommender', async ctx => {
    var body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {userId: ctx.jwt.userId, recommenderId: jsonObj.recommenderId};
    var activityResp = await activityApiActivity1SetRecommender(req,propagateZipkinHeaders(ctx))
    ctx.body = JSON.stringify({code:0,data:activityResp})
})

function propagateZipkinHeaders(ctx) {
    var meta = new grpc.Metadata()
    for (var key in ctx.header) {
      if(key.startsWith('baggage-')){
        meta.add(key, ctx.header[key])
      }
      if(key.startsWith('x-b3-')){
        meta.add(key, ctx.header[key])
      }
    }
    var endpointId = ctx.cookies.get('endpoint-id')
    if(endpointId){
        meta.add('baggage-endpoint-id', endpointId)
    }
    return meta
}

module.exports = router;
