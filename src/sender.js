let express = require('express');
let now = require('performance-now');
let fs = require('fs');
deepstream = require('deepstream.io-client-js');

let client;
let currentTime;
let rtt;
let state = 0;
let usingRpc = true;
let count = 0;
let intervalId;
let dataSize = 0;
const PINGAMOUNT = 100;
let rttData = []
let data = {"id": 10, "client": "asjhdsd_asjdhwd"}
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
  return stdi / data.length;
  
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
  client.rpc.make('receiver/rpc',data, pingReceived); 
}

function sendPingViaEvent(data)
{
  while(state !== 0){}
  state = 1;
  currentTime = now(); 
  client.event.emit('receiver/event',data);
}

function calcDataSize()
{
  let data = [];
  for(let i = 0; i < dataSize;i+=1)
  {
    data.push(data1);
  }
  return data;
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
      writeToFile(rttData, `rpc_${dataSize}`);
    }
    else
    {
      avgEventData.push(avg(rttData));
      stdEventData.push(std(rttData));
      writeToFile(rttData, `event_${dataSize}`);
    }
    usingRpc = !usingRpc;
    rttData = [];
    if(usingRpc)
      dataSize += 1;
    if(dataSize >= 100)
    {
      writeToFile(avgRPCData,"rpc_avg");
      writeToFile(stdRPCData,"rpc_std");
      writeToFile(avgEventData,"event_avg");
      writeToFile(stdEventData,"event_std");
      console.log("done") 
      return;
    }
  }

  if(usingRpc)
    sendPingViaRPCMessage(calcDataSize());
  else
    sendPingViaEvent(calcDataSize());
}

async function clientConnected() 
{
  await console.log("Client has connected to Deepstream server");
  await client.event.subscribe("response/event", pingReceived);
  sendPing();
}

function main()
{
  client = deepstream("localhost:60020").login(clientConnected);
}

if(require.main === module) main();
