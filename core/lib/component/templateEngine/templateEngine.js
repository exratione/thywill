/**
 * @fileOverview
 * TemplateEngine class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for interfaces to templating systems.
 */
function TemplateEngine() {
  TemplateEngine.super_.call(this);
  this.componentType = "template";
};
util.inherits(TemplateEngine, Thywill.getBaseClass("Component"));
var p = TemplateEngine.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Render a template based on a string and replacement tokens.
 * 
 * @param {string} template
 *   The template string, e.g. something along the lines of
 *   "Insert this value: <%= value %>" - but dependent on the implementation
 *   of course.
 * @param {Object} values
 *   An object of key-value pairs to insert into the template.
 * @return {string}
 *   The rendered template.
 */
p.render = function (template, values) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = TemplateEngine;
