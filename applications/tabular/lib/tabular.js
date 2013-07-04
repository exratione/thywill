/**
 * @fileOverview
 * Tabular class definition, a trivial example application.
 */

var util = require('util');
var path = require('path');
var fs = require('fs');

var async = require('async');
var Thywill = require('thywill');
var bootstrapManifest = require('./bootstrapManifest');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * This trivial example application provides a UI for the client to enter
 * messages and echoes back all entered messages with the same content.
 */
function Tabular (id) {
  Tabular.super_.call(this, id);
  // Length of rows to send to the client.
  this.rowLength = 5;

  // This holds data on who is connected to this process.
  this.connections = {};
}
util.inherits(Tabular, Thywill.getBaseClass('Application'));
var p = Tabular.prototype;

//-----------------------------------------------------------
// Methods: initialization.
//-----------------------------------------------------------

/**
 * @see Application#_defineBootstrapResources
 */
p._defineBootstrapResources = function (callback) {
  var self = this;
  // Text encoding throughout.
  var encoding = 'utf8';

  // An array of functions load up bootstrap resources.
  var fns = [
    // Add resources from files listed in the bootstrap manifest.
    function (asyncCallback) {
      self.storeBootstrapResourcesFromManifest(bootstrapManifest, asyncCallback);
    },
    // Add the client Javascript separately, as it needs to be rendered as a
    // template.
    function (asyncCallback) {
      // Load the file.
      var originFilePath = path.resolve(__dirname, '../client/js/tabularApplicationInterface.js');
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: '/tabular/js/tabularApplicationInterface.js',
        encoding: encoding,
        originFilePath: originFilePath,
        weight: 2
      });
      self.storeBootstrapResource(resource, asyncCallback);
    }
  ];
  async.series(fns, callback);
};

/**
 * @see Application#_setup
 */
p._setup = function (callback) {
  // No setup is needed here, since this is a very simple example application.
  callback();
};

//-----------------------------------------------------------
// Methods: other.
//-----------------------------------------------------------

/**
 * @see Application#receivedFromClient
 */
p.receivedFromClient = function (client, message) {
  var data = message.getData();
  var connectionId = client.getConnectionId();
  if (data === 'start') {
    this.startSendingData(connectionId);
  } else if (data === 'stop') {
    this.stopSendingData(connectionId);
  }
};

/**
 * Get a random item to send to the client.
 *
 * @return {number}
 */
p.getRandomElement = function () {
  return Math.floor(Math.random() * 20000);
};

/**
 * Get a random length of time in milliseconds.
 *
 * @return {number}
 */
p.getRandomInterval = function () {
  return (1000 + Math.floor(Math.random() * 3000));
};

/**
 * Send rows of data down to a specific client at irregular intervals.
 *
 * @param {string} connectionId
 *   Connection ID of the receiving client.
 */
p.startSendingData = function (connectionId) {
  this.thywill.log.debug('Tabular: start sending data to: ' + connectionId);
  var self = this;

  // Assemble a row, send it on down.
  var data = [];
  for (var index = 0; index < this.rowLength; index++) {
    data[index] = this.getRandomElement();
  }
  this.sendToConnection(connectionId, data);

  this.connections[connectionId] = setTimeout(function () {
    self.startSendingData(connectionId);
  }, this.getRandomInterval());
};

/**
 * Stop sending data to this client.
 *
 * @param {string} connectionId
 *   Connection ID of the receiving client.
 */
p.stopSendingData = function (connectionId) {
  this.thywill.log.debug('Tabular: stop sending data to: ' + connectionId);
  clearTimeout(this.connections[connectionId]);
  delete this.connections[connectionId];
};

/**
 * @see Application#connection
 */
p.connection = function (client) {
  this.thywill.log.debug('Tabular: Client connected: ' + client.getConnectionId());
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (client) {
  this.thywill.log.debug('Tabular: Client disconnected: ' + client.getConnectionId());
  this.stopSendingData(client.getConnectionId());
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Tabular;
