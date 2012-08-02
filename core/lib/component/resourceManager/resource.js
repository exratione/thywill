/**
 * @fileOverview
 * Resource class definition.
 */

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Instances represent resources such as CSS and Javascript.
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
 *   Other attributes of this resource.
 */
function Resource(type, weight, path, data, attributes) {
  this.type = type;
  this.weight = weight;
  this.path = path;
  this.data = data;
  this.attributes = attributes || {};
};
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

Resource.TYPES = {
  JAVASCRIPT: "application/javascript",
  CSS: "text/css",
  HTML: "text/html",
  // For templates used by Underscore.js, Handlebars.js, etc.
  TEMPLATE: "text/template"
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
