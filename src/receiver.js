let express = require('express');
deepstream = require('deepstream.io-client-js');

function pingViaRPCReceived(data, response)
{
  response.send({}); 
}
function pingViaEventReceived()
{
  client.event.emit('response/event', {});
}

function clientConnected()
{
  console.log("Sender has connected to Deepstream server");
  client.event.subscribe("receiver/event", pingViaEventReceived);
  client.rpc.provide('receiver/rpc', pingViaRPCReceived);
}

function main()
{
  client = deepstream("localhost:60020").login(clientConnected);
}

if(require.main === module) main();
