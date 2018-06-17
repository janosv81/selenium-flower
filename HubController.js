//import { P2cBalancer } from "load-balancers";
var lb = require("load-balancers");
var requestify = require("requestify");
const proxies = ["10.31.32.135", "10.31.32.136"];
//const proxies = ["localhost"];
const sessions = {};
var containerCrtl = require("./ContainerController");
// Initializes the Power of 2 Choices (P2c) Balancer
const balancer = new lb.P2cBalancer(proxies.length);

exports.createSession = function(req,res,next) {
  const proxy = proxies[balancer.pick()];
  containerCrtl.createSession(proxy, req, res, next,function(sessionInfo){
    sid = sessionInfo.sessionId;
    console.log("Session created: " + sid + " at " + sessionInfo.forwardUrl);
    console.log("using container: " + sessionInfo.containerID);
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
      //console.log(response.body);
      res.send(response.body);
      res.end();
    });
}

exports.killSession = function killSession(req, res) {
  sessionID = req.params.id;
  if (sessions[sessionID]){
  var forwardURL = sessions[sessionID].forwardUrl;} else{
    res.status(404).send({ error: "Problem while killing session." });
  }
  //console.log("Killing: "+forwardURL);
  //console.log(sessions);
  url = req.path.replace("/wd/hub/", "");

  requestify
    .request(forwardURL + "/" + url, {
      method: req.method,
      body: req.body,
      dataType: "json"
    })
    .then(response => {
      res.send(response.body);
      res.end();
      console.log("Session ended:" + sessionID);
      //containerCrtl.stopContainer(sessions[sessionID]);
      containerCrtl.unlinkContainer(sessions[sessionID]);
      delete sessions[sessionID];
    }).catch(err=>{
      //console.log(sessions);
      console.log("Problem while stopping session "+sessionID+" :: "+err);
      }
    );
}

exports.sessionInfo = function sessionInfo(req, res) {
  sessionID = req.params.id;
  let response = sessions[sessionID];
  response.Name = sessions[sessionID].remoteHost;
  res.json(response).end();
}