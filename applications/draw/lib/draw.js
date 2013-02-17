/**
 * @fileOverview
 * Draw class definition, a trivial example application.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");
var Thywill = require("thywill");
var bootstrapManifest = require("./bootstrapManifest");

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
  this.channelId = "draw";
}
util.inherits(Draw, Thywill.getBaseClass("Application"));
var p = Draw.prototype;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * @see Application#_defineBootstrapResources
 */
p._defineBootstrapResources = function (callback) {
  var self = this;
  // Text encoding throughout.
  var encoding = "utf8";

  // An array of functions load up bootstrap resources.
  var fns = [
    // Add resources from files listed in the bootstrap manifest.
    function (asyncCallback) {
      self.storeBootstrapResourcesFromManifest(bootstrapManifest, asyncCallback);
    },
    // Add the Echo client Javascript separately, as it needs to be rendered
    // as a template.
    function (asyncCallback) {
      // Load the file.
      var originFilePath = path.resolve(__dirname, "../client/js/drawClient.js");
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        uiTemplateId: "draw-template-ui"
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/draw/js/drawClient.js",
        encoding: encoding,
        isGenerated: true,
        minified: false,
        originFilePath: originFilePath,
        type: self.thywill.resourceManager.types.JAVASCRIPT,
        weight: 50
      });
      self.storeBootstrapResource(resource, asyncCallback);
    }
  ];
  async.series(fns, callback);
};

/**
 * @see Application#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needs doing here.
  callback();
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.received = function (message) {

  // A created path.
  var data = message.getData();

  // Create a broadcast message.
  var messageManager = this.thywill.messageManager;
  var broadcastMessage = messageManager.createMessage(data);
  broadcastMessage.setChannelId(this.channelId);
  // The message will go to everyone in the channel except this connection,
  // i.e. not to the one that sent it, effectively.
  broadcastMessage.setConnectionId(message.connectionId);
  broadcastMessage.setFromApplicationId(this.id);
  broadcastMessage.setToApplicationId(this.id);
  broadcastMessage.setOrigin(messageManager.origins.SERVER);
  broadcastMessage.setDestination(messageManager.destinations.CLIENT);
  this.send(broadcastMessage);
};

/**
 * @see Application#connection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.connection = function (connectionId, sessionId, session) {
  this.thywill.log.debug("Draw: Client connected: " + connectionId);
  // Every client is subscribed to the same channel, used to broadcast updates.
  this.thywill.clientInterface.subscribe(connectionId, this.channelId);
};

/**
 * @see Application#disconnection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.disconnection = function (connectionId, sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Draw: Client disconnected: " + connectionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Draw;
