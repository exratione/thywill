/**
 * @fileOverview
 * Resource class definition.
 */

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Instances represent resources such as CSS and Javascript files.
 * 
 * @param {Buffer} buffer
 *   A Buffer instance containing the resource data.
 * @param {Object} attributes
 *   Other attributes of this resource. It is expected to set the following:
 *   encoding: e.g. "utf8" or "binary".
 *   path: the path of the resource when accessed via the client.
 *   type: the defined type or other MIME type.
 *   weight: a numeric value for sorting resources.
 *   
 *   The following attribute names are reserved: buffer, stored, asString.
 */
function Resource(buffer, attributes) {
  // Specify some default attributes that expected to be overridden.
  // Encoding for the resource data, e.g. "utf8" or "binary".
  this.encoding = "utf8";
  // Resource path.
  this.path = "/",
  // Usually a MIME type, but can be any other string.
  this.type = "text/plain";
  // For ordering resources
  this.weight = 0;
  
  // Set the attributes.
  attributes = attributes || {};
  for (property in attributes) {
    this[property] = attributes[property];
  }
  
  // The data buffer.
  this.buffer = buffer;
  // Is this stored by a resource manager or not?
  this.stored = false;
  // String representation. 
  // TODO: Doubles size in memory, but very convenient. Issues in the future?
  this.asString = buffer.toString(this.encoding);
};
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

// Mime types used to define different resource types.
Resource.TYPES = {
  CSS: "text/css",
  HTML: "text/html",
  JAVASCRIPT: "application/javascript",
  // For templates used by Underscore.js, Handlebars.js, etc.
  TEMPLATE: "text/template"
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
