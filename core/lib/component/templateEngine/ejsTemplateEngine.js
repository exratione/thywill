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
// Methods
//-----------------------------------------------------------

/**
 * @see Template#render
 */
p.render = function (template, values) {
  // TODO: caching.
  return ejs.render(template, {locals: values});
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = EJSTemplateEngine;
