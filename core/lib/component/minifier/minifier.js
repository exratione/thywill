/**
 * @fileOverview
 * Minifier class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Superclass for handling minification and compression of resources.
 */
function Minifier() {
  Minifier.super_.call(this);
  this.componentType = "minify";
}
util.inherits(Minifier, Thywill.getBaseClass("Component"));
var p = Minifier.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Minify the contents of a resource object. The new resources is not yet
 * stored by the resourceManager.
 *
 * @param {Resource} resource
 *   A Resource instance.
 * @param {Function} callback
 *   Of the form function (error, resource), where error === null on success and
 *   resource is a new Resource object the existing Resource object if it could
 *   not be minified.
 */
p.minifyResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Minify and merge an array of resources. Newly created resources are not yet
 * stored by the resourceManager.
 *
 * @param {Resource[]} resource
 *   A resource instance.
 * @param {boolean} minifyJavascript
 *   If true, minify and merge Javascript resources.
 * @param {boolean} minifyCss
 *   If true, minify and merge CSS resources.
 * @param {Function} callback
 *   Of the form function (error, minifiedResources, addedResources), where
 *   error === null on success.
 *
 *   minifiedResources: is a new Resource object array, with the unminified
 *   resources removed and new minified and merged resources added. Resources
 *   that cannot be minified will remain as they are in the array. The ordering
 *   of resources is otherwise preserved.
 *
 *   addedResources: is an array of minified and merged resources created in
 *   this function call, but not stored anywhere yet.
 */
p.minifyResources = function(resources, minifyJavascript, minifyCSS, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Minifier;
