const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const cron = require("node-cron");
const express = require('express');

import { ImageConverter } from './convert';
import { FileManager } from './files';
import { AppServer } from './app';

/**********************************
 * CONSTANTS
 *********************************/
const BUCKET = 'image-realtime';
const IMAGES_PREFIX = 'images/';
const CONVERTED_PREFIX = 'converted/';


const s3 = new AWS.S3({ signatureVersion: 'v4' });
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

const appServer = new AppServer(express(),
    s3,
    upload,
    new ImageConverter(s3, BUCKET, CONVERTED_PREFIX),
    new FileManager(s3, BUCKET, CONVERTED_PREFIX + IMAGES_PREFIX));


/*************************************
 * HTTP SERVER START
 * ***********************************/
appServer.httpServer.listen(8081);

/**********************************
 * CRON PROCESS
 * Required for distributed servers
 *********************************/
cron.schedule("*/300 * * * * *", () => appServer.fileUpdateCheck());