const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var requestify = require("requestify");
var hubController = require("./HubController");
app.use(bodyParser.json({limit: '2048kb'}))
app.use(bodyParser.urlencoded({extended: false }))
app.get('/', (req, res) => res.send('Hello World!'))
app.post("/wd/hub/session", hubController.createSession);
app.delete("/wd/hub/session/:id", killSession);
app.all("/wd/hub/session/:id/*", forwardSession);

app.listen(4444,"0.0.0.0", () => console.log("Example app listening on port 4444!"));

function forwardSession(req, res) {
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

function killSession(req, res) {
  forwardSession(req, res);
  hubController.killSession(req, res);
}
