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
 *   clientPath: undefined,
 *   // The encoding for the resource data, either in the provided buffer, or
 *   // in the originFilePath.
 *   encoding: "utf8",
 *   // The absolute path of a file containing the resource data. Used for
 *   // piped resources or writing out generated resources that are not going
 *   // to be cached in memory.
 *   filePath: undefined,
 *   // The absolute path of the file that the resource is based on. This might
 *   // be a template file, undefined for a generated resource, or an exact copy
 *   // of the resource data.
 *   originFilePath: undefined,
 *   // A MIME type or other defined type.
 *   type: Resource.TYPES.TEXT,
 *   // Used to order bootstrap resources served to a client immediately on
 *   // connection. e.g. to order Javascript files in a web page.
 *   weight: 0,
 * }
 *
 * Other arbitrary attribute names can be used, but the following names are
 * reserved: buffer.
 *
 * @param {Buffer} buffer
 *   A Buffer instance containing resource data, or null for resources that
 *   are not loaded into memory.
 * @param {Object} [attributes]
 *   Attributes for this resource.
 *
 */
function Resource (buffer, attributes) {
  this.clientPath = undefined;
  this.encoding = "utf8";
  this.filePath = undefined;
  this.originFilePath = undefined;
  this.type = Resource.TYPES.TEXT;
  this.weight = 0;

  // Set the attributes.
  attributes = attributes || {};
  for (var property in attributes) {
    this[property] = attributes[property];
  }

  // TODO: some validation. e.g. clientPath can't be empty.

  // The data buffer.
  this.buffer = buffer;
}
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

/**
 * MIME types are generally used to define different resource types.
 */
Resource.TYPES = {
  // Standard MIME types.
  CSS: "text/css",
  HTML: "text/html",
  JAVASCRIPT: "application/javascript",
  JSON: "application/json",
  TEXT: "text/plain",
  // For templates used by Underscore.js, Handlebars.js, etc.
  TEMPLATE: "text/template"
};

/**
 * If no type can be arrived at, use this type.
 */
Resource.DEFAULT_TYPE = Resource.TYPES.TEXT;

/**
 * Mapping file extensions to default resource types.
 */
Resource.TYPE_BY_EXTENSION = {
  ".css": Resource.TYPES.CSS,
  ".html": Resource.TYPES.HTML,
  ".js": Resource.TYPES.JAVASCRIPT,
  ".json": Resource.TYPES.JSON,
  ".tpl": Resource.TYPES.TEMPLATE,
  ".txt": Resource.TEXT
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
p.isPiped = function () {
  // This should be piped to a client if there is an origin file but no buffer
  // of in-memory data.
  return !this.buffer && this.filePath;
};

/**
 * Is the data for this resource available in memory?
 *
 * @return {boolean}
 *   Return true if this resource has an in-memory buffer of its data.
 */
p.isInMemory = function () {
  if (this.buffer) {
    return true;
  } else {
    return false;
  }
};

/**
 * Output the Resource content as a string if it is held in memory.
 *
 * This function exists to support template rendering. e.g. to render
 * text/template content in the main application page.
 *
 * @return {string|undefined}
 *   A string representation of the resource buffer, or undefined if this is
 *   not an in-memory resource.
 */
p.toString = function () {
  if (this.buffer) {
    return this.buffer.toString(this.encoding);
  } else {
    return undefined;
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
