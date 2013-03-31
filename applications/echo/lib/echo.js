/**
 * @fileOverview
 * Echo class definition, a trivial example application.
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
 * This application provides a UI for the client to enter messages, and echoes
 * back all entered messages with the same content.
 */
function Echo (id) {
  Echo.super_.call(this, id);
}
util.inherits(Echo, Thywill.getBaseClass("Application"));
var p = Echo.prototype;

//-----------------------------------------------------------
// Initialization
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
    // Add the client Javascript separately, as it needs to be rendered as a
    // template.
    function (asyncCallback) {
      // Load the file.
      var originFilePath = path.resolve(__dirname, "../client/js/echoClient.js");
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        uiTemplateId: "echo-template-ui",
        messageTemplateId: "echo-template-message"
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/echo/js/echoClient.js",
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
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.received = function (message) {
  this.thywill.log.debug("Echo.receive(): Message for echoing: " + message);
  // If the message came from a client connection, react by sending the same
  // data right back to where it came from.
  var messageManager = this.thywill.messageManager;
  if (message.getOrigin() === messageManager.origins.CLIENT) {
    var echoMessage = this.thywill.messageManager.createReplyMessage(message.getData(), message);
    this.send(echoMessage);
  }
};

/**
 * @see Application#connection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.connection = function (connectionId, sessionId, session) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client connected: " + connectionId);
};

/**
 * @see Application#connectionTo
 */
p.connectionTo = function (clusterMemberId, connectionId, sessionId) {
  // Do nothing, since this isn't a clustered example application.
};

/**
 * @see Application#disconnection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.disconnection = function (connectionId, sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client disconnected: " + connectionId);
};

/**
 * @see Application#disconnectionFrom
 */
p.disconnectionFrom = function (clusterMemberId, connectionId, sessionId) {
  // Do nothing, since this isn't a clustered example application.
};

/**
 * @see Application#clusterMemberDown
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {
  // Do nothing, since this isn't a clustered example application.
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;
