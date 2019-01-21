import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { FileManager } from '../src/files';
import { ImageConverter } from '../src/convert';
import { AppServer } from '../src/app';

var expect = require('chai').expect;
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const express = require('express');

chai.use(chaiHttp);
const io = require('socket.io-client');

describe('app routes test', () => {
    before((done) => {
        this.s3 = new AWS.S3({ signatureVersion: 'v4' });
        const upload = multer({
            storage: multerS3({
                s3: this.s3,
                bucket: 'image-realtime-test',
                key: function (request, file, cb) {
                    // Filename should not contain any spaces
                    cb(null, 'upload/' + file.originalname.replace(/ /g, '_'));
                }
            })
        });

        this.appServer = new AppServer(express(),
            this.s3,
            upload,
            new ImageConverter(this.s3, 'image-realtime-test', 'uploadConverted/'),
            new FileManager(this.s3, 'image-realtime-test', 'uploadConverted/' + 'upload/'));

        this.appServer.httpServer.listen(8081, done());
    });

    beforeEach((done) => {
        this.socket = io.connect('http://localhost:8081', {
            transports: ['websocket'],
        });
        this.socket.on('connect', done);
    });

    afterEach(() => {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    })

    after(() => {
        this.appServer.httpServer.close();
    });

    it('upload file', async () => {
        const res = await chai.request('http://localhost:8081')
            .post('/upload/')
            .field('Content-Type', 'multipart/form-data')
            .attach('upload', 'test/test800x800.jpg', 'test800x800.jpg');

        expect(res.status).to.be.equal(200);

        // Verify that file was uploaded
        var objectsList = (await this.s3.listObjectsV2({ Bucket: 'image-realtime-test', MaxKeys: 1000, Prefix: 'upload/' })
            .promise())['Contents'] as Array<any>;
        expect(objectsList.length).to.be.equal(2);

        await this.s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'upload/test800x800.jpg' }).promise();
        await this.s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'uploadConverted/test800x800.jpg' }).promise();

    }).timeout(60000);

    it('upload callback works and calls socket', (done) => {
        chai.request('http://localhost:8081')
            .post('/uploadCallback/')
            .set('x-amz-sns-message-type', 'Notification')
            .send({ Message: '{"Records": [{"s3": {"object": {"key": "upload/test2_800x800.jpg"}}}]}' })
            .end(function (err, res) {
                console.log(err);
                console.log(res.status);
            })

        this.socket.on('update', (files) => {
            console.log("Filels update");
            done();
        });
    }).timeout(60000);

})