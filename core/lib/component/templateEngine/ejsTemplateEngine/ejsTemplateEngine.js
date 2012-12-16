/**
 * @fileOverview
 * EJSTemplateEngine class definition, a template implementation.
 */

var ejs = require("ejs");
var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A class to interface with the ejs templating system. See:
 * https://github.com/visionmedia/ejs
 */
function EJSTemplateEngine() {
  EJSTemplateEngine.super_.call(this);
}
util.inherits(EJSTemplateEngine, Thywill.getBaseClass("TemplateEngine"));
var p = EJSTemplateEngine.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

EJSTemplateEngine.CONFIG_TEMPLATE = null;

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
  return ejs.render(template, {locals: values});
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = EJSTemplateEngine;
