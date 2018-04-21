let express = require('express');
import settings from  "./config";
let now = require('performance-now');
let fs = require('fs');
let deepstream = require('deepstream.io-client-js');

const DATASCALE = 10; // How fast we should scale the data
const ITERATIONS = 100; // How many different data sizes we should send.
const PINGAMOUNT = 100; // How many times we send the same size data.

let client; // Deepstream client
let currentTime; // Keeps track of the time since a message was sent
let rtt; // The round trip time of a message
let usingRpc = true; // Flag to switch between event and RPC
let count = 0; // Counts the number of times it has sent the same message.
let dataSize = 0; // Keeps track of what iteration we are in. 
let rttData = []; // The round trip time of the data.
let avgRPCData = []; // The average round trip time for an RPC iteration
let stdRPCData = []; // The standard deviation of the round trip time for an RPC iteration
let avgEventData = []; // The average round trip time for an event iteration
let stdEventData = []; // The standard deviation of the round trip time for an event iteration

// The the JSON-object that is sent over the network.
let data1 = {
    "name":"John",
    "age":30,
    "cars": {
        "car1":"Ford",
        "car2":"BMW",
        "car3":"Fiat"
    }
 } 

// The buffer that keeps track of all the JSON-Object copies.
let dataBuffer = [];

// Calculate the average of a data set.
function avg(data)
{
  let avgi = 0;
  for(let i = 0;i<data.length; i += 1)
  {
    avgi += data[i]; 
  }
  return avgi / data.length;
}

// Calculate the standard deviation of a data set.
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

// Write data to file.
function writeToFile(data, filename)
{
  fs.writeFile(`./data/${filename}.dat`, data, (err) =>{});
}

// Called when a ping has been received
function pingReceived()
{
  rtt = now() - currentTime; 
  rttData.push(rtt);
  count += 1;
  // Send a new ping message.
  sendPing();
}

// Send a ping via RPC message.
function sendPingViaRPCMessage(data)
{
  // Update the timer.
  currentTime = now(); 
  client.rpc.make('tddd96client/receiver/rpc',data, pingReceived); 
}

function sendPingViaEvent(data)
{
  // Update the timer.
  currentTime = now(); 
  client.event.emit('tddd96client/receiver/event',data);
}

function sendPing()
{
  // Check if we are done with the iteration.
  if(count >= PINGAMOUNT)
  {
    // Reset the counter.
    count = 0;
    if(usingRpc)
    {
      // Write the data to avg,std and file.
      avgRPCData.push(avg(rttData));
      stdRPCData.push(std(rttData));
      writeToFile(rttData, `raw/rpc_${dataSize}`);
    }
    else
    {
      // Write the data to avg,std and file.
      avgEventData.push(avg(rttData));
      stdEventData.push(std(rttData));
      writeToFile(rttData, `raw/event_${dataSize}`);
    }
    // Change the current ping type
    usingRpc = !usingRpc;
    // Clear the rttData
    rttData = [];

    if(usingRpc)
    {
      dataSize += 1;
      // Update the dataBuffer with more data.
      for(let i = 0;i<DATASCALE;i+=1)
          dataBuffer.push(data1);
    }
    // Check if we are done with all iterations.
    if(dataSize >= ITERATIONS)
    {
      // Write averages and std to files.
      writeToFile(avgRPCData,"compiled/rpc_avg");
      writeToFile(stdRPCData,"compiled/rpc_std");
      writeToFile(avgEventData,"compiled/event_avg");
      writeToFile(stdEventData,"compiled/event_std");
      console.log("done"); 
      return;
    }
  }
  
  // Send ping messages
  if(usingRpc)
    sendPingViaRPCMessage(dataBuffer);
  else
    sendPingViaEvent(dataBuffer);
}
// Called when a client has connected to deepstream server.
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
  // Connect to the deepstream server.
  client = deepstream(settings.ip).login(settings.auth, clientConnected);
}

if(require.main === module) main();
