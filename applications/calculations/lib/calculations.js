/**
 * @fileOverview
 * Calculations class definition, a trivial example application.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");
var Thywill = require("thywill");
var bootstrapManifest = require("./bootstrapManifest");
var rpcFunctions = require("./rpcFunctions");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial example application.
 *
 * This application provides a UI for the client to enter some numbers and
 * provoke a few simple RPC calls to the server.
 */
function Calculations (id) {
  Calculations.super_.call(this, id);
}
util.inherits(Calculations, Thywill.getBaseClass("RpcCapableApplication"));
var p = Calculations.prototype;

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
      var originFilePath = path.resolve(__dirname, "../client/js/calculationsClient.js");
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        uiTemplateId: "calculations-template-ui"
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/calculations/js/calculationsClient.js",
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
  // Set up functions in contexts that are accessible for client remote
  // procedure calls, and with appropriate permissions.
  this.rpcContext.multiplicative = rpcFunctions.multiplicative;
  this.rpcContext.powers = rpcFunctions.powers;

  // TODO: permissions.

  callback();
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.receivedFromClient = function (client, message) {
  // Nothing doing here - all of the functionality of this example works via
  // the RPC framework provided by the RpcCapableApplication class.
};

/**
 * @see Application#connection
 *
 * Note that since this application is not configured to use sessions,
 * client.session == undefined and client.sessionId === client.connectionId.
 */
p.connection = function (client) {
  // Do nothing except log it.
  this.thywill.log.debug("Calculations: Client connected: " + client.getConnectionId());
};

/**
 * @see Application#disconnection
 *
 * Note that since this application is not configured to use sessions,
 * client.session == undefined and client.sessionId === client.connectionId.
 */
p.disconnection = function (client) {
  // Do nothing except log it.
  this.thywill.log.debug("Calculations: Client disconnected: " + client.getConnectionId());
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Calculations;
