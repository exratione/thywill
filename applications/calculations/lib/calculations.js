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
  this._setupRpcFunctions();
}
util.inherits(Calculations, Thywill.getBaseClass("RpcCapableApplication"));
var p = Calculations.prototype;

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
    // Add the Calculations client Javascript separately, as it needs to be rendered
    // as a template.
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
 * Set up functions in contexts that are accessible for client remote
 * procedure calls, and with appropriate permissions.
 */
p._setupRpcFunctions = function () {
  // Set up functions for the remote procedure calls to access.
  this.rpcContext.multiplicative = rpcFunctions.multiplicative;
  this.rpcContext.powers = rpcFunctions.powers;

  // TODO: permissions

};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.received = function (message) {
  // Nothing doing here - all of the functionality of this example works via
  // the RPC framework provided by the RpcCapableApplication class.
};

/**
 * @see Application#connection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.connection = function (connectionId, sessionId, session) {
  // Do nothing except log it.
  this.thywill.log.debug("Calculations: Client connected: " + connectionId);
};

/**
 * @see Application#disconnection
 *
 * Note that since this application is configured to use no sessions,
 * session === null and sessionId === connectionId.
 */
p.disconnection = function (connectionId, sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Calculations: Client disconnected: " + connectionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Calculations;
