'use strict';

const OSS = require('ali-oss');
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
  }
  _transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }
}

function getOSSClient(config) {
  let client = new OSS({
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    timeout: config.timeout || 60000, // default 60 seconds
  });
  return client;
}

async function getDirList(client, prefix) {
  let result = await client.list({
    prefix: prefix,
    delimiter: '/',
  });
  let dirList = [];
  if (result && Array.isArray(result.prefixes)) {
    result.prefixes.forEach(function (dir) {
      dir = dir.slice(0, -1); // remote the tail slash
      dirList.push(dir);
    });
  }
  return dirList;
}

// download file from aliyun oss
async function download(client, filePath, cb) {
  let result = await client.getStream(filePath);
  cb(result.stream);
}

class Client {
  constructor(options) {
    options = options || {};
    // get oss client
    this.ossClient = getOSSClient(options);
  }
  // for contianers
  // ---------------------
  async getContainers(cb) {
    let dirList = await getDirList(this.ossClient, null);
    if (typeof cb === 'function') {
      cb(null, dirList);
    } else {
      return dirList;
    }
  }
  async getContainer(containerName) {
    let dirList = await getDirList(this.ossClient, containerName);
    dirList = dirList.filter(dir => {
      return dir === containerName;
    });
    return dirList;
  }
  async createContainer(options) {
    let name = options.name + '/';
    // folder in aliyun oss is just an empty file with a filename with a slash suffix
    let result = await this.ossClient.put(name, new Buffer(''));
    return result;
  }
  async destroyContainer(containerName) {
    containerName = containerName + '/';
    let result = await this.ossClient.delete(containerName);
    return result;
  }
  // for files
  // ---------------------
  upload(options) {
    let { container, remote } = options;
    let filePath = container + '/' + remote;
    // create a transform stream for read and write
    let myStream = new MyTransform();
    this.ossClient.putStream(filePath, myStream)
      .then(() => {
        // emit a success event after the read is done by oss client
        myStream.emit('success');
      })
      .catch((error) => {
        myStream.emit('error', error);
      });
    return myStream;
  }
  download(options) {
    let { container, remote } = options;
    let filePath = container + '/' + remote;
    let myStream = new MyTransform();
    this.ossClient.getStream(filePath).then(result => {
      result.stream.pipe(myStream);
    }).catch(err => {
      console.log('error------');
      console.log(err);
      myStream.emit('error', err);
    });
    return myStream;
  }
  async getFiles(container) {
    container = container ? container + '/' : null;
    let result = await this.ossClient.list({
      prefix: container,
      delimiter: '/',
    });
    let objects = [];
    if (result && Array.isArray(result.objects)) {
      objects = result.objects.filter(object => {
        return object.name !== container;
      });
    }
    return objects;
  }
  async getFile(container, file) {
    let filePath = container + '/' + file;
    let result = await this.ossClient.list({
      prefix: filePath,
      delimiter: '/',
    });
    let objects = [];
    if (result && Array.isArray(result.objects)) {
      objects = result.objects.filter(obj => {
        return obj.name === filePath;
      });
    }
    return objects;
  }
  async removeFile(container, file) {
    let filePath = container + '/' + file;
    await this.ossClient.delete(filePath);
    return;
  }
}

module.exports = Client;
