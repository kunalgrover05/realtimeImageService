
const express = require('express');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });
const cron = require("node-cron");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import { FileManager } from "./files";

import { ImageConverter } from "./convert";
const fileManager = new FileManager(s3, 'image-realtime', 'converted/images/');
var bodyParser     =        require("body-parser");

const overrideContentType = function(){
   return function(req, res, next) {
     if (req.headers['x-amz-sns-message-type']) {
         req.headers['content-type'] = 'application/json;charset=UTF-8';
     }
     next();
   };
 }
app.use(overrideContentType());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/public/index.html');
});

http.listen(8081, function () {
   console.log('listening on *:8081');
});

const imageConverter = new ImageConverter(s3, 'image-realtime', 'converted/');

 
const multer = require('multer');
const multerS3 = require('multer-s3');
const upload = multer({
   storage: multerS3({
     s3: s3,
     bucket: 'image-realtime',
     key: function (request, file, cb) {
       console.log(file);
       cb(null, 'images/' + file.originalname);
     }
   })
 });

 app.post('/upload', upload.single('upload'), function (req, res, next) {
    filesUpdateCheck();
    res.redirect('/');
 });
 
app.post('/uploadCallback', function (req, resp) {
   //Get the message type header.
   const messagetype = req.get("x-amz-sns-message-type");
   console.log(messagetype);
   console.log("Upload callback");
   const body = req.body;
   console.log("Body", body);

   console.log(JSON.parse(body.Message).Records[0].s3.object.key);
   if (messagetype === "Notification") {
      imageConverter.convertFile(JSON.parse(body.Message).Records[0].s3.object.key).then(data => {
         console.log("Conversion completed");
         filesUpdateCheck();
      }).catch(err => {
         console.log("ERROR");
         console.log(err);
      });
      
   } else if (messagetype === "SubscriptionConfirmation") {

      // Open the URL for Subscription confirmation
   }
});

io.on('connection', function (socket) {
   console.log('a user connected');
   socket.emit('update', fileManager.files);
});

const filesUpdateCheck = function () {
   console.log("Checking for changes");
   fileManager.haveFilesChanged()
      .then(haveChanged => {
         if (haveChanged) {
            io.emit('update', fileManager.files);
         }
      })
}
cron.schedule("*/300 * * * * *", filesUpdateCheck);


