/**
 * @fileOverview
 * Shapes class definition, an example application illustrated
 * staged availability of resources.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");
var Thywill = require("thywill");
var ExpressApplication = require("../../../core/lib/component/application/expressApplication/expressApplication");
var bootstrapManifest = require("./bootstrapManifest");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * An example application.
 *
 * This provides a UI where a user can request new shapes to be made available
 * and then place the shapes on a canvas.
 *
 * @see ExpressApplication
 */
function Shapes (id, app) {
  Shapes.super_.call(this, id, app);
}
util.inherits(Shapes, ExpressApplication);
var p = Shapes.prototype;

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
    // Add the Shapes client Javascript separately, as it needs to be rendered
    // as a template.
    function (asyncCallback) {
      // Load the file.
      var originFilePath = path.resolve(__dirname, "../client/js/shapesClient.js");
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/shapes/js/shapesClient.js",
        encoding: encoding,
        isGenerated: true,
        minified: false,
        originFilePath: originFilePath,
        type: self.thywill.resourceManager.types.JAVASCRIPT,
        weight: 50
      });
      self.thywill.clientInterface.storeBootstrapResource(resource, asyncCallback);
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
p.receive = function (message) {




};

/**
 * @see Application#connection
 */
p.connection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Shapes: Client connected: " + sessionId);
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Shapes: Client disconnected: " + sessionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Shapes;
