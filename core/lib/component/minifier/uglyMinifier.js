/**
 * @fileOverview
 * UglyMinifier class definition, an ad-hoc minifier for CSS and Javascript.
 */

var crypto = require("crypto");
var util = require("util");
var path = require("path");
var async = require("async");
var cleanCss = require("clean-css");
var uglify = require("uglify-js");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A class for handling minification and compression of resources using
 * UglifyJS for Javascript and CleanCSS for CSS.
 */
function UglyMinifier() {
  UglyMinifier.super_.call(this);
}
util.inherits(UglyMinifier, Thywill.getBaseClass("Minifier"));
var p = UglyMinifier.prototype;

//-----------------------------------------------------------
//"Static" parameters
//-----------------------------------------------------------

UglyMinifier.CONFIG_TEMPLATE = {
  jsBaseClientPath: {
    _configInfo: {
      description: "The base path for client access to merged Javascript resources.",
      types: "string",
      required: true
    }
  },
  cssBaseClientPath: {
    _configInfo: {
      description: "The base path for client access to merged CSS resources.",
      types: "string",
      required: true
    }
  }
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
  var resourceManager = this.thywill.resourceManager;

  // Only minify if not already minified.
  if (resource.minified) {
    callback(error, resource);
    return;
  }

  try {
    var minifiedData;
    if (resource.type === resourceManager.types.JAVASCRIPT) {
      // Javascript minification.
      minifiedData = this._minifyJavascript(resource);
    } else if (resource.type === resourceManager.types.CSS) {
      // CSS minification.
      minifiedData = this._minifyCss(resource);
    }
    newResource = resourceManager.createResource(minifiedData, {
      clientPath: this._generateMinifiedClientPath(resource.clientPath),
      encoding: resource.encoding,
      minified: true,
      originFilePath: resource.originFilePath,
      type: resource.type,
      weight: resource.weight
    });
  } catch (e) {
    this.thywill.log.error(e);
  }

  callback.call(this, error, newResource);
};

/**
 * @see Minify#minifyResources
 */
p.minifyResources = function (resources, minifyJavascript, minifyCss, callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;
  // Build a new array of resources in which all of the CSS and JS is
  // merged down into one resource.
  var cssResource = null;
  var minifiedCss = "";
  var jsResource = null;
  var minifiedJs = "";

  // The mapSeries function operates in series on each element in the passed
  // resources array, and builds a new array with the transformed resources.
  async.mapSeries(
    // Array.
    resources,
    // Iterator.
    function (resource, asyncCallback) {
      var error = self.NO_ERRORS;
      var returnResource = null;
      if (resource.type === resourceManager.types.JAVASCRIPT && minifyJavascript) {
        // Create the single Javascript-holding resource if not yet done. Give
        // it the same weight and encoding as this first Javascript resource in
        // the array.
        if (!jsResource) {
          // Path is empty - set it at the end of this process so we can get
          // an MD5 of the contents.
          jsResource = resourceManager.createResource(null, {
            clientPath: null,
            encoding: resource.encoding,
            minified: true,
            originFilePath: null,
            type: resourceManager.types.JAVASCRIPT,
            weight: resource.weight
          });
          returnResource = jsResource;
        }

        if (resource.buffer && resource.minified) {
          // Have to put in a semicolon at the end because of things like Bootstrap
          // which leave off the trailing semicolon.
          minifiedJs += resource.buffer.toString(resource.encoding) + ";\n";
        } else {
          try {
          // Have to put in a semicolon at the end because of things like Bootstrap
          // which leave off the trailing semicolon.
            minifiedJs += self._minifyJavascript(resource) + ";\n";
          } catch (e) {
            self.thywill.log.error(e);
          }
        }
      } else if (resource.type === resourceManager.types.CSS && minifyCss) {
        // Create the single CSS-holding resource if not yet done. Give
        // it the same weight as this first Javascript resource in the array.
        if (!cssResource) {
          // Path is empty - set it at the end of this process so we can get
          // an MD5 of the contents.
          cssResource = resourceManager.createResource(null, {
            clientPath: null,
            encoding: resource.encoding,
            minified: true,
            originFilePath: null,
            type: resourceManager.types.CSS,
            weight: resource.weight
          });
          returnResource = cssResource;
        }

        if (resource.minified) {
          minifiedCss += resource.buffer.toString(resource.encoding) + "\n";
        } else {
          try {
            // CSS minification.
            minifiedCss += self._minifyCss(resource) + "\n";
          } catch (e) {
            self.thywill.log.error(e);
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
      asyncCallback(error, returnResource);
    },
    // Final callback at the end of the async.mapSeries() operation. Tidy up
    // the list, assemble for the final function callback, and we're done.
    function (error, minifiedResources) {
      var addedResources = [];
      // Sort out content and paths, which should be based on MD5 hashes of
      // the data.
      var md5;
      if (jsResource) {
        jsResource.buffer = new Buffer(minifiedJs, jsResource.encoding);
        md5 = crypto.createHash('md5').update(minifiedJs).digest("hex");
        jsResource.clientPath = self.config.jsBaseClientPath + "/" + md5 + ".min.js";
        addedResources.push(jsResource);
      }
      if (cssResource) {
        cssResource.buffer = new Buffer(minifiedCss, cssResource.encoding);
        md5 = crypto.createHash('md5').update(minifiedCss).digest("hex");
        cssResource.clientPath = self.config.cssBaseClientPath + "/" + md5 + ".min.css";
        addedResources.push(cssResource);
      }

      // Filter out nulls from the removed JS and CSS resources.
      minifiedResources = minifiedResources.filter(function(resource) {
        if (resource) {
          return true;
        }
      });
      callback(error, minifiedResources, addedResources);
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
p._minifyJavascript = function (resource) {
  var code = "";
  if (resource.buffer && resource.encoding) {
    code = resource.buffer.toString(resource.encoding);
  } else {
    this.thywill.log.error(new Error("Trying to minify Javascript resource that is missing either its buffer or encoding: " + resource.clientPath));
  }

  // Parse code and get the initial AST.
  var ast = uglify.parser.parse(code);
  // Get a new AST with mangled names.
  ast = uglify.uglify.ast_mangle(ast);
  // Get an AST with compression optimizations.
  ast = uglify.uglify.ast_squeeze(ast);
  // Compressed code here
  return uglify.uglify.gen_code(ast);
};

/**
 * Minify CSS.
 *
 * @param {string} css
 *   The CSS to be minified.
 * @return {string}
 *   Return minimized CSS.
 */
p._minifyCss = function(resource) {
  var css = "";
  if (resource.buffer && resource.encoding) {
    css = resource.buffer.toString(resource.encoding);
  } else {
    this.thywill.log.error(new Error("Trying to minify Javascript resource that is missing either its buffer or encoding: " + resource.clientPath));
  }
  css = this._updateCssUrls(css, resource.clientPath);
  return cleanCss.process(css);
};

/**
 * When aggregating minified CSS into a new resource with a new client path,
 * any relative url() entries must be turned into absolute url() entries.
 *
 * @param {string} css
 *   The CSS to be altered.
 * @param {string} clientPath
 *   The client path of the CSS resource pre-minification.
 * @return {string}
 *   CSS with altered url() paths.
 */
p._updateCssUrls = function (css, clientPath) {
  return css.replace(/url\("?'?([^\/)"'][^)"']+)'?"?\)/g, function (match, url) {
    url = path.join(path.dirname(clientPath), url);
    return "url(" + url + ")";
  });
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
p._generateMinifiedClientPath = function (path) {
  return path.replace(/\.(\w+)$/, ".min.$1", "i");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = UglyMinifier;
