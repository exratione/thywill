/**
 * @fileOverview
 * Echo class definition, a trivial example application.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");
var Thywill = require("thywill");

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
function Echo(id) {
  Echo.super_.call(this, id);
};
util.inherits(Echo, Thywill.getBaseClass("Application"));
var p = Echo.prototype;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * Define the resources used by the application: the application client code
 * and libraries.
 * 
 * @param {Function} callback
 *   Of the form function (error) {}, where error == null on success.
 */
p._defineClientResources = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;
  var clientInterface = this.thywill.clientInterface;
  
  // IDs for UI templates.
  var uiTemplateId = "echo-template-ui";
  var messageTemplateId = "echo-template-message";
  
  // Helper function.
  var loadFromFile = function(relativePath) {
    var filepath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(filepath, "utf-8");  
  };
  // Helper function.
  var createBootstrapResource = function(type, weight, path, data, attributes, callback) {
    var resource = resourceManager.createResource(type, weight, path, data, attributes);
    clientInterface.defineBootstrapResource(resource, callback);
  };
  
  var fns = [
    // Add Modernizr - comes first in the Javascript.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/modernizr/modernizr.2.6.1.min.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, -30, "/echo/js/modernizr.min.js", data, {minified: true}, asyncCallback);
    },
    // Add jQuery as a resource, setting it a lower weight than the default
    // Thwyill code - having it come first is fairly necessary if you want
    // things to work rather than explode.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/jquery/jquery.1.7.2.min.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, -20, "/echo/js/jquery.min.js", data, {minified: true}, asyncCallback);
    },
    // Add the plugins.js code from HTML5 Boilerplate.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/html5boilerplate/plugins.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, -10, "/echo/js/plugins.js", data, {}, asyncCallback);
    },    
    // Add json2.js, required by Backbone.js.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/json/json2.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, 10, "/echo/js/json2.js", data, {}, asyncCallback);
    },
    // Add Underscore.js, required by Backbone.js.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/underscore.js/underscore.1.3.3.min.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, 20, "/echo/js/underscore.min.js", data, {minified: true}, asyncCallback);
    },
    // Add Backbone.js.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/backbone.js/backbone.0.9.2.min.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, 30, "/echo/js/backbone.min.js", data, {minified: true}, asyncCallback);
    },
    // Add Handlebars.js.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/handlebars.js/handlebars.1.0.0.beta.6.js");
      createBootstrapResource(resourceManager.types.JAVASCRIPT, 40, "/echo/js/handlebars.js", data, {}, asyncCallback);
    },
    // Add the Echo client Javascript as a resource.
    function (asyncCallback) {
      var data = loadFromFile("../client/js/echoClient.js");
      // A little templating to insert the application ID.
      data = self.thywill.template.render(data, {
        applicationId: self.id,
        uiTemplateId: uiTemplateId,
        messageTemplateId: messageTemplateId
      });
      createBootstrapResource(resourceManager.types.JAVASCRIPT, 40, "/echo/js/client.js", data, {}, asyncCallback);
    },
    // Add HTML5 Boilerplate CSS.
    function (asyncCallback) {
      var data = loadFromFile("../../../thirdParty/html5boilerplate/html5boilerplate.css");
      createBootstrapResource(resourceManager.types.CSS, 0, "/echo/css/html5boilerplate.css", data, {}, asyncCallback);
    },
    // Add the Echo client CSS.
    function (asyncCallback) {
      var data = loadFromFile("../client/css/echoClient.css");
      createBootstrapResource(resourceManager.types.CSS, 10, "/echo/css/client.css", data, {}, asyncCallback);
    },
    // Add the Echo client UI template. Note that this won't be loaded over 
    // HTTP, but rather included into the application main page.
    function (asyncCallback) {
      var data = loadFromFile("../client/template/ui.tpl");
      createBootstrapResource(resourceManager.types.TEMPLATE, 0, "/echo/tpl/ui.tpl", data, {id: uiTemplateId}, asyncCallback);
    },
    // Add the Echo client message display template. Note that this won't be
    // loaded over HTTP, but rather included into the application main page.
    function (asyncCallback) {
      var data = loadFromFile("../client/template/message.tpl");
      createBootstrapResource(resourceManager.types.TEMPLATE, 0, "/echo/tpl/message.tpl", data, {id: messageTemplateId}, asyncCallback);
    },
  ];
  async.parallel(fns, callback);
};

/**
 * Perform any actions needed prior to Thywill shutdown.
 * 
 * @param {Function} callback
 *   Of the form function () {}.
 */
p._prepareForShutdown = function (callback) {
  // Nothing needs doing here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------

/**
 * Called when a message is received. Echo back the content of received 
 * messages.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receive = function (message) {
  this.thywill.log.debug("Echo.receive(): Message for echoing: " + message.encode());
  var messageManager = this.thywill.messageManager;
  var echoMessage = messageManager.createMessage(
    message.data, 
    message.sessionId,
    messageManager.origins.SERVER,
    messageManager.destinations.CLIENT,
    this.id
  );
  this.send(echoMessage);
};

/**
 * Called when a client connects or reconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client connected: " + sessionId);
};

/**
 * Called when a client disconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client disconnected: " + sessionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;
