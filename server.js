const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var hubController = require("./HubController");
app.use(bodyParser.json({limit: '2048kb'}))
app.use(bodyParser.urlencoded({extended: false }))
app.get('/', (req, res) => res.send('Welcome to Smartbox DockerHub!'))
app.post("/wd/hub/session", hubController.createSession);
app.delete("/wd/hub/session/:id", hubController.killSession);
app.all("/wd/hub/session/:id/*", hubController.forwardSession);
app.get("/host/:id", hubController.sessionInfo);

require('log-timestamp');
var clc = require("cli-color");
require('log-timestamp')(function () { return clc.blue(new Date().toLocaleString('en-GB', { timeZone: 'UTC' })) + ' %s'; });



app.listen(4444,"0.0.0.0", () => console.log("Dockerhub listening on port 4444!"));

