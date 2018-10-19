//import { P2cBalancer } from "load-balancers";
var lb = require("load-balancers");
var requestify = require("requestify");
const proxies = ["10.11.0.182",
  "10.11.0.190",
  "10.11.0.191",
  "10.11.0.192",
  "10.11.0.193",
  "10.11.0.194",
  "10.11.0.195",
  "10.11.0.196",
  "10.11.0.197",
  "10.11.0.198",
  "10.11.0.199",
  "10.11.0.207",
  "10.11.0.208",
  "10.11.0.209",
  "10.11.0.210"];
//const proxies = ["localhost"];
const sessions = {};
const usage = {};
const max_browsers = 4;
const newsession_timeout = 60000;
//var containerCrtl = require("./ContainerController");


exports.createSession = function (req, res, next) {
  console.log("Incoming request to create session.");
  waitForNode().then(node=>{
    url = req.path;
    forwardURL = "http://" + node + ":5555";
    console.log(req.method + " " + forwardURL + url);
    var start = process.hrtime();
    //req.header.set("Content-Type", "application/json");
    requestify
      .request(forwardURL + url, {
        method: req.method,
        body: req.body,
        dataType: "json"
      })
      .then(response => {
        body = JSON.parse(response.body);
        finish = process.hrtime(start);
        console.log("Session " + body.sessionId + " created at " + node + " after " + finish[0] + " second and " + (finish[1] / 1000000) + " ms");
        sessions[body.sessionId] = {};
        sessions[body.sessionId].forwardUrl = forwardURL;
        val = usage[node] || 0;
        usage[node] = val + 1;
        res.send(response.body);
        res.end();
      }).catch(resp => {
        console.log(resp.code + resp.body);
        res.send(response.body);
        res.end();
      });
  }).catch(err=>{
    res.status(500).send(err);
  });


};

exports.forwardSession = function forwardSession(req, res) {
  sessionID = req.params.id;
  var forwardURL = sessions[sessionID].forwardUrl;
  url = req.path;
  console.log(req.method + " " + forwardURL + "/" + url);
  requestify
    .request(forwardURL +  url, {
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
    return;
  }
  console.log("Killing session: "+sessionID);
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
      containerCrtl.unlinkContainer(sessions[sessionID]).then(result=>{
        delete sessions[sessionID];
        val = usage[node] || 0;
        usage[node] = val - 1;
      });
      
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

function waitForNode() {
  var endTime = Number(new Date()) + (newsession_timeout || 30000);
  return new Promise(function (resolve, reject) {
    node = null;
    while (node == null && Number(new Date()) < endTime) {
      // Initializes the Power of 2 Choices (P2c) Balancer
      const balancer = new lb.P2cBalancer(proxies.length);
      select = proxies[balancer.pick()];
      console.log("Usage of "+select+" is:"+usage[select]);
      use = usage[select] || 0;
      if (use < max_browsers) {
        node = select;
        resolve(node);
      }
    }
    reject('Timed out while waiting for new browser session to be available...');
  });
}