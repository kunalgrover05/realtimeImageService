const express = require('express');
const http = require('http');
const socket = require('socket.io');
const AWS = require('aws-sdk');
const cron = require("node-cron");
const bodyParser = require("body-parser");
const multer = require('multer');
const multerS3 = require('multer-s3');

import { FileManager } from "./files";
import { ImageConverter } from "./convert";

/**********************************
 * CONSTANTS
 *********************************/
const BUCKET = 'image-realtime';
const IMAGES_PREFIX = 'images/';
const CONVERTED_PREFIX = 'converted/';
 
/**********************************
 * REQUIRED OBJECTS
 *********************************/
const app = express();
const httpServer = http.Server(app);
const io = socket(httpServer);
const s3 = new AWS.S3({ signatureVersion: 'v4' });
const fileManager = new FileManager(s3, BUCKET, CONVERTED_PREFIX + IMAGES_PREFIX);
const imageConverter = new ImageConverter(s3, BUCKET, CONVERTED_PREFIX);
const upload = multer({
   storage: multerS3({
      s3: s3,
      bucket: BUCKET,
      key: function (request, file, cb) {
         // Filename should not contain any spaces
         cb(null, IMAGES_PREFIX + file.originalname.replace(/ /g, '_'));
      }
   })
});


/**********************************
 * MIDDLEWARES
 *********************************/
// Override content type middleware for SNS messages.
app.use((req, res, next) => {
   if (req.headers['x-amz-sns-message-type']) {
      req.headers['content-type'] = 'application/json;charset=UTF-8';
   }
   next();
}
);
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));


/**********************************
 * ROUTES
 *********************************/
app.get('/', function (req, res) {
   res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', upload.single('upload'), function (req, res, next) {
   filesUpdateCheck();
   res.redirect('/');
});

app.post('/uploadCallback', function (req, resp) {
   //Get the message type header.
   const messagetype = req.get("x-amz-sns-message-type");
   const body = req.body;
   if (messagetype === "Notification") {
      imageConverter.convertFile(JSON.parse(body.Message).Records[0].s3.object.key).then(data => {
         filesUpdateCheck();
      }).catch(err => {
         console.log("ERROR");
         console.log(err);
      });
   } else if (messagetype === "SubscriptionConfirmation") {
      // TODO: Open the URL for Subscription confirmation
   }
});

io.on('connection', function (socket) {
   socket.emit('update', fileManager.files);
});

httpServer.listen(8081, function () {
});

/**********************************
 * CRON PROCESS
 * Required for distributed servers
 *********************************/
const filesUpdateCheck = function () {
   fileManager.haveFilesChanged()
      .then(haveChanged => {
         if (haveChanged) {
            // Broadcast to all users
            io.emit('update', fileManager.files);
         }
      })
}
cron.schedule("*/300 * * * * *", filesUpdateCheck);