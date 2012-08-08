/**
 * @fileOverview
 * Resource class definition.
 */

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Instances represent resources such as CSS and Javascript files. The provided
 * attributes object is important and has the following form and defaults:
 * 
 * {
 *   // Used for accessing the resource through the client, e.g. a URI like
 *   // /my/resource.html
 *   clientPath: null, 
 *   // The encoding for the resource data, either in the provided buffer, or
 *   // in the originFilePath.
 *   encoding: "utf8",
 *   // Set to true if this has no origin file, or the buffer contents do not
 *   // match the origin file contents - e.g. a template in the file, and the
 *   // rendered template in the resource buffer.
 *   isGenerated: false,
 *   // True if the resource has been minified.
 *   minified: false,
 *   // The absolute path of the file that the resource is based on. This might
 *   // be a template file, null for a generated resource, or an exact copy of
 *   // the resource data.
 *   originFilePath: null,
 *   // A MIME type or other defined type.
 *   type: "text/plain",
 *   // Used to order bootstrap resources served to a client immediately on
 *   // connection. e.g. to order Javascript files in a web page.
 *   weight: 0,
 * }
 * 
 * Other arbitrary attribute names can be used, but the following names are
 * reserved: buffer, stored.
 * 
 * @param {Buffer} buffer
 *   A Buffer instance containing resource data, or null for resources that
 *   are not loaded into memory.
 * @param {Object} attributes
 *   Attributes for this resource.
 *   
 */
function Resource(buffer, attributes) {
  this.clientPath = null;
  this.encoding = "utf8";
  this.isGenerated = false;
  this.minified = false;
  this.originFilePath = null;
  this.type = "text/plain";
  this.weight = 0;
  
  // Set the attributes.
  attributes = attributes || {};
  for (var property in attributes) {
    this[property] = attributes[property];
  }
  
  // The data buffer.
  this.buffer = buffer;
  // Is this stored by a resource manager or not?
  this.stored = false;
};
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

/**
 * MIME types are generally used to define different resource types.
 */ 
Resource.TYPES = {
  CSS: "text/css",
  HTML: "text/html",
  JAVASCRIPT: "application/javascript",
  // For templates used by Underscore.js, Handlebars.js, etc.
  TEMPLATE: "text/template"
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Is this a Resource intended to be piped from a file rather than held in
 * memory?
 * 
 * @return {boolean}
 *   Return true is this resource is to be piped from file contents.
 */
p.isPipedResource = function () {
  // This should be piped to a client if there is an origin file but no buffer
  // of in-memory data, and not marked as generated content.
  return !this.buffer && !this.isGenerated && this.originFilePath;
};

/**
 * Return the resource contents as a string, provided that the contents are
 * held in memory.
 * 
 * @return {string}
 *   The resource data.
 */
p.toString = function () {
  if (this.buffer) {
    return this.buffer.toString(this.encoding);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
