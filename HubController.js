//import { P2cBalancer } from "load-balancers";
var lb = require("load-balancers");
var requestify = require("requestify");
const proxies = ["10.31.32.136"];
const sessions = {};
var containerCrtl = require("./ContainerController");
// Initializes the Power of 2 Choices (P2c) Balancer
const balancer = new lb.P2cBalancer(proxies.length);

exports.createSession = function(req,res,next) {
  const proxy = proxies[balancer.pick()];
  containerCrtl.createSession(proxy, req, res, next,function(sessionInfo){
    sid = sessionInfo.sessionId;
    sessions[sid] = sessionInfo;
    res.send(sessionInfo);
  });
};

exports.forwardSession = function forwardSession(req, res) {
  sessionID = req.params.id;
  var forwardURL = sessions[sessionID].forwardUrl;
  url = req.path.replace("/wd/hub/", "");
  //console.log(req.method + " " + forwardURL + "/" + url);
  requestify
    .request(forwardURL + "/" + url, {
      method: req.method,
      body: req.body,
      dataType: "json"
    })
    .then(response => {
      //console.log(response.body)
      res.send(response.body);
      res.end();
    });
}

exports.killSession = function killSession(req, res) {
  sessionID = req.params.id;
  var forwardURL = sessions[sessionID].forwardUrl;
  url = req.path.replace("/wd/hub/", "");
  //console.log(req.method + " " + forwardURL + "/" + url);
  requestify
    .request(forwardURL + "/" + url, {
      method: req.method,
      body: req.body,
      dataType: "json"
    })
    .then(response => {
      //console.log(response.body)
      res.send(response.body);
      res.end();
      containerCrtl.stopContainer(sessions[sessionID]);
    });
}
