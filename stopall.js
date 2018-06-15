var Docker = require('dockerode');
var docker = new Docker();

docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
      console.log("Stopping container:" + containerInfo.Id);
      docker.getContainer(containerInfo.Id).stop().then(res=>{
        docker.getContainer(containerInfo.Id).remove();
      });
    });
  });