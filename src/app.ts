
const express = require('express');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });
const cron = require("node-cron");
var SNSClient = require('aws-snsclient');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import { FileManager } from "./files";

import { ImageConverter } from "./convert";
import { request } from "http";
const fileManager = new FileManager(s3, 'image-realtime', 'converted/');
var bodyParser     =        require("body-parser");
app.use(bodyParser.json());

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
});

http.listen(8081, function () {
   console.log('listening on *:8081');
});

const imageConverter = new ImageConverter(s3, 'image-realtime', 'converted/');

var auth = {
   verify: false
};
var client = SNSClient(auth, function (err, message) {
   console.log(message);
   // console.log(message);
   console.log("Converting");
   imageConverter.convertFile('flutter-2.jpg').then(data => {
      console.log("Conversion completed");
   }).catch(err => {
      console.log("ERROR");
      console.log(err);
   });
});

app.post('/uploadCallback', function (req, resp) {
   //Get the message type header.
   const messagetype = req.get("x-amz-sns-message-type");
   console.log(messagetype);
   console.log("Upload callback");
   console.log(req.body);
   if (messagetype === "Notification") {
   } else if (messagetype === "SubscriptionConfirmation") {
      console.log(req.body);
   }
});

io.on('connection', function (socket) {
   console.log('a user connected');
});

cron.schedule("*/100 * * * * *", function () {
   fileManager.haveFilesChanged()
      .then(haveChanged => {
      })
   io.emit('update', { for: 'everyone' });
});


