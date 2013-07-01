/**
 * @fileOverview
 * Draw class definition, a trivial example application.
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
 * A trivial example application.
 *
 * This application provides a UI for the client to draw on a canvas, and have
 * the result show up on the canvas of every other connected client.
 */
function Draw (id) {
  Draw.super_.call(this, id);
  // The channel used to broadcast draw data.
  this.channelId = 'draw';
}
util.inherits(Draw, Thywill.getBaseClass('Application'));
var p = Draw.prototype;

//-----------------------------------------------------------
// Initialization
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
      var originFilePath = path.resolve(__dirname, '../client/js/drawClient.js');
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        uiTemplateId: 'draw-template-ui'
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: '/draw/js/drawClient.js',
        encoding: encoding,
        originFilePath: originFilePath,
        weight: 50
      });
      self.storeBootstrapResource(resource, asyncCallback);
    }
  ];
  async.series(fns, callback);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receivedFromClient
 */
p.receivedFromClient = function (client, message) {
  // Data for a created path from paper.js.
  var data = message.getData();

  // Validate the data a little, just enough to make sure that the receiving
  // clients won't error. Since this is an example only, no need to check
  // everything.
  if (!data || !Array.isArray(data.segments)) {
    this.thywill.log.warn('Draw: invalid data received from client.' + message);
    return;
  }

  // Create a broadcast message to send the data for this path to all connected
  // clients except the one that sent this message.
  this.sendToChannel(this.channelId, data, [client]);
};

/**
 * @see Application#connection
 */
p.connection = function (client) {
  var self = this;
  this.thywill.log.debug('Draw: Client connected: ' + client.getConnectionId());
  // Every client is subscribed to the same channel, used to broadcast updates.
  this.subscribe(client, this.channelId, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
  });
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (client) {
  // Do nothing except log it.
  this.thywill.log.debug('Draw: Client disconnected: ' + client.getConnectionId());
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Draw;
