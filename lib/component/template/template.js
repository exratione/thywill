
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for interfaces to templating systems.
 */
function Template(componentFactory) {
  Template.super_.call(this, componentFactory);
  this.componentType = "template";
};
util.inherits(Template, Component);
var p = Template.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.render = function(templateString, valuesObj) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Template;