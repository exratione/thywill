/**
 * @fileOverview
 * Ugly class definition, an ad-hoc minifier for CSS and Javascript.
 */

var async = require("async");
var cleanCss = require('clean-css');
var crypto = require("crypto");
var util = require("util");
var uglify = require("uglify-js");
var Minify = require("../minify");
var Resource = require("../../../resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A class for handling minification and compression of resources using
 * UglifyJS for Javascript and CleanCSS for CSS.
 */
function Ugly() {
  Ugly.super_.call(this);
};
util.inherits(Ugly, Minify);
var p = Ugly.prototype;

//-----------------------------------------------------------
//"Static" parameters
//-----------------------------------------------------------

Ugly.CONFIG_TEMPLATE = {
  jsBasePath: {
   _configInfo: {
      description: "The base path for merged Javascript resources.",
      types: "string",
      required: true
    } 
  },
  cssBasePath: {
   _configInfo: {
      description: "The base path for merged CSS resources.",
      types: "string",
      required: true
    } 
  }
};

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
* @see Component#_configure
*/
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Minify#minifyResource
 */
p.minifyResource = function (resource, callback) {
  var newResource = resource;
  var error = this.NO_ERRORS;
  
  // Only minify if not already minified.
  if (resource.minified) {
    callback.call(this, error, resource);
    return;
  }
  
  try {
    if (resource.type == Resource.TYPE_JAVASCRIPT) {
      // Javascript minification.
      var minifiedJs = this._minifyJavascript(resource.data);
      newResource = new Resource(resource.type, resource.weight, resource.path, minifiedJs);
      newResource.path = this._generateMinifiedPath(newResource.path);
      resource.minified = true;
    } else if (resource.type == Resource.TYPE_CSS) {
      // CSS minification.
      var minifiedCss = this._minifyCss(resource.data);
      newResource = new Resource(resource.type, resource.weight, resource.path, minifiedCss);
      newResource.path = this._generateMinifiedPath(newResource.path);
      resource.minified = true;
    }
  } catch (e) {
    error = "Ugly.minifyResource failed for resource of type [" + resource.type + "] and path [" + resource.path + "] with error: " + e.message;
    self.thywill.log.error(error);
  }

  callback.call(this, error, newResource);
};

/**
 * @see Minify#minifyResources
 */
p.minifyResources = function (resources, minifyJavascript, minifyCss, callback) {
  var self = this;
  // Build a new array of resources in which all of the CSS and JS is
  // merged down into one resource.
  var cssResource = null;
  var jsResource = null;
  // The mapSeries function operates in series on each element in the passed
  // resources array, and builds a new array with the transformed resources.
  async.mapSeries(
    // Array.
    resources, 
    // Iterator.
    function (resource, asyncCallback) {
      var error = self.NO_ERRORS;
      var returnResource = null;
      if (resource.type == Resource.TYPE_JAVASCRIPT && minifyJavascript) {
        // Create the single Javascript-holding resource if not yet done. Give
        // it the same weight as this first Javascript resource in the array.
        if (!jsResource) {
          // Path is empty - set it at the end of this process so we can get
          // an MD5 of the contents.
          jsResource = new Resource(Resource.TYPE_JAVASCRIPT, resource.weight, "", "");
          jsResource.minified = true;
          returnResource = jsResource;
        }
        
        jsResource.data += "\n\n";
        if (resource.minified) {
          jsResource.data += resource.data;
        } else {
          try {
            // Javascript minification.
            jsResource.data += self._minifyJavascript(resource.data);
          } catch (e) {
            error = "Ugly.minifyResources failed to minimize Javascript for path [" + resource.path + "] with error: " + e.message;
            self.thywill.log.error(error);
          }
        }
      } else if (resource.type == Resource.TYPE_CSS && minifyCss) {
        // Create the single CSS-holding resource if not yet done. Give
        // it the same weight as this first Javascript resource in the array.
        if (!cssResource) {
          // Path is empty - set it at the end of this process so we can get
          // an MD5 of the contents.
          cssResource = new Resource(Resource.TYPE_CSS, resource.weight, "", "");
          cssResource.minified = true;
          returnResource = cssResource;
        }
        
        cssResource.data += "\n\n";
        if (resource.minified) {
          cssResource.data += resource.data;
        } else {
          try {
            // CSS minification.
            cssResource.data += self._minifyCss(resource.data);
          } catch (e) {
            error = "Ugly.minifyResources failed to minimize CSS for path [" + resource.path + "] with error: " + e.message;
            self.thywill.log.error(error);
          }
        }
        
      } else {
        // Everything that isn't Javascript or CSS.
        returnResource = resource;
      }
      
      // For all the merged resources we return null, except for the first
      // which will be the single compressed resource. The nulls will be
      // stripped out later. All unminified and unmerged resources are just
      // returned as-is.
      asyncCallback.call(self, error, returnResource);
    },
    // Final callback at the end of the async.mapSeries() operation. Tidy up
    // the list, assemble for the final function callback, and we're done.
    function (error, minifiedResources) { 
      var addedResources = [];
      // Sort out paths, which should be based on MD5 hashes of the data.
      if (jsResource) {
        var md5 = crypto.createHash('md5').update(jsResource.data).digest("hex");
        jsResource.path = self.config.jsBasePath + "/" + md5 + ".min.js";
        addedResources.push(jsResource);
      }
      if (cssResource) {
        var md5 = crypto.createHash('md5').update(cssResource.data).digest("hex");
        cssResource.path = self.config.cssBasePath + "/" + md5 + ".min.css";
        addedResources.push(cssResource);
      }
      
      // Filter out nulls from the removed JS and CSS resources.
      minifiedResources = minifiedResources.filter(function(resource) {
        if (resource) {
          return true;
        }
      });
      callback.call(self, error, minifiedResources, addedResources);
    } 
  );
};

/**
 * Minify Javascript code.
 * 
 * @param {string} code
 *   Javascript code.
 * @return {string}
 *   Return minimized Javascript code.
 */
p._minifyJavascript = function (code) {
  // Parse code and get the initial AST.
  var ast = uglify.parser.parse(code); 
  // Get a new AST with mangled names.
  ast = uglify.uglify.ast_mangle(ast); 
  // Get an AST with compression optimizations.
  ast = uglify.uglify.ast_squeeze(ast); 
  // Compressed code here
  var final_code = uglify.uglify.gen_code(ast); 
  return final_code;
};

/**
 * Minify CSS.
 * 
 * @param {string} css
 *   The CSS to be minified.
 * @return {string}
 *   Return minimized CSS.
 */
p._minifyCss = function(css) {
  return cleanCss.process(css);
};

/**
 * Given a path string, change the filename ending to show minification.
 * e.g. foo.js -> foo.min.js
 * 
 * @param {string} path
 *   A resource path.
 * @return {string}
 *   The path with minified name.
 */
p._generateMinifiedPath = function (path) {
  return path.replace(/\.(\w+)$/, ".min.$1", "i");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Ugly;