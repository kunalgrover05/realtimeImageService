
const express = require('express');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });
const cron = require("node-cron");

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import { FileManager } from "./files";

import { ImageConverter } from "./convert";
const fileManager = new FileManager(s3, 'image-realtime', 'converted/');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
   console.log('listening on *:3000');
 });
 
const imageConverter = new ImageConverter(s3, 'image-realtime', 'converted/');

app.get('/uploadCallback', function(req, res) {
   imageConverter.convertFile('flutter-2.jpg')
      .then(result => {
         res.send("Convert completed");
      })
})

io.on('connection', function(socket){
  console.log('a user connected');
});

cron.schedule("*/10 * * * * *", function() {
   fileManager.haveFilesChanged()
      .then(haveChanged => {
         console.log("Changes in files", haveChanged);
      })
   console.log("running a task every minute");
   io.emit('update', { for: 'everyone' });
 });

