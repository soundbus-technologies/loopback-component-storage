'use strict';

const Client = require('./client');

module.exports.storage = module.exports; // To make it consistent with pkgcloud
exports.Client = Client;
exports.Container = require('./container').Container;
exports.File = require('./file').File;

exports.createClient = function(options) {
  let client = new Client(options);
  return client;
};
