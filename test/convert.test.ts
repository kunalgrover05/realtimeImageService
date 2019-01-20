import { ImageConverter } from "../src/convert";

process.env.NODE_ENV = 'test';
var expect = require('chai').expect;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });

// Integration tests with a test S3 bucket to test ImageConverter class
describe('image conversion', () => {
  it('test conversion integration', async () =>  {

    const converter = new ImageConverter(s3, 'image-realtime-test', 'converted/');

    await converter.convertFile('test800x800.jpg');
    var objectsList = (await s3.listObjectsV2({ Bucket: 'image-realtime-test', MaxKeys: 1000, Prefix: 'converted/'}).promise())['Contents'] as Array<any>;
    expect(objectsList.length).to.be.equal(1);
    expect(objectsList[0].Size).to.be.below(8000); // Original size: 17KB
    expect(objectsList[0].Key).to.be.equal('converted/test800x800.jpg');
    await s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'converted/test800x800.jpg'}).promise();

    await converter.convertFile('test40x800.jpg');
    var objectsList = (await s3.listObjectsV2({ Bucket: 'image-realtime-test', MaxKeys: 1000, Prefix: 'converted/'}).promise())['Contents'] as Array<any>;
    expect(objectsList.length).to.be.equal(1);
    expect(objectsList[0].Size).to.be.below(500); // Original size: 1.5KB
    expect(objectsList[0].Key).to.be.equal('converted/test40x800.jpg');
    await s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'converted/test40x800.jpg'}).promise();

    await converter.convertFile('test40x40.jpg');
    var objectsList = (await s3.listObjectsV2({ Bucket: 'image-realtime-test', MaxKeys: 1000, Prefix: 'converted/'}).promise())['Contents'] as Array<any>;
    expect(objectsList.length).to.be.equal(1);
    expect(objectsList[0].Size).to.be.above(1000); // Original size: 800bytes
    expect(objectsList[0].Key).to.be.equal('converted/test40x40.jpg');
    await s3.deleteObject({ Bucket: 'image-realtime-test', Key: 'converted/test40x40.jpg'}).promise();

    return true;
  }).timeout(30000);

});

