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
 */
function Shapes(id) {
  Shapes.super_.call(this, id);
};
util.inherits(Shapes, Thywill.getBaseClass("Application"));
var p = Shapes.prototype;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------


/**
 * @see Application#storeBootstrapResourcesFromManifest
 */
p.storeBootstrapResourcesFromManifest = function (bootstrapManifest, callback) {
  // Run through the manifest and add all the external items as Express routes.
  
  
  

  this.invokeSuperclassMethod(bootstrapManifest, callback);
};

/**
 * @see Application#_defineBootstrapResources
 */
p._defineBootstrapResources = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;
  var clientInterface = this.thywill.clientInterface;
  
  
  
  
  
  
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
