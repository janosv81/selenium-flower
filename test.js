const Docker = require('dockerode');
docker = new Docker({ protocol: 'http', host: '10.31.32.135', port: 4243 });
docker.createContainer({
  Image: 'vjanos/chrome-node',
  AttachStdin: false,
  AttachStdout: false,
  AttachStderr: false,
  Tty: false,
  OpenStdin: false,
  ExposedPorts: {
    '9515/tcp': {}
  },
  HostConfig: {
    PortBindings: {
      '9515/tcp': [
        {
          HostPort: "1234"
        }
      ]
    }
  },
  StdinOnce: false
});
