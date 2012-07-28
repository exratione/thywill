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
 * @data {string} data
 *   The body of the resource.
 */
function Resource(type, weight, path, data) {
  this.type = type;
  this.weight = weight;
  this.path = path;
  this.data = data;
};
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

Resource.TYPE_JAVASCRIPT = "application/javascript";
Resource.TYPE_CSS = "text/css";
Resource.TYPE_HTML = "text/html";

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
