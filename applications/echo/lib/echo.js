/**
 * @fileOverview
 * Echo class definition, a trivial example application.
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
function Echo (id) {
  Echo.super_.call(this, id);
}
util.inherits(Echo, Thywill.getBaseClass('Application'));
var p = Echo.prototype;

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
      var originFilePath = path.resolve(__dirname, '../client/js/echoClient.js');
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        messageTemplateId: 'echo-template-message'
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: '/echo/js/echoClient.js',
        encoding: encoding,
        originFilePath: originFilePath,
        weight: 50
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
  this.thywill.log.debug('Echo.receivedFromClient(): Message for echoing: ' + message);
  // Sending the same data back to whence it came.
  this.sendToConnection(client, message);
};

/**
 * @see Application#connection
 *
 * Note that since this application is not configured to use sessions,
 * client.session == undefined and client.sessionId === client.connectionId.
 */
p.connection = function (client) {
  // Do nothing except log it.
  this.thywill.log.debug('Echo: Client connected: ' + client.getConnectionId());
};

/**
 * @see Application#disconnection
 *
 * Note that since this application is not configured to use sessions,
 * client.session == undefined and client.sessionId === client.connectionId.
 */
p.disconnection = function (client) {
  // Do nothing except log it.
  this.thywill.log.debug('Echo: Client disconnected: ' + client.getConnectionId());
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;
