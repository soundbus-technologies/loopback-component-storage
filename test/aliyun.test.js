'use strict';

const assert = require('assert');
const fs = require('fs');
var path = require('path');
const AliyunProvider = require('../lib/providers/aliyun/index.js').Client;

// 1. put your aliyun oss configuration
let aliyunOssConfig = {
  'accessKeyId': 'your key',
  'accessKeySecret': 'your key secret',
  'bucket': 'your bucket',
  'region': 'your region',
};

// 2. prepare the dir like this before runing the testing:
// - test-container-file
//   - file.get
//   - file.download
//   - file.delete

describe('Aliyun oss provider', function () {
  let client;
  before(() => {
    client = new AliyunProvider(aliyunOssConfig);
  });
  describe('container apis', function () {
    let containerName = 'test-container';
    it('should create a new container', async () => {
      let container = await client.createContainer({ name: containerName });
      assert(container);
    });
    it('should get a list of containers', async () => {
      let containers = await client.getContainers();
      assert(containers.length > 0);
    });
    it('should get the container: ' + containerName, async () => {
      let container = await client.getContainer(containerName);
      assert.equal(container.length, 1);
    });
    it('should destroy a container: ' + containerName, async () => {
      await client.destroyContainer(containerName);
      let container = await client.getContainer(containerName);
      assert.equal(container.length, 0);
    });
  });
  describe('file apis', function () {
    let containerName = 'test-container-file';
    let filename = 'file';
    it('should upload a file', (done) => {
      let localFilename = filename + '.upload';
      var writer = client.upload({ container: containerName, remote: localFilename });
      fs.createReadStream(path.join(__dirname, 'files/f1.txt')).pipe(writer);
      writer.on('finish', done);
      writer.on('error', done);
    });
    it('should dowanload a file', (done) => {
      let localFilename = filename + '.download';
      var reader = client.download({
        container: containerName,
        remote: localFilename,
      });
      reader.pipe(
        fs.createWriteStream(path.join(__dirname, 'files/f1_downloaded.txt'))
      );
      reader.on('end', done);
      reader.on('error', done);
    });
    it('should get files for a container', async () => {
      let files = await client.getFiles(containerName);
      assert(files.length > 0);
    });
    it('should get a file', async () => {
      let localFilename = filename + '.get';
      let file = await client.getFile(containerName, localFilename);
      assert.equal(file.length, 1);
    });
    it('should remove a file', async () => {
      let localFilename = filename + '.delete';
      await client.removeFile(containerName, localFilename);
      let file = await client.getFile(containerName, localFilename);
      assert.equal(file.length, 0);
    });
  });
});
