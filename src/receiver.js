let express = require('express');
import settings from  "./config";
let deepstream = require('deepstream.io-client-js');
let client;
function pingViaRPCReceived(data, response)
{
  response.send({}); 
}
function pingViaEventReceived()
{
  client.event.emit('tddd96client/response/event', {});
}

function clientConnected()
{
  console.log("Sender has connected to Deepstream server");
  client.event.subscribe("tddd96client/receiver/event", pingViaEventReceived);
  client.rpc.provide('tddd96client/receiver/rpc', pingViaRPCReceived);
}

function main()
{
  client = deepstream(settings.ip).login(settings.auth,clientConnected);
}

if(require.main === module) main();
