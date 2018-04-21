let express = require('express');
import settings from  "./config";
let deepstream = require('deepstream.io-client-js');
let client;

// Respond from RPC call
function pingViaRPCReceived(data, response)
{
  response.send({}); 
}

// Respond from event call
function pingViaEventReceived(data)
{
  client.event.emit('tddd96client/response/event', {});
}

// Called when a client has connected to deepstream server.
function clientConnected()
{
  console.log("Sender has connected to Deepstream server");
  client.event.subscribe("tddd96client/receiver/event", pingViaEventReceived);
  client.rpc.provide('tddd96client/receiver/rpc', pingViaRPCReceived);
}

function main()
{
  // Connect to the deepstream server.
  client = deepstream(settings.ip).login(settings.auth,clientConnected);
}

if(require.main === module) main();
