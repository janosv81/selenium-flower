const Docker = require("dockerode");
var docker;
var dockerIsWorking = false;
const portBusy = {};
const containers = {};
const randomInt = require("random-int");
const async = require("async");
const waitOn = require("wait-on");
const requestify = require("requestify");

exports.createSession = async function (hub_address, req, res, next,cb) {
  if (portBusy[hub_address] == null) {
    portBusy[hub_address] = {};
  }
  if (hub_address == "localhost" || hub_address == "127.0.0.1") {
    docker = new Docker();
  } else {
    docker = new Docker({ protocol: 'http', host: hub_address, port: 4243 });
  }
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
                .then(sessionInfo => {
                  cb(sessionInfo);
                })
            )
        )
    );
};

function createDockerContainer(browserType, portNumber) {

  return docker.createContainer({
    Image: "vjanos/chrome-node",
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
  return new Promise(function (resolve, reject) {
    var count = 0;
    async.whilst(
      function () {
        return dockerIsWorking;
      },
      function (callback) {
        count++;
        setTimeout(function () {
          callback(null, count);
        }, 600);
      },
      function (err, n) {
        dockerIsWorking = true;

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
      }
    );
  });
}
function waitForWebDriverPort(container) {
  return new Promise(function (resolve, reject) {
    var opts = { resources: ["tcp:" + container.modem.host +":" + container.proxyPort], delay: 500, interval: 50, timeout: 30000, window: 1000 };
    // initial delay in ms, default 0 // poll interval in ms, default 250ms // timeout in ms, default Infinity // stabilization time in ms, default 750ms
    waitOn(opts, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(container);
      }
    });
  });
}

function startNewSession(container, req, res) {
  var port = container.proxyPort;
  var remoteHost = container.modem.host;
  var containerID=container.id;
  return new Promise(function (resolve, reject) {
    requestify
      .request("http://" + remoteHost+":" + port + "/session", {
        method: "POST",
        body: req.body,
        dataType: "json"
      })
      .then(response => {
        sessionObj = JSON.parse(response.body);
        sessionObj.remoteHost = remoteHost;
        sessionObj.forwardUrl = "http://"+remoteHost+":" + port;
        sessionObj.forwardPort = port;
        sessionObj.containerID = containerID;
        resolve(sessionObj);
      })
      .catch(err => {
        reject("Unable to start session on port " + port + ":" + err);
      });
  });
}

exports.stopContainer = function (sessionInfo) {
  //console.log("Stopping container: " + sessionInfo.containerID);
  hub_address = sessionInfo.remoteHost;
  if (hub_address == "localhost" || hub_address == "127.0.0.1") {
    docker = new Docker();
  } else {
    docker = new Docker({ protocol: 'http', host: hub_address, port: 4243 });
  }
  var container = docker.getContainer(sessionInfo.containerID);
  container.stop().then(result => {
    container.remove({ force: true }, function (err, data) {
    });
  }).catch(err => {
    console.log("Error while stopping container:" + err);
  });

};

function waitForDockerStop(remoteHost, containerID) {
  return new Promise(function (resolve, reject) {
    var opts = { resources: ["http://" + remoteHost + ":4243/containers/" + containerID + "/json"], delay: 200, interval: 50, timeout: 5000, window: 1000, reverse: true };
    // initial delay in ms, default 0 // poll interval in ms, default 250ms // timeout in ms, default Infinity // stabilization time in ms, default 750ms
    waitOn(opts, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}