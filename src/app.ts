const express = require('express');
const http = require('http');
const socket = require('socket.io');
const bodyParser = require("body-parser");

import { FileManager } from "./files";
import { ImageConverter } from "./convert";


/**********************************
 * REQUIRED OBJECTS
 *********************************/

export class AppServer {
   public httpServer;
   public io;

   constructor(public app, s3, multerUpload, public imageConverter: ImageConverter, public fileManager: FileManager) {
      /**********************************
       * MIDDLEWARES
       *********************************/
      // Override content type middleware for SNS messages.
      this.app.use((req, res, next) => {
         if (req.headers['x-amz-sns-message-type']) {
            req.headers['content-type'] = 'application/json;charset=UTF-8';
         }
         next();
      }
      );
      this.app.use(bodyParser.json());
      this.app.use(express.static(__dirname + '/public'));


      /**********************************
       * ROUTES
       *********************************/
      this.app.get('/', function (req, res) {
         res.sendFile(__dirname + '/public/index.html');
      });

      this.app.post('/upload', multerUpload.single('upload'), (req, res, next) => {
         // File update callback
         this.fileUpdateCheck();
         res.redirect('/');
      });

      this.app.post('/uploadCallback', (req, resp) => {
         //Get the message type header.
         const messagetype = req.get("x-amz-sns-message-type");
         const body = req.body;
         if (messagetype === "Notification") {
            this.imageConverter.convertFile(JSON.parse(body.Message).Records[0].s3.object.key).then(data => {
               this.fileUpdateCheck();
            }).catch(err => {
               console.log("ERROR");
               console.log(err);
            });
         } else if (messagetype === "SubscriptionConfirmation") {
            // TODO: Open the URL for Subscription confirmation
         }
      });

      /*****************************************************
       * SOCKET + HTTP SERVER
       * ***************************************************/
      this.httpServer = http.Server(this.app);
      this.io = socket(this.httpServer);

      this.io.on('connection', (socket) => {
         socket.emit('update', this.fileManager.files);
     });
   }

   fileUpdateCheck() {
      this.fileManager.haveFilesChanged()
         .then(haveChanged => {
            if (haveChanged) {
               // Broadcast to all users
               this.io.emit('update', this.fileManager.files);
            }
         });
   }
}