//import { P2cBalancer } from "load-balancers";
var lb = require("load-balancers");
const proxies = ["localhost"];
var containerCrtl = require("./ContainerController");
// Initializes the Power of 2 Choices (P2c) Balancer
const balancer = new lb.P2cBalancer(proxies.length);

exports.createSession = function(req,res,next) {
  const proxy = proxies[balancer.pick()];
  containerCrtl.createSession(proxy, req, res, next);
};
