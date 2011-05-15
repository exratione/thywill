
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A manager for the resources needed to bootstrap thywill and the applications. e.g.
 * CSS and Javascript files or inline code.
 */
function Resources() {
  Resources.super_.call(this);
  this.componentType = "resources";
};
util.inherits(Resources, Component);
var p = Resources.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * A resource to be loaded immediately on client connection.
 * 
 * callback - function(error), where error == null on success.
 */
p.defineBootstrapResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Return all bootstrap resource objects defined to date.
 * 
 * callback - function(error, [resource, resource...]), where error == null on success
 */
p.getBootstrapResources = function(callback) {
  throw new Error("Not implemented."); 
};

/*
 * A resource to be loaded at some point after client connection.
 * 
 * callback - function(error), where error == null on success.
 */
p.defineResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Pass a resource or null to the callback if no resource is mapped to this path.
 * 
 * callback - function(error, resource), where error == null on success.
 */
p.getResource = function(path, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resources;