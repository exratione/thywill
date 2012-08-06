/**
 * @fileOverview
 * HandlebarsTemplateEngine class definition, a template implementation.
 */

var crypto = require("crypto");
var util = require("util");
var handlebars = require("handlebars");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A class to interface with the Handlebars.js templating system. See:
 * https://github.com/wycats/handlebars.js/
 */
function HandlebarsTemplateEngine() {
  HandlebarsTemplateEngine.super_.call(this);
  // A cache to hold compiled templates.
  this.cache = null;
};
util.inherits(HandlebarsTemplateEngine, Thywill.getBaseClass("TemplateEngine"));
var p = HandlebarsTemplateEngine.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

HandlebarsTemplateEngine.CONFIG_TEMPLATE = {
  templateCacheLength: {
    _configInfo: {
      description: "The maximum number of compiled templates retained in an LRU cache.",
      types: "integer",
      required: true
    } 
  }  
};

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // Create a cache with no timeout for compiled templates.
  this.cache = this.thywill.cacheManager.createCache("handlebars", config.templateCacheLength);
  
  // There are no asynchronous initialization functions here or in the 
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Template#render
 */
p.render = function (template, values) {
  // It seems viable to use the template string itself as the cache key,
  // since it'd just become an object property, and large object properties
  // are generally fine until you hit a hundred thousand characters or so.
  var compiledTemplate = this.cache.get(template);
  if (!compiledTemplate) {
    compiledTemplate = handlebars.compile(template);
    this.cache.set(template, compiledTemplate);
  }
  // Handlebars does the work, and return the resulting templated content.
  return compiledTemplate(values);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = HandlebarsTemplateEngine;
