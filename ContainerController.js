const Docker = require("dockerode");
var docker;
var dockerIsWorking = false;
const portBusy = {};
const sessions = {};
const containers = {};
const randomInt = require("random-int");
const waitOn = require("wait-on");
const requestify = require("requestify");

exports.createSession = function(hub_address, req, res, next) {
  if (portBusy[hub_address] == null) {
    portBusy[hub_address] = {};
  }
  if (hub_address == "localhost" || hub_address == "127.0.0.1") {
    docker = new Docker();
    var portSelected = 0;
    while (
      portSelected < 10000 ||
      portSelected == portBusy[hub_address][portSelected]
    ) {
      portSelected = randomInt(10000, 32000);
    }

    createDockerContainer("chrome", portSelected)
      .catch(err => {
        message = "Unable to create Docker Container::" + err;
        console.log(message);
        res.status(500).send({ error: message });
      })
      .then(container =>
        startContainer(container)
          .catch(err => {
            message = "Unable to start Docker Container::" + err;
            console.log(message);
            res.status(500).send({ error: message });
          })
          .then(container =>
            waitForWebDriverPort(container)
              .catch(err => {
                message = "Problem while waiting for webdriver::" + err;
                console.log(message);
                res.status(500).send({ error: message });
              })
              .then(container =>
                startNewSession(container, req, res)
                  .catch(err => {
                    message = "Unable to start webdriver session::" + err;
                    console.log(message);
                    res.status(500).send({ error: message });
                  })
                  .then()
              )
          )
      );
  } else {
  }
};

function createDockerContainer(browserType, portNumber) {

  return docker.createContainer({
    Image: "node-" + browserType + "",
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
    Tty: false,
    OpenStdin: false,
    ExposedPorts: {
      "9515/tcp": {}
    },
    HostConfig: {
      PortBindings: {
        "9515/tcp": [
          {
            HostPort: portNumber.toString()
          }
        ]
      }
    },
    StdinOnce: false
  });
}

function startContainer(container) {
  dockerIsWorking = true;
  return new Promise(function(resolve, reject) {
    container.start().then(container => {
      container.inspect().then(containerinfo => {
        dockerIsWorking = false;
        container.proxyPort = containerinfo.NetworkSettings.Ports["9515/tcp"][0].HostPort;
        resolve(container);
        console.log("ChromeDriver started");
        console.log(
          containerinfo.Config.Hostname +
            " - " +
            containerinfo.NetworkSettings.IPAddress +
            ":" +
            containerinfo.NetworkSettings.Ports["9515/tcp"][0].HostPort
        );
      });
    });
  });
}
function waitForWebDriverPort(container) {
  return new Promise(function(resolve, reject) {
    var opts = { resources: ["tcp:localhost:" + container.proxyPort], delay: 500, interval: 50, timeout: 30000, window: 1000 }; 
    // initial delay in ms, default 0 // poll interval in ms, default 250ms // timeout in ms, default Infinity // stabilization time in ms, default 750ms
    waitOn(opts, function(err) {
      if (err) {
        reject(err);
      } else{
        resolve(container);
      }
    });
  });
}
function startNewSession(container,req,res) {
  var port = container.proxyPort;
  return new Promise(function(resolve, reject) {
    requestify
      .request("http://localhost:" + port + "/session", {
        method: "POST",
        body: req.body,
        dataType: "json"
      })
      .then(response => {
        res.send(response.body);
        sessionObj = JSON.parse(response.body);
        sessionObj.forwardUrl = "http://localhost:" + port;
        sessionObj.forwardPort = port;
        sid = sessionObj.sessionId;
        sessions[sid] = sessionObj;
        containers[sid] = result.Id;
        resolve();
      })
      .catch(err => {
        reject("Unable to start session on port " + port + ":" + err);
      });
  });
}
