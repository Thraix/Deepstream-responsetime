const DeepstreamServer = require('deepstream.io');
const C = DeepstreamServer.constants;

// Start a deepstream server.
const server = new DeepstreamServer("conf/config.yml");
server.start();


