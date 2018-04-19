let express = require('express');
import settings from  "./config";
let now = require('performance-now');
let fs = require('fs');
let deepstream = require('deepstream.io-client-js');

let client;
let currentTime;
let rtt;
let state = 0;
let usingRpc = true;
let count = 0;
let intervalId;
let dataSize = 0;
const DATASCALE = 10;
const ITERATIONS = 100;
const PINGAMOUNT = 100;
let rttData = []
let avgRPCData = [];
let stdRPCData = [];
let avgEventData = [];
let stdEventData = [];

let data1 = {
    "name":"John",
    "age":30,
    "cars": {
        "car1":"Ford",
        "car2":"BMW",
        "car3":"Fiat"
    }
 } 

let dataBuffer = [];

function avg(data)
{
  let avgi = 0;
  for(let i = 0;i<data.length; i += 1)
  {
    avgi += data[i]; 
  }
  return avgi / data.length;
}

function std(data, avgi)
{
  if(avgi === undefined)
    avgi = avg(data);
  let stdi = 0;
  for(let i = 0;i<data.length; i += 1)
  {
    stdi += (data[i]-avgi)*(data[i]-avgi); 
  }
  return Math.sqrt(stdi / (data.length-1));
  
}

function writeToFile(data, filename)
{
  fs.writeFile(`./data/${filename}.dat`, data, (err) =>{});
}

function pingReceived()
{
  rtt = now() - currentTime; 
  rttData.push(rtt);
  // Set state to be ready to send another ping.
  state = 0;
  count += 1;
  sendPing();
}

function sendPingViaRPCMessage(data)
{
  // Wait for the state to be ready to send another rpc.
  while(state !== 0) {}
  // Set state to waiting for response.
  state = 1;
  currentTime = now(); 
  client.rpc.make('tddd96client/receiver/rpc',data, pingReceived); 
}

function sendPingViaEvent(data)
{
  while(state !== 0){}
  state = 1;
  currentTime = now(); 
  client.event.emit('tddd96client/receiver/event',data);
}

function sendPing()
{
  if(count >= PINGAMOUNT)
  {
    count = 0;
    if(usingRpc)
    {
      avgRPCData.push(avg(rttData));
      stdRPCData.push(std(rttData));
      writeToFile(rttData, `raw/rpc_${dataSize}`);
    }
    else
    {
      avgEventData.push(avg(rttData));
      stdEventData.push(std(rttData));
      writeToFile(rttData, `raw/event_${dataSize}`);
    }
    usingRpc = !usingRpc;
    rttData = [];
    if(usingRpc)
    {
      dataSize += 1;
      dataBuffer.push(data1);
    }
    if(dataSize >= ITERATIONS)
    {
      writeToFile(avgRPCData,"compiled/rpc_avg");
      writeToFile(stdRPCData,"compiled/rpc_std");
      writeToFile(avgEventData,"compiled/event_avg");
      writeToFile(stdEventData,"compiled/event_std");
      console.log("done"); 
      return;
    }
  }

  if(usingRpc)
    sendPingViaRPCMessage(dataBuffer);
  else
    sendPingViaEvent(dataBuffer);
}

async function clientConnected(success,data) 
{
  if(!success)
    console.log(data);
  else
   {
  await console.log("Client has connected to Deepstream server");
  await client.event.subscribe("tddd96client/response/event", pingReceived);
  sendPing();
   }
}

function main()
{
  client = deepstream(settings.ip).login(settings.auth, clientConnected);
}

if(require.main === module) main();
