/**
 * @fileOverview
 * EmberStore class definition.
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
function EmberStore() {
  EmberStore.super_.call(this);
  this.componentType = "emberStore";
}
util.inherits(EmberStore, Thywill.getBaseClass("Component"));
var p = EmberStore.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------




//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = EmberStore;
