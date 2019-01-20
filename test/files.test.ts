import { FileManager } from "../src/files";
import { ImageConverter } from "../src/convert";

process.env.NODE_ENV = 'test';
var expect = require('chai').expect;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });

// Integration tests with a test S3 bucket to test FileManager class
describe('files tracking', () => {
    it('test file tracking', async () => {
        const converter = new ImageConverter(s3, 'image-realtime-test', 'files/');
        // Create an initial file
        await converter.convertFile('test800x800.jpg');

        const fileManager = new FileManager(s3, 'image-realtime-test', 'files/');
        await fileManager.haveFilesChanged();
        expect(fileManager.files.length).to.be.equal(1);

        // New File
        await converter.convertFile('test40x40.jpg');
        var changes = await fileManager.haveFilesChanged();
        expect(changes).to.be.equal(true);
        expect(fileManager.files.length).to.be.equal(2);

        // Delete files
        await s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'files/test40x40.jpg' }).promise();
        await s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'files/test800x800.jpg' }).promise();
        changes = await fileManager.haveFilesChanged();
        expect(changes).to.be.equal(true);
        expect(fileManager.files.length).to.be.equal(0);

        console.log("COMPELTED");
        return true;
    }).timeout(30000);

});
