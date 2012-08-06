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
 * @see Application#_defineBootstrapResources
 */
p._defineBootstrapResources = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;
  var clientInterface = this.thywill.clientInterface;
  
  // IDs for UI templates.
  var uiTemplateId = "echo-template-ui";
  var messageTemplateId = "echo-template-message";
  
  // Text encoding throughout.
  var encoding = "utf8";
  
  /** 
   * Helper function for loading a file to a Buffer.
   * 
   * @param {string} relativePath
   *   A relative path from this file to the file to be loaded.
   * @return {Buffer}
   *   A Buffer instance.
   */
  var bufferFromFile = function(relativePath) {
    var filepath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(filepath);
  };
  
  /** 
   * Helper function for loading a file to a string with the
   * default encoding.
   * 
   * @param {string} relativePath
   *   A relative path from this file to the file to be loaded.
   * @param {string} encoding
   *   The file encoding.
   * @return {Buffer}
   *   A Buffer instance.
   */
  var stringFromFile = function(relativePath) {
    var filepath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(filepath, encoding);
  };
  
  /**
   * Helper function for creating and storing a resource.
   * 
   * @param {Buffer} buffer
   *   A buffer instance.
   * @param {Object} attributes
   *   A set of resource attributes.
   * @param {Function} callback
   *   Of the form function (error) where error = null on success.
   */
  var createBootstrapResource = function(buffer, attributes, callback) {
    var resource = resourceManager.createResource(buffer, attributes);
    clientInterface.storeBootstrapResource(resource, callback);
  };
  
  var fns = [
    // Add Modernizr, which has to come first in the Javascript.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/modernizr/modernizr.2.6.1.min.js"), {
        encoding: encoding,
        minified: true,
        path: "/echo/js/modernizr.min.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: -30
      }, asyncCallback);
    },
    // Add jQuery as a resource, setting it a lower weight than the default
    // Thwyill code - having it come first is fairly necessary if you want
    // things to work rather than explode.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/jquery/jquery.1.7.2.min.js"), {
        encoding: encoding,
        minified: true,
        path: "/echo/js/jquery.min.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: -20
      }, asyncCallback);
    },
    // Add the plugins.js code from HTML5 Boilerplate.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/html5boilerplate/plugins.js"), {
        encoding: encoding,
        path: "/echo/js/plugins.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: -10
      }, asyncCallback);
    },    
    // Add json2.js, required by Backbone.js.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/json/json2.js"), {
        encoding: encoding,
        path: "/echo/js/json2.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: 10
      }, asyncCallback);
    },
    // Add Underscore.js, required by Backbone.js.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/underscore.js/underscore.1.3.3.min.js"), {
        encoding: encoding,
        minified: true,
        path: "/echo/js/underscore.min.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: 20
      }, asyncCallback);
    },
    // Add Backbone.js.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/backbone.js/backbone.0.9.2.min.js"), {
        encoding: encoding,
        minified: true,
        path: "/echo/js/backbone.min.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: 30
      }, asyncCallback);
    },
    // Add Handlebars.js.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/handlebars.js/handlebars.1.0.0.beta.6.js"), {
        encoding: encoding,
        path: "/echo/js/handlebars.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: 40
      }, asyncCallback);
    },
    // Add the Echo client Javascript as a resource.
    function (asyncCallback) {
      // A little templating to insert the application ID.
      var data = self.thywill.templateEngine.render(stringFromFile("../client/js/echoClient.js"), {
        applicationId: self.id,
        uiTemplateId: uiTemplateId,
        messageTemplateId: messageTemplateId
      });
      createBootstrapResource(new Buffer(data, encoding), {
        encoding: encoding,
        path: "/echo/js/echoClient.js",
        type: resourceManager.types.JAVASCRIPT, 
        weight: 50
      }, asyncCallback);
    },
    // Add HTML5 Boilerplate CSS.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../../../thirdParty/html5boilerplate/html5boilerplate.css"), {
        encoding: encoding,
        path: "/echo/css/html5boilerplate.css",
        type: resourceManager.types.CSS, 
        weight: 0
      }, asyncCallback);
    },
    // Add the Echo client CSS.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../client/css/echoClient.css"), {
        encoding: encoding,
        path: "/echo/css/client.css",
        type: resourceManager.types.CSS, 
        weight: 10
      }, asyncCallback);
    },
    // Add the Echo client UI template. Note that this won't be loaded over 
    // HTTP, but rather included into the application main page.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../client/template/ui.tpl"), {
        encoding: encoding,
        id: uiTemplateId,
        minified: true,
        path: "/echo/tpl/ui.tpl",
        type: resourceManager.types.TEMPLATE, 
        weight: 0
      }, asyncCallback);
    },
    // Add the Echo client message display template. Note that this won't be
    // loaded over HTTP, but rather included into the application main page.
    function (asyncCallback) {
      createBootstrapResource(bufferFromFile("../client/template/message.tpl"), {
        encoding: encoding,
        id: messageTemplateId,
        minified: true,
        path: "/echo/tpl/message.tpl",
        type: resourceManager.types.TEMPLATE, 
        weight: 0
      }, asyncCallback);
    },
  ];
  async.parallel(fns, callback);
};

/**
 * @see Application#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needs doing here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------

/**
 * @see Application#receive
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
 * @see Application#connection
 */
p.connection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client connected: " + sessionId);
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (sessionId) {
  // Do nothing except log it.
  this.thywill.log.debug("Echo: Client disconnected: " + sessionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;
