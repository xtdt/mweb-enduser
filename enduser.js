const Koa = require('koa');
const axios = require('axios');
const Router = require('koa-router');
const router = new Router({
  prefix: '/mweb'
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

router.post('/enduser/get_merchant_shop', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try{
      var req = {merchantShopId: jsonObj.merchantShopId}
      var resp = await merchantApiGetMerchantShopByMerchantShopId(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:{name:resp.merchantShop.name}})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
});

router.post('/enduser/search_merchant_shop', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try{
      var req = {lat: jsonObj.lat, lng: jsonObj.lng, name: jsonObj.name, curPage: jsonObj.curPage };
      var resp = await merchantApiSearchMerchantShop(req,propagateZipkinHeaders(ctx))
      console.log(resp);
      for(var i=0;i<resp.merchantShops.length;i++){
        if(parseInt(resp.merchantShops[i].distance)<1000){
          resp.merchantShops[i].distance = resp.merchantShops[i].distance + 'm'
        } else {
          resp.merchantShops[i].distance = (parseInt(resp.merchantShops[i].distance)/1000).toFixed(1) + 'km'
        }
      }
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
});

router.post('/enduser/check_order_paid', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try{
      var req = {orderId: jsonObj.orderId};
      var resp = await orderApiCheckOrderPaid(req,propagateZipkinHeaders(ctx))
      console.log(resp)
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.post('/enduser/get_orderinfo', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try{
      var req = {orderId: jsonObj.orderId};
      var resp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
      console.log(resp);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp.order})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.post('/enduser/get_orderinfos', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {userId: ctx.jwt.userId, curPage: jsonObj.curPage, pageSize: jsonObj.pageSize};
      var resp = await orderApiGetOrdersByUserId(req,propagateZipkinHeaders(ctx))
      var orders = []
      for(var i=0;i<resp.orders.length;i++){
        var merchantReq = {merchantShopId:  resp.orders[i].merchantShopId}
        merchantResp = await merchantApiGetMerchantShopByMerchantShopId(merchantReq,propagateZipkinHeaders(ctx))
        var o = resp.orders[i]
        orders.push({orderId:o.orderId,merchantShopName:merchantResp.merchantShop.name,userPrice:o.userPrice,originUserPrice:o.originUserPrice,createdAt:o.createdAt,state:o.state})
      }
      resp.orders = orders
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.post('/enduser/get_order_state', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try{
      var req = {orderId: jsonObj.orderId};
      var resp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:{state:resp.order.state,subState:resp.order.subState,tags:resp.order.tags}})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.post('/enduser/prepare_order', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {userId: ctx.jwt.userId, addrId: jsonObj.addrId, pics: jsonObj.pics, merchantShopId: jsonObj.merchantShopId};
      var resp = await orderApiPrepareOrder(req,propagateZipkinHeaders(ctx))
      var r = {prepareId: resp.prepareId, userPrice: resp.userPrice, originUserPrice: resp.originUserPrice}
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:r})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      //ctx.body = JSON.stringify({code:1,msg:'获取优惠价格失败'})
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.post('/enduser/create_order', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {userId: ctx.jwt.userId, from: jsonObj.from, addrId: jsonObj.addrId, prepareId: jsonObj.prepareId};
      var resp = await orderApiCreateOrder(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      var r = {orderId: resp.order.orderId, userPrice: resp.order.userPrice, originUserPrice: resp.order.originUserPrice}
      ctx.body = JSON.stringify({code:0,data:r})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      //ctx.body = JSON.stringify({code:1,msg:'创建订单失败'})
      ctx.body = JSON.stringify({code:1,msg:e.details})
    }
})

router.get('/enduser/svcno/jsapi_ticket', async ctx => {
    var req = {url:ctx.query.url}
    try {
      var resp = await wechatApiGetSvcnoEnduserJsapiTicket(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp.ticketInfo})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'获取jsapi ticket失败'})
    }
})

router.post('/enduser/svcno/login', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    var req = {code:jsonObj.code}
    try {
      loginResp = await wechatApiSvcnoEnduserLogin(req)
      req = { openId:loginResp.openId }
      userResp = await userApiGetUserByOpenId(req,propagateZipkinHeaders(ctx))
      console.log('userApiGetUserByOpenId:',userResp);
      var user = userResp.user
      if(!user){
        req = {from:'svcno_enduser',openId:loginResp.openId}
        createResp = await userApiCreateUser(req,propagateZipkinHeaders(ctx))
        console.log('userApiCreateUser:',createResp);
        user = createResp.user
      }
      ctx.set("Content-Type", "application/json")
      var key = randomstring.generate({length: 8,charset: 'alphabetic'})
      ctx.body = JSON.stringify({code:0,data:{userId: user.userId, token:jwt.sign({ userId: user.userId, key: key }, config.enduser_secret,{ expiresIn: '365d' })}})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'获取openId失败'})
    }
})

router.post('/enduser/get_user_addr', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var resp = {}
      if (jsonObj.lat&&jsonObj.lng){
        req = {userId:ctx.jwt.userId,lat:jsonObj.lat,lng:jsonObj.lng}
        resp = await userApiGetUserAddrByLocation(req,propagateZipkinHeaders(ctx))
      } else if (jsonObj.addrId) {
        req = {addrId:jsonObj.addrId}
        resp = await userApiGetUserAddrByAddrId(req,propagateZipkinHeaders(ctx))
      }else {
        req = {userId:ctx.jwt.userId}
        resp = await userApiGetUserAddrByUserId(req,propagateZipkinHeaders(ctx))
      }
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:resp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'获取user addr失败'})
    }
})

router.post('/enduser/create_user_addr', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
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
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:{id:resp.addr.id}})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'创建或保存user addr失败'})
    }
})

router.post('/enduser/get_deliveryinfo', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {orderId: jsonObj.orderId};
      orderResp = await orderApiGetOrderByOrderId(req,propagateZipkinHeaders(ctx))
      if (orderResp.order.state !== 'delivery_accepted' && orderResp.order.state !== 'meal_ready' 
        && orderResp.order.state !== 'deliverying' && orderResp.order.state  !== 'arrived'){
        ctx.body = JSON.stringify({code:0,data:{
          orderInfo:{state:orderResp.order.state,subState:orderResp.order.subState},
        }})
        ctx.set("Content-Type", "application/json")
        return
      }
      req = {addrId:orderResp.order.addrId}
      userAddrResp = await userApiGetUserAddrByAddrId(req,propagateZipkinHeaders(ctx))
      req = {merchantShopId: orderResp.order.merchantShopId}
      merchantResp = await merchantApiGetMerchantShopByMerchantShopId(req,propagateZipkinHeaders(ctx))
      req = {deliveryId: orderResp.order.deliveryId}
      deliveryResp = await deliveryApiGetDeliveryLocation(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:{
        orderInfo:{state:orderResp.order.state,subState:orderResp.order.subState},
        poi:{
          userAddrLngLat:{lat:userAddrResp.addr.lat,lng:userAddrResp.addr.lng},
          deliveryLngLat:{lat:deliveryResp.location.lat,lng:deliveryResp.location.lng},
          merchantLngLat:{lat:merchantResp.merchantShop.lat,lng:merchantResp.merchantShop.lng}
        }
      }})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'获取骑手信息失败'})
    }
})

router.post('/enduser/set_deliveried', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {userId: ctx.jwt.userId, orderId: jsonObj.orderId};
      orderResp = await orderApiUserSetDeliveried(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:orderResp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'设置已完成失败'})
    }
})

router.post('/enduser/set_canceled', async ctx => {
    body = ctx.request.body;
    var jsonObj = JSON.parse(body);
    try {
      var req = {userId: ctx.jwt.userId, orderId: jsonObj.orderId};
      orderResp = await orderApiUserSetCanceled(req,propagateZipkinHeaders(ctx))
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:0,data:orderResp})
    } catch (e){
      console.log(e);
      ctx.set("Content-Type", "application/json")
      ctx.body = JSON.stringify({code:1,msg:'设置取消失败'})
    }
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
    return meta
}

module.exports = router;
