/**
 * @fileOverview
 * InMemoryResource class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Instances represent resources such as CSS and Javascript, and are stored in
 * memory rather than persisting.
 * 
 * @param {string} type
 *   One of the defined resource types.
 * @param {number} weight
 *   An ordering weight: larger values go last.
 * @param {string} path
 *   The resource path.
 * @param {string} data
 *   The body of the resource.
 * @param {Object} attributes
 *   Further resource attributes.
 */
function InMemoryResource(type, weight, path, data, attributes) {
  InMemoryResource.super_.call(this, type, weight, path, data, attributes);
};
util.inherits(InMemoryResource, Thywill.getBaseClass("Resource"));
var p = InMemoryResource.prototype;

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = InMemoryResource;
